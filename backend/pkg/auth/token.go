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

type tokenClaims struct {
	Purpose string `json:"purpose"`
	jwt.RegisteredClaims
}

func GenerateToken(userId uint) (string, error) {
	return signToken(newTokenClaims(userId, PurposeAuthAccess, nil))
}

func GenerateEmailVerificationToken(userID uint) (string, error) {
	expiresAt := time.Now().Add(72 * time.Hour)
	return signToken(newTokenClaims(userID, PurposeEmailVerification, &expiresAt))
}

func ValidateToken(tokenString string) (*tokenClaims, error) {
	secret := os.Getenv("JWT_SECRET")
	claims := &tokenClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Metodo esperado: %v", token.Header["alg"])
		}

		return []byte(secret), nil
	})
	if err != nil || token == nil || !token.Valid {
		return nil, errors.New("token invalido")
	}

	return claims, nil
}

func ValidateAccessToken(tokenString string) (uint, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, err
	}

	if claims.Purpose != PurposeAuthAccess {
		return 0, errors.New("token invalido")
	}

	return extractSubjectUserID(claims.Subject)
}

func ValidateEmailVerificationToken(tokenString string) (uint, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, err
	}

	if claims.Purpose != PurposeEmailVerification {
		return 0, errors.New("token invalido")
	}

	return extractSubjectUserID(claims.Subject)
}

func extractSubjectUserID(subject string) (uint, error) {
	if subject == "" {
		return 0, errors.New("token invalido")
	}

	parsed, err := strconv.ParseUint(subject, 10, 64)
	if err != nil || parsed == 0 {
		return 0, errors.New("token invalido")
	}

	return uint(parsed), nil
}

func newTokenClaims(userID uint, purpose string, expiresAt *time.Time) tokenClaims {
	claims := tokenClaims{
		Purpose: purpose,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: strconv.FormatUint(uint64(userID), 10),
		},
	}

	if expiresAt != nil {
		claims.ExpiresAt = jwt.NewNumericDate(*expiresAt)
	}

	return claims
}

func signToken(claims jwt.Claims) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
