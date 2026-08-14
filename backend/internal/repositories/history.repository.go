package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
)

type IHistoryRepository interface {
	FindByUserID(userID uint) ([]models.HistoryEntry, error)
	FindPageByUserMachineIDAndUserID(userMachineID string, userID uint, page int, limit int) ([]models.HistoryEntry, int64, error)
	FindRecordByUserMachineIDAndUserID(userMachineID string, userID uint, metricKind string) (models.HistoryEntry, error)
	CreateMany(entries []models.HistoryEntry) ([]models.HistoryEntry, error)
	DeleteByIDAndUserID(historyID string, userID uint) error
	ReassignAllByUserMachineID(sourceUserMachineID string, targetUserMachineID string) (int64, error)
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

func (r *historyRepository) FindPageByUserMachineIDAndUserID(userMachineID string, userID uint, page int, limit int) ([]models.HistoryEntry, int64, error) {
	query := r.db.
		Model(&models.HistoryEntry{}).
		Joins("JOIN tb_user_machines ON tb_user_machines.id = tb_history_entries.user_machine_id").
		Where("tb_history_entries.user_machine_id = ?", userMachineID).
		Where("tb_user_machines.user_id = ?", userID)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return []models.HistoryEntry{}, 0, err
	}

	var entries []models.HistoryEntry
	if err := query.
		Select("tb_history_entries.*").
		Preload("Sets", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		Order("tb_history_entries.performed_at desc, tb_history_entries.id desc").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&entries).
		Error; err != nil {
		return []models.HistoryEntry{}, 0, err
	}

	return entries, total, nil
}

func (r *historyRepository) FindRecordByUserMachineIDAndUserID(userMachineID string, userID uint, metricKind string) (models.HistoryEntry, error) {
	metricExpression := "COALESCE(SUM(CASE WHEN tb_history_sets.reps > 0 THEN tb_history_sets.weight * tb_history_sets.reps ELSE tb_history_sets.weight END), 0)"
	if metricKind == "duration" {
		metricExpression = "COALESCE(SUM(tb_history_sets.duration_seconds), 0)"
	} else if metricKind == "reps" {
		metricExpression = "COALESCE(SUM(tb_history_sets.reps), 0)"
	}

	type recordCandidate struct {
		ID string
	}
	var candidate recordCandidate
	err := r.db.
		Table("tb_history_entries").
		Select("tb_history_entries.id").
		Joins("JOIN tb_user_machines ON tb_user_machines.id = tb_history_entries.user_machine_id").
		Joins("LEFT JOIN tb_history_sets ON tb_history_sets.history_entry_id = tb_history_entries.id").
		Where("tb_history_entries.user_machine_id = ?", userMachineID).
		Where("tb_user_machines.user_id = ?", userID).
		Group("tb_history_entries.id, tb_history_entries.performed_at").
		Order(metricExpression + " desc").
		Order("COALESCE(MAX(tb_history_sets.weight), 0) desc").
		Order("tb_history_entries.performed_at desc").
		Limit(1).
		Take(&candidate).
		Error
	if err != nil {
		return models.HistoryEntry{}, err
	}

	var entry models.HistoryEntry
	if err := r.db.
		Where("id = ?", candidate.ID).
		Preload("Sets", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		First(&entry).
		Error; err != nil {
		return models.HistoryEntry{}, err
	}

	return entry, nil
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

func (r *historyRepository) DeleteByIDAndUserID(historyID string, userID uint) error {
	result := r.db.Exec(`
		DELETE FROM tb_history_entries
		WHERE id = ?
		  AND EXISTS (
			SELECT 1
			FROM tb_user_machines
			WHERE tb_user_machines.id = tb_history_entries.user_machine_id
			  AND tb_user_machines.user_id = ?
		  )
	`, historyID, userID)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

func (r *historyRepository) ReassignAllByUserMachineID(sourceUserMachineID string, targetUserMachineID string) (int64, error) {
	result := r.db.Model(&models.HistoryEntry{}).
		Where("user_machine_id = ?", sourceUserMachineID).
		Update("user_machine_id", targetUserMachineID)
	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
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
