package auth

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userId uint) (string, error) {
	return signToken(jwt.MapClaims{
		"sub": userId,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})
}

func GenerateEmailVerificationToken(userID uint) (string, error) {
	return signToken(jwt.MapClaims{
		"sub":     userID,
		"purpose": "email_verification",
		"exp":     time.Now().Add(72 * time.Hour).Unix(),
	})
}

func ValidateToken(tokenString string) (*jwt.Token, error) {
	secret := os.Getenv("JWT_SECRET")

	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Metodo esperado: %v", token.Header["alg"])
		}

		return []byte(secret), nil
	})
}

func ValidateEmailVerificationToken(tokenString string) (uint, error) {
	token, err := ValidateToken(tokenString)
	if err != nil || token == nil || !token.Valid {
		return 0, errors.New("token invalido")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("claims invalidos")
	}

	if claims["purpose"] != "email_verification" {
		return 0, errors.New("token invalido")
	}

	sub, ok := claims["sub"]
	if !ok {
		return 0, errors.New("token invalido")
	}

	switch typed := sub.(type) {
	case float64:
		return uint(typed), nil
	case string:
		parsed, err := strconv.ParseUint(typed, 10, 64)
		if err != nil {
			return 0, err
		}

		return uint(parsed), nil
	default:
		return 0, errors.New("token invalido")
	}
}

func signToken(claims jwt.MapClaims) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
