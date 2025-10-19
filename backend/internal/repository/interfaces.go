package repository

import (
	"time"

	"github.com/musclementour/app/internal/domain"
)

type UserRepository interface {
	Create(user *domain.User) error
	GetByEmail(email string) (*domain.User, error)
	GetByID(id string) (*domain.User, error)
	CountAdmins() (int, error)
}

type RefreshTokenRepository interface {
	Save(token string, userID string, expiresAt time.Time) error
	Delete(token string) error
	DeleteByUser(userID string) error
	Exists(token string) (bool, error)
}

type ExerciseRepository interface {
	List() ([]domain.Exercise, error)
	Create(ex *domain.Exercise) error
	Update(ex *domain.Exercise) error
	Delete(id string) error
	GetByID(id string) (*domain.Exercise, error)
}

type WorkoutRepository interface {
	CreateSession(session *domain.WorkoutSession) error
	ListSessions(userID string) ([]domain.WorkoutSession, error)
}

type Repository struct {
	Users         UserRepository
	RefreshTokens RefreshTokenRepository
	Exercises     ExerciseRepository
	Workouts      WorkoutRepository
}
