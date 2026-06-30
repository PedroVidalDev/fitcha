package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"
	"time"

	"gorm.io/gorm"
)

type UpdateAppReleaseInput struct {
	LatestVersion  string
	MinimumVersion string
	ReleaseTag     string
	ReleaseURL     string
	ReleasedAt     *time.Time
}

type AppReleaseService struct {
	repository repositories.IAppReleaseRepository
}

func NewAppReleaseService(repository repositories.IAppReleaseRepository) *AppReleaseService {
	return &AppReleaseService{repository: repository}
}

func (s *AppReleaseService) GetCurrent() (*models.AppRelease, error) {
	appRelease, err := s.repository.GetCurrent()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}

		return nil, err
	}

	return &appRelease, nil
}

func (s *AppReleaseService) UpdateCurrent(input UpdateAppReleaseInput) (models.AppRelease, error) {
	latestVersion := strings.TrimSpace(input.LatestVersion)
	if latestVersion == "" {
		return models.AppRelease{}, errors.New("informe a latestVersion")
	}

	releaseURL := strings.TrimSpace(input.ReleaseURL)
	if releaseURL == "" {
		return models.AppRelease{}, errors.New("informe a releaseUrl")
	}

	var releasedAt *time.Time
	if input.ReleasedAt != nil {
		timestamp := input.ReleasedAt.UTC()
		releasedAt = &timestamp
	} else {
		now := time.Now().UTC()
		releasedAt = &now
	}

	return s.repository.UpsertCurrent(models.AppRelease{
		LatestVersion:  latestVersion,
		MinimumVersion: strings.TrimSpace(input.MinimumVersion),
		ReleaseTag:     strings.TrimSpace(input.ReleaseTag),
		ReleaseURL:     releaseURL,
		ReleasedAt:     releasedAt,
	})
}
