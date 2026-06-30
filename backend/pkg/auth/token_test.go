package auth

import (
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestValidateAccessTokenRejectsTokenWithoutPurpose(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	tokenWithoutPurpose, err := signToken(tokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: "7",
		},
	})
	if err != nil {
		t.Fatalf("failed to sign token without purpose: %v", err)
	}

	if _, err := ValidateAccessToken(tokenWithoutPurpose); err == nil {
		t.Fatal("expected token without purpose to be rejected")
	}
}

func TestValidateAccessTokenRejectsTokenWithInvalidSubjectType(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	tokenWithNumericSubject, err := signToken(jwt.MapClaims{
		"sub":     7,
		"purpose": PurposeAuthAccess,
	})
	if err != nil {
		t.Fatalf("failed to sign token with numeric subject: %v", err)
	}

	if _, err := ValidateAccessToken(tokenWithNumericSubject); err == nil {
		t.Fatal("expected token with numeric subject to be rejected")
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
