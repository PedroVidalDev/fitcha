package services

import (
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
	repo                repositories.IUserRepository
	verificationTokens  repositories.IEmailVerificationTokenRepository
	passwordResetTokens repositories.IPasswordResetTokenRepository
	emails              jobs.EmailJobEnqueuer
	now                 func() time.Time
	generateTokenPair   func() (string, string, error)
}

func NewAuthService(
	repo repositories.IUserRepository,
	verificationTokens repositories.IEmailVerificationTokenRepository,
	passwordResetTokens repositories.IPasswordResetTokenRepository,
	emailJobs jobs.EmailJobEnqueuer,
) *AuthService {
	return &AuthService{
		repo:                repo,
		verificationTokens:  verificationTokens,
		passwordResetTokens: passwordResetTokens,
		emails:              emailJobs,
		now:                 time.Now,
		generateTokenPair:   generateOpaqueTokenPair,
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

func (s *AuthService) RequestPasswordReset(email string) error {
	user, err := s.repo.FindByEmail(strings.TrimSpace(email))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}

		return err
	}

	return s.issuePasswordResetEmail(user)
}

func (s *AuthService) ResetPassword(token, newPassword string) error {
	if s.passwordResetTokens == nil {
		return errors.New("repositorio de tokens de redefinicao nao configurado")
	}

	token = strings.TrimSpace(token)
	if token == "" {
		return newAuthError(AuthErrorInvalidPasswordResetToken, "link de redefinicao invalido ou expirado")
	}

	record, err := s.passwordResetTokens.FindValidByTokenHash(hashOpaqueToken(token), s.now())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return newAuthError(
				AuthErrorInvalidPasswordResetToken,
				"link de redefinicao invalido ou expirado",
			)
		}

		return err
	}

	user, err := s.repo.FindByID(record.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return newAuthError(AuthErrorUserNotFound, "usuario nao encontrado")
		}

		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if _, err := s.repo.UpdatePassword(user.ID, string(hashedPassword)); err != nil {
		return err
	}

	if err := s.passwordResetTokens.MarkUsed(record.ID, s.now()); err != nil {
		log.Printf("falha ao marcar token de redefinicao como usado: %v", err)
	}

	return nil
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

func (s *AuthService) issuePasswordResetEmail(user models.User) error {
	if s.passwordResetTokens == nil {
		return errors.New("repositorio de tokens de redefinicao nao configurado")
	}

	plainToken, tokenHash, err := s.generateTokenPair()
	if err != nil {
		return err
	}

	expiresAt := s.now().Add(2 * time.Hour)
	if err := s.passwordResetTokens.SaveActiveToken(user.ID, tokenHash, expiresAt); err != nil {
		return err
	}

	if s.emails == nil {
		return errors.New("cliente da fila de emails nao configurado")
	}

	return s.emails.EnqueuePasswordResetEmail(
		user.Name,
		user.Email,
		buildPasswordResetURL(plainToken),
	)
}

func (s *AuthService) verifyStoredVerificationToken(token string) (bool, error) {
	if s.verificationTokens == nil {
		return false, nil
	}

	record, err := s.verificationTokens.FindValidByTokenHash(hashOpaqueToken(token), s.now())
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
	return buildPublicURL("/verify-email?token=" + url.QueryEscape(token))
}

func buildPasswordResetURL(token string) string {
	return buildPublicURL("/reset-password?token=" + url.QueryEscape(token))
}

func buildPublicURL(path string) string {
	baseURL := strings.TrimSpace(os.Getenv("API_BASE_URL"))
	if baseURL == "" {
		port := strings.TrimSpace(os.Getenv("PORT"))
		if port == "" {
			port = "8080"
		}

		baseURL = "http://localhost:" + port
	}

	return strings.TrimRight(baseURL, "/") + path
}
