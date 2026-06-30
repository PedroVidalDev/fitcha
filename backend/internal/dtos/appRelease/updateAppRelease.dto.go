package appRelease

import "time"

type UpdateAppReleaseInput struct {
	LatestVersion  string     `json:"latestVersion"`
	MinimumVersion string     `json:"minimumVersion"`
	ReleaseTag     string     `json:"releaseTag"`
	ReleaseURL     string     `json:"releaseUrl"`
	ReleasedAt     *time.Time `json:"releasedAt"`
}
