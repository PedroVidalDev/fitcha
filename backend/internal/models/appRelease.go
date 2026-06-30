package models

import "time"

type AppRelease struct {
	ID             uint       `gorm:"primaryKey;autoIncrement:false" json:"id"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	LatestVersion  string     `gorm:"size:30;not null" json:"latestVersion"`
	MinimumVersion string     `gorm:"size:30" json:"minimumVersion"`
	ReleaseTag     string     `gorm:"size:120" json:"releaseTag"`
	ReleaseURL     string     `gorm:"type:text;not null" json:"releaseUrl"`
	ReleasedAt     *time.Time `json:"releasedAt"`
}

func (AppRelease) TableName() string {
	return "tb_app_releases"
}
