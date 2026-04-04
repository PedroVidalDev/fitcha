package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
)

type IUserRepository interface {
	FindByEmail(email string) (models.User, error)
	FindByID(userID uint) (models.User, error)
	CreateUser(p models.User) (models.User, error)
	UpdatePassword(userID uint, password string) (models.User, error)
	UpdatePlanActive(userID uint, planActive bool) (models.User, error)
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

func (r *userRepository) UpdatePassword(userID uint, password string) (models.User, error) {
	if err := r.db.Model(&models.User{}).Where("id = ?", userID).Update("password", password).Error; err != nil {
		return models.User{}, err
	}

	return r.FindByID(userID)
}

func (r *userRepository) UpdatePlanActive(userID uint, planActive bool) (models.User, error) {
	if err := r.db.Model(&models.User{}).Where("id = ?", userID).Update("plan_active", planActive).Error; err != nil {
		return models.User{}, err
	}

	return r.FindByID(userID)
}
