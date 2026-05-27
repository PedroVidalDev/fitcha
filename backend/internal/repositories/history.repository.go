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
		Joins("JOIN tb_user_machines ON tb_user_machines.id = tb_history_entries.user_machine_id").
		Where("tb_user_machines.user_id = ?", userID).
		Preload("Sets", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
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

	headers := make([]models.HistoryEntry, 0, len(entries))
	sets := make([]models.HistorySet, 0)
	ids := make([]string, 0, len(entries))

	for _, entry := range entries {
		headers = append(headers, models.HistoryEntry{
			ID:            entry.ID,
			UserMachineID: entry.UserMachineID,
			PerformedAt:   entry.PerformedAt,
		})
		ids = append(ids, entry.ID)

		for _, set := range entry.Sets {
			sets = append(sets, set)
		}
	}

	if err := r.db.Create(&headers).Error; err != nil {
		return []models.HistoryEntry{}, err
	}

	if len(sets) > 0 {
		if err := r.db.Create(&sets).Error; err != nil {
			return []models.HistoryEntry{}, err
		}
	}

	return r.FindByIDs(ids)
}

func (r *historyRepository) FindByIDs(ids []string) ([]models.HistoryEntry, error) {
	if len(ids) == 0 {
		return []models.HistoryEntry{}, nil
	}

	var entries []models.HistoryEntry

	if err := r.db.
		Where("id IN ?", ids).
		Preload("Sets", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		Find(&entries).
		Error; err != nil {
		return []models.HistoryEntry{}, err
	}

	byID := make(map[string]models.HistoryEntry, len(entries))
	for _, entry := range entries {
		byID[entry.ID] = entry
	}

	orderedEntries := make([]models.HistoryEntry, 0, len(ids))
	for _, id := range ids {
		entry, exists := byID[id]
		if !exists {
			continue
		}

		orderedEntries = append(orderedEntries, entry)
	}

	return orderedEntries, nil
}
