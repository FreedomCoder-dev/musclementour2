package domain

import "time"

type Exercise struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	MuscleGroup string    `json:"muscleGroup"`
	Equipment   string    `json:"equipment"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
