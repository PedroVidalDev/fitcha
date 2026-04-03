package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"fitcha/pkg/auth"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo repositories.IUserRepository
}

func NewAuthService(repo repositories.IUserRepository) *AuthService {
	return &AuthService{repo: repo}
}

func (s *AuthService) Login(email, password string) (string, error) {
	user, err := s.repo.FindByEmail(email)

	if err != nil {
		return "", errors.New("User not found")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("Invalid password for this user")
	}

	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *AuthService) Register(name, email, password string) (models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, err
	}

	user := models.User{
		Name: name,
		Email: email,
		Password: string(hashedPassword),
	}

	return s.repo.CreateUser(user)
}