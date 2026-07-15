package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/repositories"
)

func writeStorefrontError(c *gin.Context, err error) {
	status, message := http.StatusInternalServerError, "internal server error"
	switch {
	case errors.Is(err, repositories.ErrBadRequest):
		status, message = http.StatusBadRequest, safeError(err)
	case errors.Is(err, repositories.ErrUnauthorized):
		status, message = http.StatusUnauthorized, "unauthorized"
	case errors.Is(err, repositories.ErrForbidden):
		status, message = http.StatusForbidden, "forbidden"
	case errors.Is(err, repositories.ErrNotFound):
		status, message = http.StatusNotFound, "not found"
	case errors.Is(err, repositories.ErrConflict):
		status, message = http.StatusConflict, "conflict"
	case errors.Is(err, repositories.ErrUnavailable):
		status, message = http.StatusServiceUnavailable, "service unavailable"
	}
	c.JSON(status, gin.H{"error": message})
}

func safeError(err error) string {
	if err == nil {
		return "bad request"
	}
	return err.Error()
}
