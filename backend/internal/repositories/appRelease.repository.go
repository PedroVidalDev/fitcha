package repositories

import (
	"errors"
	"fitcha/internal/models"

	"gorm.io/gorm"
)

const currentAppReleaseID uint = 1

type IAppReleaseRepository interface {
	GetCurrent() (models.AppRelease, error)
	UpsertCurrent(appRelease models.AppRelease) (models.AppRelease, error)
}

type appReleaseRepository struct {
	db *gorm.DB
}

func NewAppReleaseRepository(db *gorm.DB) IAppReleaseRepository {
	return &appReleaseRepository{db: db}
}

func (r *appReleaseRepository) GetCurrent() (models.AppRelease, error) {
	var appRelease models.AppRelease

	if err := r.db.Where("id = ?", currentAppReleaseID).First(&appRelease).Error; err != nil {
		return models.AppRelease{}, err
	}

	return appRelease, nil
}

func (r *appReleaseRepository) UpsertCurrent(appRelease models.AppRelease) (models.AppRelease, error) {
	var current models.AppRelease

	err := r.db.Where("id = ?", currentAppReleaseID).First(&current).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.AppRelease{}, err
	}

	appRelease.ID = currentAppReleaseID
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if createErr := r.db.Create(&appRelease).Error; createErr != nil {
			return models.AppRelease{}, createErr
		}

		return appRelease, nil
	}

	current.LatestVersion = appRelease.LatestVersion
	current.MinimumVersion = appRelease.MinimumVersion
	current.ReleaseTag = appRelease.ReleaseTag
	current.ReleaseURL = appRelease.ReleaseURL
	current.ReleasedAt = appRelease.ReleasedAt

	if saveErr := r.db.Save(&current).Error; saveErr != nil {
		return models.AppRelease{}, saveErr
	}

	return current, nil
}
