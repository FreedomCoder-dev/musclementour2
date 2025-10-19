package app_test

import (
	"errors"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/musclementour/app/internal/domain"
	"github.com/musclementour/app/internal/repository"
)

type memoryStore struct {
	mu            sync.Mutex
	users         map[string]domain.User
	refreshTokens map[string]time.Time
	exercises     map[string]domain.Exercise
	workouts      map[string]domain.WorkoutSession
}

func newMemoryRepository() repository.Repository {
	store := &memoryStore{
		users:         make(map[string]domain.User),
		refreshTokens: make(map[string]time.Time),
		exercises:     make(map[string]domain.Exercise),
		workouts:      make(map[string]domain.WorkoutSession),
	}
	return repository.Repository{
		Users:         &memoryUserRepo{store: store},
		RefreshTokens: &memoryRefreshRepo{store: store},
		Exercises:     &memoryExerciseRepo{store: store},
		Workouts:      &memoryWorkoutRepo{store: store},
	}
}

type memoryUserRepo struct {
	store *memoryStore
}

func (r *memoryUserRepo) Create(user *domain.User) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	for _, existing := range r.store.users {
		if existing.Email == user.Email {
			return errors.New("user already exists")
		}
	}
	if user.ID == "" {
		user.ID = uuid.NewString()
	}
	user.CreatedAt = time.Now().UTC()
	r.store.users[user.ID] = *user
	return nil
}

func (r *memoryUserRepo) GetByEmail(email string) (*domain.User, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	for _, u := range r.store.users {
		if u.Email == email {
			user := u
			return &user, nil
		}
	}
	return nil, errors.New("not found")
}

func (r *memoryUserRepo) GetByID(id string) (*domain.User, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if u, ok := r.store.users[id]; ok {
		user := u
		return &user, nil
	}
	return nil, errors.New("not found")
}

func (r *memoryUserRepo) CountAdmins() (int, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	count := 0
	for _, u := range r.store.users {
		if u.Role == domain.RoleAdmin {
			count++
		}
	}
	return count, nil
}

type memoryRefreshRepo struct {
	store *memoryStore
}

func (r *memoryRefreshRepo) Save(token string, userID string, expiresAt time.Time) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	r.store.refreshTokens[token] = expiresAt
	return nil
}

func (r *memoryRefreshRepo) Delete(token string) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	delete(r.store.refreshTokens, token)
	return nil
}

func (r *memoryRefreshRepo) DeleteByUser(userID string) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	for token := range r.store.refreshTokens {
		delete(r.store.refreshTokens, token)
	}
	return nil
}

func (r *memoryRefreshRepo) Exists(token string) (bool, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	expiresAt, ok := r.store.refreshTokens[token]
	if !ok {
		return false, nil
	}
	if time.Now().After(expiresAt) {
		delete(r.store.refreshTokens, token)
		return false, nil
	}
	return true, nil
}

type memoryExerciseRepo struct {
	store *memoryStore
}

func (r *memoryExerciseRepo) List() ([]domain.Exercise, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	exercises := make([]domain.Exercise, 0, len(r.store.exercises))
	for _, ex := range r.store.exercises {
		exercises = append(exercises, ex)
	}
	sort.Slice(exercises, func(i, j int) bool {
		return exercises[i].Name < exercises[j].Name
	})
	return exercises, nil
}

func (r *memoryExerciseRepo) Create(ex *domain.Exercise) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if ex.ID == "" {
		ex.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	ex.CreatedAt = now
	ex.UpdatedAt = now
	r.store.exercises[ex.ID] = *ex
	return nil
}

func (r *memoryExerciseRepo) Update(ex *domain.Exercise) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if _, ok := r.store.exercises[ex.ID]; !ok {
		return errors.New("exercise not found")
	}
	ex.UpdatedAt = time.Now().UTC()
	r.store.exercises[ex.ID] = *ex
	return nil
}

func (r *memoryExerciseRepo) Delete(id string) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	delete(r.store.exercises, id)
	return nil
}

func (r *memoryExerciseRepo) GetByID(id string) (*domain.Exercise, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if ex, ok := r.store.exercises[id]; ok {
		exercise := ex
		return &exercise, nil
	}
	return nil, errors.New("exercise not found")
}

type memoryWorkoutRepo struct {
	store *memoryStore
}

func (r *memoryWorkoutRepo) CreateSession(session *domain.WorkoutSession) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if session.ID == "" {
		session.ID = uuid.NewString()
	}
	if session.StartedAt.IsZero() {
		session.StartedAt = time.Now().UTC()
	}
	if session.CompletedAt.IsZero() {
		session.CompletedAt = session.StartedAt
	}
	session.CreatedAt = time.Now().UTC()

	entries := make([]domain.WorkoutEntry, len(session.Entries))
	for i := range session.Entries {
		entry := session.Entries[i]
		if entry.ID == "" {
			entry.ID = uuid.NewString()
		}
		entry.SessionID = session.ID
		entry.CreatedAt = time.Now().UTC()
		entries[i] = entry
	}
	session.Entries = entries
	r.store.workouts[session.ID] = *session
	return nil
}

func (r *memoryWorkoutRepo) ListSessions(userID string) ([]domain.WorkoutSession, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	sessions := make([]domain.WorkoutSession, 0)
	for _, session := range r.store.workouts {
		if session.UserID == userID {
			copySession := session
			sessions = append(sessions, copySession)
		}
	}
	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].StartedAt.After(sessions[j].StartedAt)
	})
	return sessions, nil
}
