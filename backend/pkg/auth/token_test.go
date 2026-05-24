package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestValidateAccessTokenAcceptsLegacyTokenWithoutPurpose(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	legacyToken, err := signToken(jwt.MapClaims{
		"sub": 7,
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	if err != nil {
		t.Fatalf("failed to sign legacy token: %v", err)
	}

	userID, err := ValidateAccessToken(legacyToken)
	if err != nil {
		t.Fatalf("expected legacy token to be accepted, got error: %v", err)
	}

	if userID != 7 {
		t.Fatalf("expected userID 7, got %d", userID)
	}
}

func TestValidateAccessTokenRejectsEmailVerificationToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	token, err := GenerateEmailVerificationToken(12)
	if err != nil {
		t.Fatalf("failed to generate email verification token: %v", err)
	}

	if _, err := ValidateAccessToken(token); err == nil {
		t.Fatal("expected email verification token to be rejected as access token")
	}
}

func TestValidateAccessTokenAcceptsNewAccessToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	token, err := GenerateToken(21)
	if err != nil {
		t.Fatalf("failed to generate access token: %v", err)
	}

	userID, err := ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("expected access token to be accepted, got error: %v", err)
	}

	if userID != 21 {
		t.Fatalf("expected userID 21, got %d", userID)
	}
}
