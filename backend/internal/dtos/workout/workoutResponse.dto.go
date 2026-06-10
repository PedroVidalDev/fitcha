package dtos

import "fitcha/internal/models"

type WorkoutResponseType struct {
	ID          uint     `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description,omitempty"`
	MachineIDs  []string `json:"machineIds"`
}

func FromWorkoutModel(workout models.Workout) WorkoutResponseType {
	machineIDs := make([]string, 0, len(workout.MachineAssignments))

	for _, assignment := range workout.MachineAssignments {
		machineIDs = append(machineIDs, assignment.UserMachineID)
	}

	return WorkoutResponseType{
		ID:          workout.ID,
		Title:       workout.Title,
		Description: workout.Description,
		MachineIDs:  machineIDs,
	}
}

func FromWorkoutModels(workouts []models.Workout) []WorkoutResponseType {
	response := make([]WorkoutResponseType, 0, len(workouts))

	for _, workout := range workouts {
		response = append(response, FromWorkoutModel(workout))
	}

	return response
}
