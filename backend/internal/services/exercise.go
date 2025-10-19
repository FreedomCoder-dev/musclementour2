package services

import (
	"errors"
	"strings"
	"time"

	"github.com/musclementour/app/internal/domain"
	"github.com/musclementour/app/internal/repository"
)

type ExerciseService struct {
	repository repository.Repository
}

func NewExerciseService(repo repository.Repository) *ExerciseService {
	return &ExerciseService{repository: repo}
}

var DefaultExercises = []ExerciseInput{
	{
		Name:        "Barbell Back Squat",
		Description: "Compound lower-body lift targeting quads and glutes.",
		MuscleGroup: "Legs",
		Equipment:   "Barbell",
	},
	{
		Name:        "Bench Press",
		Description: "Pressing movement focusing on chest, triceps, and shoulders.",
		MuscleGroup: "Chest",
		Equipment:   "Barbell",
	},
	{
		Name:        "Deadlift",
		Description: "Full-body posterior chain pull from the floor.",
		MuscleGroup: "Back",
		Equipment:   "Barbell",
	},
	{
		Name:        "Pull-Up",
		Description: "Bodyweight vertical pull emphasizing lats and biceps.",
		MuscleGroup: "Back",
		Equipment:   "Bodyweight",
	},
	{
		Name:        "Plank",
		Description: "Isometric core stabilization exercise.",
		MuscleGroup: "Core",
		Equipment:   "Bodyweight",
	},
}

type ExerciseInput struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	MuscleGroup string `json:"muscleGroup"`
	Equipment   string `json:"equipment"`
}

func (s *ExerciseService) List() ([]domain.Exercise, error) {
	return s.repository.Exercises.List()
}

func (s *ExerciseService) Create(input ExerciseInput) (*domain.Exercise, error) {
	if input.Name == "" {
		return nil, errors.New("name is required")
	}
	ex := &domain.Exercise{
		Name:        input.Name,
		Description: input.Description,
		MuscleGroup: input.MuscleGroup,
		Equipment:   input.Equipment,
	}
	if err := s.repository.Exercises.Create(ex); err != nil {
		return nil, err
	}
	return ex, nil
}

func (s *ExerciseService) Update(input ExerciseInput) (*domain.Exercise, error) {
	if input.ID == "" {
		return nil, errors.New("id is required")
	}
	ex, err := s.repository.Exercises.GetByID(input.ID)
	if err != nil {
		return nil, err
	}
	if input.Name != "" {
		ex.Name = input.Name
	}
	ex.Description = input.Description
	ex.MuscleGroup = input.MuscleGroup
	ex.Equipment = input.Equipment
	ex.UpdatedAt = time.Now().UTC()
	if err := s.repository.Exercises.Update(ex); err != nil {
		return nil, err
	}
	return ex, nil
}

func (s *ExerciseService) Delete(id string) error {
	if id == "" {
		return errors.New("id is required")
	}
	return s.repository.Exercises.Delete(id)
}

func (s *ExerciseService) EnsureDefaults() error {
	existing, err := s.repository.Exercises.List()
	if err != nil {
		return err
	}
	existingNames := make(map[string]struct{}, len(existing))
	for _, ex := range existing {
		existingNames[strings.ToLower(ex.Name)] = struct{}{}
	}
	for _, input := range DefaultExercises {
		if _, ok := existingNames[strings.ToLower(input.Name)]; ok {
			continue
		}
		if _, err := s.Create(input); err != nil {
			return err
		}
	}
	return nil
}
