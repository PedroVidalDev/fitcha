package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
)

type IHistoryRepository interface {
	FindByUserID(userID uint) ([]models.HistoryEntry, error)
	CreateMany(entries []models.HistoryEntry) ([]models.HistoryEntry, error)
}

type historyRepository struct {
	db *gorm.DB
}

func NewHistoryRepository(db *gorm.DB) IHistoryRepository {
	return &historyRepository{db: db}
}

func (r *historyRepository) FindByUserID(userID uint) ([]models.HistoryEntry, error) {
	var entries []models.HistoryEntry

	err := r.db.
		Model(&models.HistoryEntry{}).
		Joins("JOIN tb_machines ON tb_machines.id = tb_history_entries.machine_id").
		Where("tb_machines.user_id = ?", userID).
		Order("tb_history_entries.performed_at desc").
		Find(&entries).
		Error
	if err != nil {
		return []models.HistoryEntry{}, err
	}

	return entries, nil
}

func (r *historyRepository) CreateMany(entries []models.HistoryEntry) ([]models.HistoryEntry, error) {
	if len(entries) == 0 {
		return []models.HistoryEntry{}, nil
	}

	if err := r.db.Create(&entries).Error; err != nil {
		return []models.HistoryEntry{}, err
	}

	return entries, nil
}
