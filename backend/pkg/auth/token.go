package auth

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	PurposeAuthAccess        = "auth_access"
	PurposeEmailVerification = "email_verification"
)

func GenerateToken(userId uint) (string, error) {
	return signToken(jwt.MapClaims{
		"sub":     userId,
		"purpose": PurposeAuthAccess,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})
}

func GenerateEmailVerificationToken(userID uint) (string, error) {
	return signToken(jwt.MapClaims{
		"sub":     userID,
		"purpose": PurposeEmailVerification,
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

func ValidateAccessToken(tokenString string) (uint, error) {
	token, err := ValidateToken(tokenString)
	if err != nil || token == nil || !token.Valid {
		return 0, errors.New("token invalido")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("claims invalidos")
	}

	if purposeValue, hasPurpose := claims["purpose"]; hasPurpose {
		purpose, ok := purposeValue.(string)
		if !ok || purpose != PurposeAuthAccess {
			return 0, errors.New("token invalido")
		}
	}

	return extractSubjectUserID(claims)
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

	if claims["purpose"] != PurposeEmailVerification {
		return 0, errors.New("token invalido")
	}

	return extractSubjectUserID(claims)
}

func extractSubjectUserID(claims jwt.MapClaims) (uint, error) {
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
