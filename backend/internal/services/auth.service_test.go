package services

import (
	"errors"
	"strings"
	"testing"
	"time"

	"fitcha/internal/jobs"
	"fitcha/internal/models"
	"fitcha/pkg/auth"

	"gorm.io/gorm"
)

type stubAuthUserRepository struct {
	user        models.User
	findByEmail map[string]models.User
	findErr     error
}

func (r *stubAuthUserRepository) FindByEmail(email string) (models.User, error) {
	if r.findErr != nil {
		return models.User{}, r.findErr
	}

	user, ok := r.findByEmail[email]
	if !ok {
		return models.User{}, gorm.ErrRecordNotFound
	}

	return user, nil
}

func (r *stubAuthUserRepository) FindByID(userID uint) (models.User, error) {
	if r.findErr != nil {
		return models.User{}, r.findErr
	}

	if r.user.ID != userID {
		return models.User{}, gorm.ErrRecordNotFound
	}

	return r.user, nil
}

func (r *stubAuthUserRepository) CreateUser(user models.User) (models.User, error) {
	return user, nil
}

func (r *stubAuthUserRepository) VerifyUser(userID uint) (models.User, error) {
	if r.user.ID != userID {
		return models.User{}, gorm.ErrRecordNotFound
	}

	r.user.Verified = true
	if existing, ok := r.findByEmail[r.user.Email]; ok {
		existing.Verified = true
		r.findByEmail[r.user.Email] = existing
	}

	return r.user, nil
}

func (r *stubAuthUserRepository) UpdatePassword(userID uint, password string) (models.User, error) {
	return r.user, nil
}

func (r *stubAuthUserRepository) AddCredits(userID uint, amount int) (models.User, error) {
	return r.user, nil
}

func (r *stubAuthUserRepository) ConsumeCredit(userID uint) (models.User, error) {
	return r.user, nil
}

type stubVerificationTokenRepository struct {
	record     models.EmailVerificationToken
	saveCalls  int
	lastHash   string
	lastExpiry time.Time
	usedAt     *time.Time
}

func (r *stubVerificationTokenRepository) SaveActiveToken(
	userID uint,
	tokenHash string,
	expiresAt time.Time,
) error {
	r.saveCalls++
	r.lastHash = tokenHash
	r.lastExpiry = expiresAt
	r.record.UserID = userID
	r.record.TokenHash = tokenHash
	r.record.ExpiresAt = expiresAt
	r.record.UsedAt = nil
	return nil
}

func (r *stubVerificationTokenRepository) FindValidByTokenHash(
	tokenHash string,
	now time.Time,
) (models.EmailVerificationToken, error) {
	if r.record.TokenHash == "" || r.record.TokenHash != tokenHash {
		return models.EmailVerificationToken{}, gorm.ErrRecordNotFound
	}

	if r.record.UsedAt != nil || !r.record.ExpiresAt.After(now) {
		return models.EmailVerificationToken{}, gorm.ErrRecordNotFound
	}

	return r.record, nil
}

func (r *stubVerificationTokenRepository) MarkUsed(tokenID uint, usedAt time.Time) error {
	if r.record.ID != tokenID {
		return gorm.ErrRecordNotFound
	}

	r.usedAt = &usedAt
	r.record.UsedAt = &usedAt
	return nil
}

type stubEmailJobs struct {
	lastEmail string
	lastURL   string
	err       error
}

func (j *stubEmailJobs) EnqueueWelcomeEmail(name, email, verificationURL string) error {
	j.lastEmail = email
	j.lastURL = verificationURL
	return j.err
}

func (j *stubEmailJobs) EnqueueCreditsPurchasedEmail(
	name, email string,
	quantity int,
	totalAmountCents int64,
	balance int,
) error {
	return errors.New("not implemented")
}

var _ jobs.EmailJobEnqueuer = (*stubEmailJobs)(nil)

func TestVerifyEmailWithStoredTokenMarksUserVerified(t *testing.T) {
	now := time.Date(2026, 5, 24, 10, 0, 0, 0, time.UTC)
	userRepo := &stubAuthUserRepository{
		user: models.User{Model: gorm.Model{ID: 9}, Email: "ana@fitcha.app", Verified: false},
		findByEmail: map[string]models.User{
			"ana@fitcha.app": {Model: gorm.Model{ID: 9}, Email: "ana@fitcha.app", Verified: false},
		},
	}
	tokenRepo := &stubVerificationTokenRepository{
		record: models.EmailVerificationToken{
			Model:     gorm.Model{ID: 3},
			UserID:    9,
			TokenHash: hashVerificationToken("opaque-token"),
			ExpiresAt: now.Add(time.Hour),
		},
	}

	service := &AuthService{
		repo:               userRepo,
		verificationTokens: tokenRepo,
		now:                func() time.Time { return now },
	}

	if err := service.VerifyEmail("opaque-token"); err != nil {
		t.Fatalf("expected stored token verification to succeed, got: %v", err)
	}

	if !userRepo.user.Verified {
		t.Fatal("expected user to be marked as verified")
	}

	if tokenRepo.usedAt == nil {
		t.Fatal("expected stored token to be marked as used")
	}
}

func TestVerifyEmailFallsBackToLegacyJWTToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "legacy-secret")

	userRepo := &stubAuthUserRepository{
		user: models.User{Model: gorm.Model{ID: 14}, Email: "bruno@fitcha.app", Verified: false},
		findByEmail: map[string]models.User{
			"bruno@fitcha.app": {Model: gorm.Model{ID: 14}, Email: "bruno@fitcha.app", Verified: false},
		},
	}

	service := &AuthService{
		repo:               userRepo,
		verificationTokens: &stubVerificationTokenRepository{},
		now:                time.Now,
	}

	token, err := auth.GenerateEmailVerificationToken(14)
	if err != nil {
		t.Fatalf("failed to generate legacy token: %v", err)
	}

	if err := service.VerifyEmail(token); err != nil {
		t.Fatalf("expected legacy token verification to succeed, got: %v", err)
	}

	if !userRepo.user.Verified {
		t.Fatal("expected legacy flow to verify the user")
	}
}

func TestResendVerificationEmailReplacesActiveToken(t *testing.T) {
	now := time.Date(2026, 5, 24, 11, 0, 0, 0, time.UTC)
	user := models.User{Model: gorm.Model{ID: 18}, Name: "Carla", Email: "carla@fitcha.app"}
	userRepo := &stubAuthUserRepository{
		user: user,
		findByEmail: map[string]models.User{
			user.Email: user,
		},
	}
	tokenRepo := &stubVerificationTokenRepository{}
	emailJobs := &stubEmailJobs{}

	generated := []string{"first-token", "second-token"}
	index := 0

	service := &AuthService{
		repo:               userRepo,
		verificationTokens: tokenRepo,
		emails:             emailJobs,
		now:                func() time.Time { return now },
		generateTokenPair: func() (string, string, error) {
			plain := generated[index]
			index++
			return plain, hashVerificationToken(plain), nil
		},
	}

	if err := service.ResendVerificationEmail(user.Email); err != nil {
		t.Fatalf("first resend failed: %v", err)
	}

	firstHash := tokenRepo.lastHash
	firstURL := emailJobs.lastURL

	if err := service.ResendVerificationEmail(user.Email); err != nil {
		t.Fatalf("second resend failed: %v", err)
	}

	if tokenRepo.saveCalls != 2 {
		t.Fatalf("expected token to be saved twice, got %d", tokenRepo.saveCalls)
	}

	if firstHash == tokenRepo.lastHash {
		t.Fatal("expected second resend to replace the previous active token")
	}

	if !strings.Contains(firstURL, "first-token") || !strings.Contains(emailJobs.lastURL, "second-token") {
		t.Fatal("expected each resend email to carry its own fresh token")
	}
}
