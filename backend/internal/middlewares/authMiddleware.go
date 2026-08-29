package middlewares

import (
	"errors"
	"fitcha/pkg/auth"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")

		if header == "" {
			AbortWithError(c, http.StatusUnauthorized, errors.New("Token dont exist"))
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")

		userID, err := auth.ValidateAccessToken(tokenString)
		if err != nil {
			AbortWithError(c, http.StatusUnauthorized, errors.New("Token invalid"))
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
