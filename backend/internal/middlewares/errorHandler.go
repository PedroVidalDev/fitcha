package middlewares

import (
	"fmt"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

const (
	errorStatusKey  = "errorStatus"
	errorPayloadKey = "errorPayload"
	errorStackKey   = "errorStack"
)

func AbortWithError(ctx *gin.Context, status int, err error) {
	ctx.Set(errorStatusKey, status)
	ctx.Set(errorStackKey, string(debug.Stack()))
	_ = ctx.Error(err)
	ctx.Abort()
}

func AbortWithErrorPayload(ctx *gin.Context, status int, err error, payload gin.H) {
	ctx.Set(errorStatusKey, status)
	ctx.Set(errorPayloadKey, payload)
	ctx.Set(errorStackKey, string(debug.Stack()))
	_ = ctx.Error(err)
	ctx.Abort()
}

func RecordError(ctx *gin.Context, status int, err error) {
	ctx.Set(errorStatusKey, status)
	ctx.Set(errorStackKey, string(debug.Stack()))
	_ = ctx.Error(err)
}

func ErrorHandler(repo repositories.IErrorLogRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 {
			return
		}

		err := c.Errors.Last().Err

		status := http.StatusInternalServerError
		if raw, ok := c.Get(errorStatusKey); ok {
			if parsed, ok := raw.(int); ok {
				status = parsed
			}
		}

		payload := gin.H{"error": err.Error()}
		if raw, ok := c.Get(errorPayloadKey); ok {
			if parsed, ok := raw.(gin.H); ok {
				payload = parsed
			}
		}

		persistError(repo, c, err.Error(), status, readStack(c))

		if c.Writer.Written() {
			return
		}

		c.AbortWithStatusJSON(status, payload)
	}
}

func Recovery(repo repositories.IErrorLogRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				persistError(repo, c, fmt.Sprintf("panic: %v", r), http.StatusInternalServerError, string(debug.Stack()))

				if c.Writer.Written() {
					c.Abort()
					return
				}

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "erro interno"})
			}
		}()

		c.Next()
	}
}

func readStack(c *gin.Context) string {
	if raw, ok := c.Get(errorStackKey); ok {
		if parsed, ok := raw.(string); ok {
			return parsed
		}
	}

	return ""
}

func persistError(repo repositories.IErrorLogRepository, c *gin.Context, message string, status int, stackTrace string) {
	logEntry := models.ErrorLog{
		Message:    message,
		StackTrace: stackTrace,
		Method:     c.Request.Method,
		Path:       c.Request.URL.Path,
		StatusCode: status,
		Resolved:   false,
	}

	if err := repo.Create(logEntry); err != nil {
		log.Printf("falha ao registrar erro: %v", err)
	}
}
