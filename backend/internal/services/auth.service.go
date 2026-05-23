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

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	repo   repositories.IUserRepository
	emails jobs.EmailJobEnqueuer
}

func NewAuthService(repo repositories.IUserRepository, emailJobs jobs.EmailJobEnqueuer) *AuthService {
	return &AuthService{
		repo:   repo,
		emails: emailJobs,
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

	if s.emails != nil {
		verificationToken, tokenErr := auth.GenerateEmailVerificationToken(createdUser.ID)
		if tokenErr != nil {
			return dtos.RegisterResponseType{}, tokenErr
		}

		if err := s.emails.EnqueueWelcomeEmail(
			createdUser.Name,
			createdUser.Email,
			buildVerificationURL(verificationToken),
		); err != nil {
			log.Printf("falha ao enfileirar email de boas-vindas: %v", err)
		}
	}

	return dtos.RegisterResponseType{
		Message: "conta criada com sucesso, verifique seu e-mail para entrar",
		Email:   createdUser.Email,
	}, nil
}

func (s *AuthService) VerifyEmail(token string) error {
	userID, err := auth.ValidateEmailVerificationToken(strings.TrimSpace(token))
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
