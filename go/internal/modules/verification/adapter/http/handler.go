package http

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"trading/control-gateway/internal/modules/verification/application"
	"trading/control-gateway/internal/modules/verification/domain"
)

type Handler struct {
	service *application.Service
	redis   *redis.Client
	secret  string
}

func New(service *application.Service, redisClient *redis.Client, secret string) *Handler {
	return &Handler{service: service, redis: redisClient, secret: secret}
}

func (h *Handler) MapRoutes(router *gin.Engine) {
	router.GET("/api/v1/releases/:releaseId/verification", h.signed(h.release))
	router.GET("/api/v1/verification-runs/:runId", h.signed(h.run))
	router.GET("/api/v1/verification-runs/:runId/tasks", h.signed(h.tasks))
	router.GET("/api/v1/verification-runs/:runId/findings", h.signed(h.findings))
	router.GET("/api/v1/verification-runs/:runId/report", h.signed(h.report))
	router.POST("/api/v1/releases/:releaseId/verification/retry", h.signed(h.retry))
	router.POST("/api/v1/verification-runs/:runId/cancel", h.signed(h.cancel))
	router.POST("/api/internal/v1/verification/attempts/:attemptId/result", h.signed(h.result))
	router.POST("/api/internal/v1/verification/attempts/:attemptId/heartbeat", h.signed(h.heartbeat))
}

func (h *Handler) release(c *gin.Context) {
	raw, err := h.service.ReleaseJSON(c.Request.Context(), c.Param("releaseId"))
	h.raw(c, raw, err)
}
func (h *Handler) run(c *gin.Context) {
	raw, err := h.service.RunJSON(c.Request.Context(), c.Param("runId"))
	h.raw(c, raw, err)
}
func (h *Handler) tasks(c *gin.Context) {
	raw, err := h.service.TasksJSON(c.Request.Context(), c.Param("runId"))
	h.raw(c, raw, err)
}
func (h *Handler) findings(c *gin.Context) {
	raw, err := h.service.FindingsJSON(c.Request.Context(), c.Param("runId"))
	h.raw(c, raw, err)
}
func (h *Handler) report(c *gin.Context) {
	raw, err := h.service.ReportJSON(c.Request.Context(), c.Param("runId"))
	h.raw(c, raw, err)
}

func (h *Handler) retry(c *gin.Context) {
	id := c.Param("releaseId")
	runID, created, err := h.service.RetryRelease(c.Request.Context(), id, c.GetHeader("Idempotency-Key"))
	if err != nil {
		problem(c, http.StatusConflict, "verification_retry_failed", err.Error())
		return
	}
	location := "/api/v1/verification-runs/" + runID
	c.Header("Location", location)
	c.JSON(http.StatusAccepted, gin.H{"runId": runID, "created": created, "location": location})
}
func (h *Handler) cancel(c *gin.Context) {
	if c.GetHeader("Idempotency-Key") == "" {
		problem(c, http.StatusBadRequest, "idempotency_key_required", "Idempotency-Key is required")
		return
	}
	if err := h.service.Cancel(c.Request.Context(), c.Param("runId")); err != nil {
		problem(c, http.StatusConflict, "verification_cancel_failed", err.Error())
		return
	}
	c.Status(http.StatusAccepted)
}
func (h *Handler) result(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 2<<20)
	var result domain.ResultEnvelope
	if err := c.ShouldBindJSON(&result); err != nil {
		problem(c, http.StatusBadRequest, "invalid_verification_result", err.Error())
		return
	}
	if result.AttemptID == "" {
		result.AttemptID = c.Param("attemptId")
	}
	if result.AttemptID != c.Param("attemptId") {
		problem(c, http.StatusBadRequest, "attempt_mismatch", "attemptId path and payload differ")
		return
	}
	runID, accepted, err := h.service.AcceptResult(c.Request.Context(), result)
	if err != nil {
		problem(c, http.StatusConflict, "verification_result_rejected", err.Error())
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"runId": runID, "attemptId": result.AttemptID, "accepted": accepted})
}

func (h *Handler) heartbeat(c *gin.Context) {
	var payload struct {
		LeaseOwner string `json:"leaseOwner"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || payload.LeaseOwner == "" {
		problem(c, http.StatusBadRequest, "invalid_heartbeat", "leaseOwner is required")
		return
	}
	if err := h.service.Heartbeat(c.Request.Context(), c.Param("attemptId"), payload.LeaseOwner); err != nil {
		problem(c, http.StatusConflict, "heartbeat_rejected", err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) raw(c *gin.Context, raw []byte, err error) {
	if err != nil {
		problem(c, http.StatusNotFound, "verification_not_found", err.Error())
		return
	}
	c.Data(http.StatusOK, "application/json", raw)
}

func (h *Handler) signed(next gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := verify(c, h.redis, h.secret); err != nil {
			problem(c, http.StatusUnauthorized, "invalid_service_signature", err.Error())
			return
		}
		next(c)
	}
}

func verify(c *gin.Context, redisClient *redis.Client, secret string) error {
	if secret == "" {
		return errors.New("service signing is not configured")
	}
	userID, serviceID, timestamp, nonce, signature := c.GetHeader("X-LepoS-User-ID"), c.GetHeader("X-LepoS-Service-ID"), c.GetHeader("X-LepoS-Timestamp"), c.GetHeader("X-LepoS-Nonce"), c.GetHeader("X-LepoS-Signature")
	if userID == "" || serviceID == "" || timestamp == "" || nonce == "" || signature == "" {
		return errors.New("missing internal signature headers")
	}
	if _, err := uuid.Parse(userID); err != nil {
		return errors.New("invalid signed user")
	}
	ts, err := time.Parse(time.RFC3339, timestamp)
	if err != nil || time.Since(ts) > 5*time.Minute || time.Until(ts) > 5*time.Minute {
		return errors.New("stale internal signature")
	}
	if redisClient != nil {
		ok, err := redisClient.SetNX(context.Background(), "lepos:internal-nonce:"+nonce, "1", 5*time.Minute).Result()
		if err != nil {
			return err
		}
		if !ok {
			return errors.New("replayed internal signature")
		}
	}
	canonical := strings.Join([]string{c.Request.Method, c.Request.URL.Path, timestamp, nonce, userID, serviceID, c.GetHeader("X-LepoS-Bundle-ID"), c.GetHeader("X-Artifact-SHA256"), c.GetHeader("Idempotency-Key")}, "\n")
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(canonical))
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(signature)) {
		return errors.New("invalid internal signature")
	}
	return nil
}

func problem(c *gin.Context, status int, code, detail string) {
	c.Header("Content-Type", "application/problem+json")
	c.JSON(status, gin.H{"type": "https://lepos.dev/problems/" + code, "title": code, "status": status, "detail": detail, "instance": c.Request.URL.Path})
}
