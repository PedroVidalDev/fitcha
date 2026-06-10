package dtos

type CreateWorkoutType struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}
