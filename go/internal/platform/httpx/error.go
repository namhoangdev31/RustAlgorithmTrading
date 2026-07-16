package httpx

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/shared/apperror"
)

func WriteError(c *gin.Context, err error) {
	log.Printf("[HTTPX_ERROR] Handler failed with error: %+v", err)
	status := http.StatusInternalServerError
	message := "internal server error"
	switch {
	case apperror.IsCode(err, apperror.CodeInvalidArgument):
		status, message = http.StatusBadRequest, "bad request"
	case apperror.IsCode(err, apperror.CodeUnauthorized):
		status, message = http.StatusUnauthorized, "unauthorized"
	case apperror.IsCode(err, apperror.CodeForbidden):
		status, message = http.StatusForbidden, "forbidden"
	case apperror.IsCode(err, apperror.CodeNotFound):
		status, message = http.StatusNotFound, "not found"
	case apperror.IsCode(err, apperror.CodeConflict):
		status, message = http.StatusConflict, "conflict"
	case apperror.IsCode(err, apperror.CodeUnavailable):
		status, message = http.StatusServiceUnavailable, "service unavailable"
	}
	c.AbortWithStatusJSON(status, gin.H{"error": message})
}
