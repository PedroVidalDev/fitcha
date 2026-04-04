package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	Name       string `json:"name"`
	Email      string `gorm:"unique" json:"email"`
	Password   string `json:"-"`
	PlanActive bool   `gorm:"default:false" json:"planActive"`
}

func (User) TableName() string {
	return "tb_users"
}
