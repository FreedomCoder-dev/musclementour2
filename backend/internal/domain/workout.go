package domain

import "time"

type WorkoutSession struct {
	ID          string         `json:"id"`
	UserID      string         `json:"userId"`
	StartedAt   time.Time      `json:"startedAt"`
	CompletedAt time.Time      `json:"completedAt"`
	CreatedAt   time.Time      `json:"createdAt"`
	Entries     []WorkoutEntry `json:"entries"`
}

type WorkoutEntry struct {
	ID              string    `json:"id"`
	SessionID       string    `json:"sessionId"`
	ExerciseID      string    `json:"exerciseId"`
	Sets            int       `json:"sets"`
	Reps            int       `json:"reps"`
	Weight          float64   `json:"weight"`
	DurationSeconds int       `json:"durationSeconds"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"createdAt"`
}
