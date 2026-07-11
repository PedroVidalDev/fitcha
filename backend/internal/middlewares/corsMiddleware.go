package middlewares

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := parseAllowedOrigins(os.Getenv("CORS_ALLOWED_ORIGINS"))

	return func(ctx *gin.Context) {
		origin := ctx.GetHeader("Origin")

		if origin != "" {
			allowOrigin := resolveAllowedOrigin(origin, allowedOrigins)
			if allowOrigin != "" {
				ctx.Header("Access-Control-Allow-Origin", allowOrigin)
				ctx.Header("Vary", "Origin")
			}
		}

		ctx.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		ctx.Header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, Origin, X-App-Update-Token")
		ctx.Header("Access-Control-Max-Age", "86400")

		if ctx.Request.Method == http.MethodOptions {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}

		ctx.Next()
	}
}

func parseAllowedOrigins(rawOrigins string) []string {
	rawOrigins = strings.TrimSpace(rawOrigins)
	if rawOrigins == "" {
		return []string{"*"}
	}

	parts := strings.Split(rawOrigins, ",")
	origins := make([]string, 0, len(parts))

	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return []string{"*"}
	}

	return origins
}

func resolveAllowedOrigin(origin string, allowedOrigins []string) string {
	for _, allowedOrigin := range allowedOrigins {
		if allowedOrigin == "*" || allowedOrigin == origin {
			return allowedOrigin
		}
	}

	return ""
}
