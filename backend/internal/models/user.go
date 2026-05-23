package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	Name     string `json:"name"`
	Email    string `gorm:"unique" json:"email"`
	Password string `json:"-"`
	Credits  int    `gorm:"default:0" json:"credits"`
	Verified bool   `gorm:"default:false;not null" json:"verified"`
}

func (User) TableName() string {
	return "tb_users"
}
