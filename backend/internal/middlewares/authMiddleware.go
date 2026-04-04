package middlewares

import (
	"fitcha/pkg/auth"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")

		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token dont exist"})
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")

		token, err := auth.ValidateToken(tokenString)
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token invalid"})
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			userID, err := parseUserID(claims["sub"])
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token invalid"})
				return
			}

			c.Set("userID", userID)
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token invalid"})
			return
		}

		c.Next()
	}
}

func parseUserID(value any) (uint, error) {
	switch userID := value.(type) {
	case float64:
		return uint(userID), nil
	case uint:
		return userID, nil
	case int:
		return uint(userID), nil
	case int64:
		return uint(userID), nil
	case string:
		parsed, err := strconv.ParseUint(userID, 10, 64)
		if err != nil {
			return 0, err
		}

		return uint(parsed), nil
	default:
		return 0, strconv.ErrSyntax
	}
}
