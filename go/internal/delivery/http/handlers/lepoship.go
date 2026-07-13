package handlers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"trading/control-gateway/internal/domain/repositories"
	pgrepo "trading/control-gateway/internal/repository/postgres"
	"trading/control-gateway/internal/usecase/lepoship"
)

type LepoShipHandler struct {
	service *lepoship.Service
	redis   *redis.Client
}

func NewLepoShipHandler(service *lepoship.Service, redisClient *redis.Client) *LepoShipHandler {
	return &LepoShipHandler{service: service, redis: redisClient}
}

func (h *LepoShipHandler) MapPublicRoutes(r *gin.Engine) {
	r.POST("/api/v1/telemetry", h.withSDK("telemetry:write", h.ingestTelemetry))
	r.POST("/api/bundles/telemetry", h.withSDK("telemetry:write", h.ingestTelemetry))
	r.GET("/api/v1/ota/check", h.withSDK("ota:read", h.checkOTA))
	r.POST("/api/v1/entitlements/verify", h.withSDK("license:verify", h.verifyLicense))
}

func (h *LepoShipHandler) MapInternalRoutes(r *gin.Engine) {
	r.POST("/api/v1/releases/upload", h.withSignedInternal(h.releaseUpload))
	r.POST("/api/v1/entitlements/license", h.withSignedInternal(h.issueLicense))
	r.POST("/api/internal/cron/:job/run", h.withSignedInternal(h.runCronJob))
}

type sdkHandler func(*gin.Context, repositories.SDKIdentity)
type internalHandler func(*gin.Context, uuid.UUID)

func (h *LepoShipHandler) withSDK(scope string, next sdkHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
		if token == "" {
			writeError(c, http.StatusUnauthorized, "missing SDK bearer token")
			return
		}
		identity, err := h.service.AuthenticateSDKToken(c.Request.Context(), token, scope)
		if err != nil {
			writeMappedError(c, err)
			return
		}
		next(c, *identity)
	}
}

func (h *LepoShipHandler) withSignedInternal(next internalHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := verifyInternalSignature(c, h.redis)
		if err != nil {
			writeError(c, http.StatusUnauthorized, err.Error())
			return
		}
		next(c, userID)
	}
}

func (h *LepoShipHandler) ingestTelemetry(c *gin.Context, identity repositories.SDKIdentity) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 256*1024)
	var payload repositories.TelemetryPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid telemetry payload")
		return
	}
	if c.GetHeader("X-Request-ID") == "" {
		writeError(c, http.StatusBadRequest, "x-request-id is required")
		return
	}
	result, err := h.service.IngestTelemetry(c.Request.Context(), identity, payload, c.ClientIP())
	if err != nil {
		writeMappedError(c, err)
		return
	}
	c.JSON(http.StatusAccepted, result)
}

func (h *LepoShipHandler) checkOTA(c *gin.Context, identity repositories.SDKIdentity) {
	var req repositories.OTACheckRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		writeError(c, http.StatusBadRequest, "invalid OTA query")
		return
	}
	resp, err := h.service.CheckOTA(c.Request.Context(), identity, req)
	if err != nil {
		writeMappedError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *LepoShipHandler) releaseUpload(c *gin.Context, userID uuid.UUID) {
	if !strings.HasPrefix(c.GetHeader("Content-Type"), "multipart/form-data") {
		writeError(c, http.StatusUnsupportedMediaType, "multipart/form-data is required")
		return
	}
	reader, err := c.Request.MultipartReader()
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid multipart upload")
		return
	}
	fields := map[string]string{
		"bundleId":    c.GetHeader("X-LepoS-Bundle-ID"),
		"checksum":    c.GetHeader("X-Artifact-SHA256"),
		"idempotency": c.GetHeader("Idempotency-Key"),
	}
	for {
		part, err := reader.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			writeError(c, http.StatusBadRequest, "invalid multipart part")
			return
		}
		name := part.FormName()
		if name != "file" {
			value, _ := io.ReadAll(io.LimitReader(part, 64*1024))
			fields[name] = string(value)
			continue
		}
		bundleID, err := uuid.Parse(fields["bundleId"])
		if err != nil {
			writeError(c, http.StatusBadRequest, "bundleId is required")
			return
		}
		buildNumber, err := strconv.Atoi(fields["buildNumber"])
		if err != nil {
			writeError(c, http.StatusBadRequest, "buildNumber is required")
			return
		}
		resp, err := h.service.CreateReleaseUpload(c.Request.Context(), repositories.ReleaseUploadRequest{
			UserID: userID, BundleID: bundleID, Version: fields["version"], BuildNumber: buildNumber,
			Channel: fields["channel"], ReleaseNotes: fields["releaseNotes"], IdempotencyKey: fields["idempotency"],
			ChecksumSHA256: fields["checksum"], FileName: part.FileName(), ContentType: part.Header.Get("Content-Type"),
		}, part, -1)
		if err != nil {
			writeMappedError(c, err)
			return
		}
		c.JSON(http.StatusAccepted, resp)
		return
	}
	writeError(c, http.StatusBadRequest, "file part is required")
}

func (h *LepoShipHandler) issueLicense(c *gin.Context, userID uuid.UUID) {
	var body struct {
		BundleID        string `json:"bundleId"`
		EntitlementType string `json:"entitlementType"`
		DeviceLimit     int    `json:"deviceLimit"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "invalid license request")
		return
	}
	bundleID, err := uuid.Parse(body.BundleID)
	if err != nil {
		writeError(c, http.StatusBadRequest, "bundleId is required")
		return
	}
	resp, err := h.service.IssueLicense(c.Request.Context(), repositories.LicenseIssueRequest{
		UserID: userID, BundleID: bundleID, EntitlementType: body.EntitlementType, DeviceLimit: body.DeviceLimit,
	})
	if err != nil {
		writeMappedError(c, err)
		return
	}
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusOK, resp)
}

func (h *LepoShipHandler) verifyLicense(c *gin.Context, identity repositories.SDKIdentity) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 8*1024)
	var req repositories.LicenseVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writeError(c, http.StatusBadRequest, "invalid license verification request")
		return
	}
	resp, err := h.service.VerifyLicense(c.Request.Context(), identity, req)
	if err != nil {
		writeMappedError(c, err)
		return
	}
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusOK, resp)
}

func (h *LepoShipHandler) runCronJob(c *gin.Context, _ uuid.UUID) {
	job := c.Param("job")
	resp, err := h.service.RunCronJob(c.Request.Context(), job)
	if err != nil {
		writeMappedError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "processed": resp.Processed, "skipped": resp.Skipped, "job": resp.Job, "message": resp.Message})
}

func verifyInternalSignature(c *gin.Context, redisClient *redis.Client) (uuid.UUID, error) {
	secret := os.Getenv("LEPOS_SERVICE_SECRET")
	if secret == "" {
		return uuid.Nil, errors.New("service signing is not configured")
	}
	userIDRaw := c.GetHeader("X-LepoS-User-ID")
	serviceID := c.GetHeader("X-LepoS-Service-ID")
	timestamp := c.GetHeader("X-LepoS-Timestamp")
	nonce := c.GetHeader("X-LepoS-Nonce")
	signature := c.GetHeader("X-LepoS-Signature")
	if userIDRaw == "" || serviceID == "" || timestamp == "" || nonce == "" || signature == "" {
		return uuid.Nil, errors.New("missing internal signature headers")
	}
	userID, err := uuid.Parse(userIDRaw)
	if err != nil {
		return uuid.Nil, errors.New("invalid signed user")
	}
	ts, err := time.Parse(time.RFC3339, timestamp)
	if err != nil || time.Since(ts) > 5*time.Minute || time.Until(ts) > 5*time.Minute {
		return uuid.Nil, errors.New("stale internal signature")
	}
	if redisClient != nil {
		key := "lepos:internal-nonce:" + nonce
		ok, err := redisClient.SetNX(context.Background(), key, "1", 5*time.Minute).Result()
		if err != nil {
			return uuid.Nil, fmt.Errorf("nonce check failed: %w", err)
		}
		if !ok {
			return uuid.Nil, errors.New("replayed internal signature")
		}
	}
	canonical := strings.Join([]string{
		c.Request.Method,
		c.Request.URL.Path,
		timestamp,
		nonce,
		userIDRaw,
		serviceID,
		c.GetHeader("X-LepoS-Bundle-ID"),
		c.GetHeader("X-Artifact-SHA256"),
		c.GetHeader("Idempotency-Key"),
	}, "\n")
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(canonical))
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(signature)) {
		return uuid.Nil, errors.New("invalid internal signature")
	}
	return userID, nil
}

func writeMappedError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, pgrepo.ErrUnauthorized):
		writeError(c, http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, pgrepo.ErrForbidden):
		writeError(c, http.StatusForbidden, "forbidden")
	case errors.Is(err, pgrepo.ErrBadRequest):
		writeError(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, pgrepo.ErrNotFound):
		writeError(c, http.StatusNotFound, err.Error())
	case errors.Is(err, pgrepo.ErrConflict):
		writeError(c, http.StatusConflict, err.Error())
	default:
		writeError(c, http.StatusInternalServerError, "internal server error")
	}
}

func writeError(c *gin.Context, status int, detail string) {
	c.JSON(status, gin.H{"error": detail})
}
