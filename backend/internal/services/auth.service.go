package services

import (
	"errors"
	dtos "fitcha/internal/dtos/user"
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

func (s *AuthService) Login(email, password string) (dtos.AuthResponseType, error) {
	user, err := s.repo.FindByEmail(email)

	if err != nil {
		return dtos.AuthResponseType{}, errors.New("email ou senha incorretos")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return dtos.AuthResponseType{}, errors.New("email ou senha incorretos")
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

func (s *AuthService) Register(name, email, password string) (dtos.AuthResponseType, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return dtos.AuthResponseType{}, err
	}

	user := models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	createdUser, err := s.repo.CreateUser(user)
	if err != nil {
		return dtos.AuthResponseType{}, err
	}

	token, err := auth.GenerateToken(createdUser.ID)
	if err != nil {
		return dtos.AuthResponseType{}, err
	}

	return dtos.AuthResponseType{
		Token: token,
		User:  createdUser,
	}, nil
}

func (s *AuthService) ChangePassword(userID uint, currentPassword, newPassword string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return errors.New("usuario nao encontrado")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword))
	if err != nil {
		return errors.New("senha atual incorreta")
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
