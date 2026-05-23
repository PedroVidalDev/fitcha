package repositories

import (
	"errors"
	"fitcha/internal/models"

	"gorm.io/gorm"
)

var ErrInsufficientCredits = errors.New("insufficient credits")

type IUserRepository interface {
	FindByEmail(email string) (models.User, error)
	FindByID(userID uint) (models.User, error)
	CreateUser(p models.User) (models.User, error)
	VerifyUser(userID uint) (models.User, error)
	UpdatePassword(userID uint, password string) (models.User, error)
	AddCredits(userID uint, amount int) (models.User, error)
	ConsumeCredit(userID uint) (models.User, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) IUserRepository {
	return &userRepository{
		db: db,
	}
}

func (r *userRepository) FindByEmail(email string) (models.User, error) {
	var user models.User

	result := r.db.Where("email = ?", email).First(&user)

	if result.Error != nil {
		return models.User{}, result.Error
	}

	return user, nil
}

func (r *userRepository) FindByID(userID uint) (models.User, error) {
	var user models.User

	result := r.db.First(&user, userID)

	if result.Error != nil {
		return models.User{}, result.Error
	}

	return user, nil
}

func (r *userRepository) CreateUser(p models.User) (models.User, error) {
	result := r.db.Create(&p)

	if result.Error != nil {
		return models.User{}, result.Error
	}

	return p, nil
}

func (r *userRepository) VerifyUser(userID uint) (models.User, error) {
	if err := r.db.Model(&models.User{}).Where("id = ?", userID).Update("verified", true).Error; err != nil {
		return models.User{}, err
	}

	return r.FindByID(userID)
}

func (r *userRepository) UpdatePassword(userID uint, password string) (models.User, error) {
	if err := r.db.Model(&models.User{}).Where("id = ?", userID).Update("password", password).Error; err != nil {
		return models.User{}, err
	}

	return r.FindByID(userID)
}

func (r *userRepository) AddCredits(userID uint, amount int) (models.User, error) {
	if amount <= 0 {
		return r.FindByID(userID)
	}

	result := r.db.Model(&models.User{}).Where("id = ?", userID).Update("credits", gorm.Expr("credits + ?", amount))
	if result.Error != nil {
		return models.User{}, result.Error
	}
	if result.RowsAffected == 0 {
		return models.User{}, gorm.ErrRecordNotFound
	}

	return r.FindByID(userID)
}

func (r *userRepository) ConsumeCredit(userID uint) (models.User, error) {
	result := r.db.Model(&models.User{}).Where("id = ? AND credits > 0", userID).Update("credits", gorm.Expr("credits - 1"))
	if result.Error != nil {
		return models.User{}, result.Error
	}
	if result.RowsAffected == 0 {
		return models.User{}, ErrInsufficientCredits
	}

	return r.FindByID(userID)
}
