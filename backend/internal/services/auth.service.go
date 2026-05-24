package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	dtos "fitcha/internal/dtos/user"
	"fitcha/internal/jobs"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"fitcha/pkg/auth"
	"log"
	"net/url"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	repo               repositories.IUserRepository
	verificationTokens repositories.IEmailVerificationTokenRepository
	emails             jobs.EmailJobEnqueuer
	now                func() time.Time
	generateTokenPair  func() (string, string, error)
}

func NewAuthService(
	repo repositories.IUserRepository,
	verificationTokens repositories.IEmailVerificationTokenRepository,
	emailJobs jobs.EmailJobEnqueuer,
) *AuthService {
	return &AuthService{
		repo:               repo,
		verificationTokens: verificationTokens,
		emails:             emailJobs,
		now:                time.Now,
		generateTokenPair:  generateVerificationTokenPair,
	}
}

func (s *AuthService) Login(email, password string) (dtos.AuthResponseType, error) {
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return dtos.AuthResponseType{}, newAuthError(
			AuthErrorInvalidCredentials,
			"email ou senha incorretos",
		)
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return dtos.AuthResponseType{}, newAuthError(
			AuthErrorInvalidCredentials,
			"email ou senha incorretos",
		)
	}

	if !user.Verified {
		return dtos.AuthResponseType{}, newAuthError(
			AuthErrorEmailNotVerified,
			"verifique seu e-mail antes de entrar",
		)
	}

	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		return dtos.AuthResponseType{}, err
	}

	return dtos.AuthResponseType{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) Register(name, email, password string) (dtos.RegisterResponseType, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return dtos.RegisterResponseType{}, err
	}

	user := models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
		Verified: false,
	}

	createdUser, err := s.repo.CreateUser(user)
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return dtos.RegisterResponseType{}, newAuthError(
				AuthErrorEmailAlreadyExists,
				"este e-mail ja esta em uso",
			)
		}

		return dtos.RegisterResponseType{}, err
	}

	if err := s.issueVerificationEmail(createdUser); err != nil {
		log.Printf("falha ao preparar email de verificacao: %v", err)
	}

	return dtos.RegisterResponseType{
		Message: "conta criada com sucesso, verifique seu e-mail para entrar",
		Email:   createdUser.Email,
	}, nil
}

func (s *AuthService) ResendVerificationEmail(email string) error {
	user, err := s.repo.FindByEmail(strings.TrimSpace(email))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}

		return err
	}

	if user.Verified {
		return nil
	}

	return s.issueVerificationEmail(user)
}

func (s *AuthService) VerifyEmail(token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return newAuthError(AuthErrorInvalidVerification, "link de verificacao invalido ou expirado")
	}

	handled, err := s.verifyStoredVerificationToken(token)
	if err != nil {
		return err
	}

	if handled {
		return nil
	}

	userID, err := auth.ValidateEmailVerificationToken(token)
	if err != nil {
		return newAuthError(AuthErrorInvalidVerification, "link de verificacao invalido ou expirado")
	}

	user, err := s.repo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return newAuthError(AuthErrorUserNotFound, "usuario nao encontrado")
		}

		return err
	}

	if user.Verified {
		return nil
	}

	_, err = s.repo.VerifyUser(user.ID)
	return err
}

func (s *AuthService) ChangePassword(userID uint, currentPassword, newPassword string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return newAuthError(AuthErrorUserNotFound, "usuario nao encontrado")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword))
	if err != nil {
		return newAuthError(
			AuthErrorCurrentPasswordInvalid,
			"senha atual incorreta",
		)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = s.repo.UpdatePassword(userID, string(hashedPassword))
	if err != nil {
		return err
	}

	return nil
}

func (s *AuthService) issueVerificationEmail(user models.User) error {
	if s.verificationTokens == nil {
		return errors.New("repositorio de tokens de verificacao nao configurado")
	}

	plainToken, tokenHash, err := s.generateTokenPair()
	if err != nil {
		return err
	}

	expiresAt := s.now().Add(72 * time.Hour)
	if err := s.verificationTokens.SaveActiveToken(user.ID, tokenHash, expiresAt); err != nil {
		return err
	}

	if s.emails == nil {
		return errors.New("cliente da fila de emails nao configurado")
	}

	return s.emails.EnqueueWelcomeEmail(
		user.Name,
		user.Email,
		buildVerificationURL(plainToken),
	)
}

func (s *AuthService) verifyStoredVerificationToken(token string) (bool, error) {
	if s.verificationTokens == nil {
		return false, nil
	}

	record, err := s.verificationTokens.FindValidByTokenHash(hashVerificationToken(token), s.now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}

		return false, err
	}

	user, err := s.repo.FindByID(record.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, newAuthError(AuthErrorUserNotFound, "usuario nao encontrado")
		}

		return false, err
	}

	if !user.Verified {
		if _, err := s.repo.VerifyUser(user.ID); err != nil {
			return false, err
		}
	}

	if err := s.verificationTokens.MarkUsed(record.ID, s.now()); err != nil {
		log.Printf("falha ao marcar token de verificacao como usado: %v", err)
	}

	return true, nil
}

func buildVerificationURL(token string) string {
	baseURL := strings.TrimSpace(os.Getenv("API_BASE_URL"))
	if baseURL == "" {
		port := strings.TrimSpace(os.Getenv("PORT"))
		if port == "" {
			port = "8080"
		}

		baseURL = "http://localhost:" + port
	}

	return strings.TrimRight(baseURL, "/") + "/verify-email?token=" + url.QueryEscape(token)
}

func generateVerificationTokenPair() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}

	plainToken := base64.RawURLEncoding.EncodeToString(raw)
	return plainToken, hashVerificationToken(plainToken), nil
}

func hashVerificationToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
