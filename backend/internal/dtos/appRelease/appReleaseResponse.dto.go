package appRelease

import (
	"fitcha/internal/models"
	"time"
)

type AppReleaseResponse struct {
	LatestVersion  string     `json:"latestVersion"`
	MinimumVersion string     `json:"minimumVersion,omitempty"`
	ReleaseTag     string     `json:"releaseTag,omitempty"`
	ReleaseURL     string     `json:"releaseUrl"`
	ReleasedAt     *time.Time `json:"releasedAt,omitempty"`
}

func FromAppReleaseModel(appRelease models.AppRelease) AppReleaseResponse {
	return AppReleaseResponse{
		LatestVersion:  appRelease.LatestVersion,
		MinimumVersion: appRelease.MinimumVersion,
		ReleaseTag:     appRelease.ReleaseTag,
		ReleaseURL:     appRelease.ReleaseURL,
		ReleasedAt:     appRelease.ReleasedAt,
	}
}
