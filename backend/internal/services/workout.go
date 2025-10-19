package services

import (
	"errors"
	"time"

	"github.com/musclementour/app/internal/domain"
	"github.com/musclementour/app/internal/repository"
)

type WorkoutService struct {
	repository repository.Repository
}

func NewWorkoutService(repo repository.Repository) *WorkoutService {
	return &WorkoutService{repository: repo}
}

type WorkoutEntryInput struct {
	ExerciseID      string  `json:"exerciseId"`
	Sets            int     `json:"sets"`
	Reps            int     `json:"reps"`
	Weight          float64 `json:"weight"`
	DurationSeconds int     `json:"durationSeconds"`
	Notes           string  `json:"notes"`
}

type WorkoutSessionInput struct {
	StartedAt   time.Time           `json:"startedAt"`
	CompletedAt time.Time           `json:"completedAt"`
	Entries     []WorkoutEntryInput `json:"entries"`
}

func (s *WorkoutService) Create(userID string, input WorkoutSessionInput) (*domain.WorkoutSession, error) {
	if userID == "" {
		return nil, errors.New("user id is required")
	}
	session := &domain.WorkoutSession{
		UserID:      userID,
		StartedAt:   input.StartedAt,
		CompletedAt: input.CompletedAt,
	}

	for _, entry := range input.Entries {
		session.Entries = append(session.Entries, domain.WorkoutEntry{
			ExerciseID:      entry.ExerciseID,
			Sets:            entry.Sets,
			Reps:            entry.Reps,
			Weight:          entry.Weight,
			DurationSeconds: entry.DurationSeconds,
			Notes:           entry.Notes,
		})
	}

	if err := s.repository.Workouts.CreateSession(session); err != nil {
		return nil, err
	}
	return session, nil
}

func (s *WorkoutService) List(userID string) ([]domain.WorkoutSession, error) {
	if userID == "" {
		return nil, errors.New("user id is required")
	}
	return s.repository.Workouts.ListSessions(userID)
}
