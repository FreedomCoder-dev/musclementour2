package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	appdb "github.com/musclementour/app/internal/db"
	"github.com/musclementour/app/internal/domain"
	"github.com/musclementour/app/internal/repository"
)

type Storage struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, dsn string) (*Storage, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("connect db: %w", err)
	}

	if err := appdb.RunMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return &Storage{pool: pool}, nil
}

func (s *Storage) Close() {
	s.pool.Close()
}

func (s *Storage) Repository() repository.Repository {
	return repository.Repository{
		Users:         &userRepository{pool: s.pool},
		RefreshTokens: &refreshTokenRepository{pool: s.pool},
		Exercises:     &exerciseRepository{pool: s.pool},
		Workouts:      &workoutRepository{pool: s.pool},
	}
}

// User repository implementation

type userRepository struct {
	pool *pgxpool.Pool
}

func (r *userRepository) Create(user *domain.User) error {
	if user.ID == "" {
		user.ID = uuid.NewString()
	}
	user.CreatedAt = time.Now().UTC()
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)`,
		user.ID, user.Email, user.PasswordHash, string(user.Role), user.CreatedAt,
	)
	return err
}

func (r *userRepository) GetByEmail(email string) (*domain.User, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1`, email)
	var u domain.User
	var role string
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}
	u.Role = domain.Role(role)
	return &u, nil
}

func (r *userRepository) GetByID(id string) (*domain.User, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1`, id)
	var u domain.User
	var role string
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}
	u.Role = domain.Role(role)
	return &u, nil
}

func (r *userRepository) CountAdmins() (int, error) {
	row := r.pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM users WHERE role = 'admin'`)
	var count int
	if err := row.Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// Refresh token repository

type refreshTokenRepository struct {
	pool *pgxpool.Pool
}

func (r *refreshTokenRepository) Save(token string, userID string, expiresAt time.Time) error {
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO refresh_tokens (token, user_id, expires_at, created_at) VALUES ($1, $2, $3, NOW())`,
		token, userID, expiresAt,
	)
	return err
}

func (r *refreshTokenRepository) Delete(token string) error {
	_, err := r.pool.Exec(context.Background(), `DELETE FROM refresh_tokens WHERE token = $1`, token)
	return err
}

func (r *refreshTokenRepository) DeleteByUser(userID string) error {
	_, err := r.pool.Exec(context.Background(), `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}

func (r *refreshTokenRepository) Exists(token string) (bool, error) {
	row := r.pool.QueryRow(context.Background(), `SELECT 1 FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`, token)
	var dummy int
	if err := row.Scan(&dummy); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// Exercise repository

type exerciseRepository struct {
	pool *pgxpool.Pool
}

func (r *exerciseRepository) List() ([]domain.Exercise, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT id, name, description, muscle_group, equipment, created_at, updated_at FROM exercises ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exercises := []domain.Exercise{}
	for rows.Next() {
		var ex domain.Exercise
		if err := rows.Scan(&ex.ID, &ex.Name, &ex.Description, &ex.MuscleGroup, &ex.Equipment, &ex.CreatedAt, &ex.UpdatedAt); err != nil {
			return nil, err
		}
		exercises = append(exercises, ex)
	}
	return exercises, nil
}

func (r *exerciseRepository) Create(ex *domain.Exercise) error {
	if ex.ID == "" {
		ex.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	ex.CreatedAt = now
	ex.UpdatedAt = now
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO exercises (id, name, description, muscle_group, equipment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		ex.ID, ex.Name, ex.Description, ex.MuscleGroup, ex.Equipment, ex.CreatedAt, ex.UpdatedAt,
	)
	return err
}

func (r *exerciseRepository) Update(ex *domain.Exercise) error {
	ex.UpdatedAt = time.Now().UTC()
	_, err := r.pool.Exec(context.Background(),
		`UPDATE exercises SET name=$1, description=$2, muscle_group=$3, equipment=$4, updated_at=$5 WHERE id=$6`,
		ex.Name, ex.Description, ex.MuscleGroup, ex.Equipment, ex.UpdatedAt, ex.ID,
	)
	return err
}

func (r *exerciseRepository) Delete(id string) error {
	_, err := r.pool.Exec(context.Background(), `DELETE FROM exercises WHERE id=$1`, id)
	return err
}

func (r *exerciseRepository) GetByID(id string) (*domain.Exercise, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id, name, description, muscle_group, equipment, created_at, updated_at FROM exercises WHERE id=$1`, id)
	var ex domain.Exercise
	if err := row.Scan(&ex.ID, &ex.Name, &ex.Description, &ex.MuscleGroup, &ex.Equipment, &ex.CreatedAt, &ex.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}
	return &ex, nil
}

// Workout repository

type workoutRepository struct {
	pool *pgxpool.Pool
}

func (r *workoutRepository) CreateSession(session *domain.WorkoutSession) error {
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

	tx, err := r.pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(),
		`INSERT INTO workout_sessions (id, user_id, started_at, completed_at, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
		session.ID, session.UserID, session.StartedAt, session.CompletedAt, session.CreatedAt,
	)
	if err != nil {
		return err
	}

	for i := range session.Entries {
		entry := &session.Entries[i]
		if entry.ID == "" {
			entry.ID = uuid.NewString()
		}
		entry.SessionID = session.ID
		entry.CreatedAt = time.Now().UTC()
		_, err = tx.Exec(context.Background(),
			`INSERT INTO workout_entries (id, session_id, exercise_id, sets, reps, weight, duration_seconds, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			entry.ID, entry.SessionID, entry.ExerciseID, entry.Sets, entry.Reps, entry.Weight, entry.DurationSeconds, entry.Notes, entry.CreatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}

func (r *workoutRepository) ListSessions(userID string) ([]domain.WorkoutSession, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT id, user_id, started_at, completed_at, created_at FROM workout_sessions WHERE user_id=$1 ORDER BY started_at DESC LIMIT 50`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sessions := []domain.WorkoutSession{}
	for rows.Next() {
		var s domain.WorkoutSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.StartedAt, &s.CompletedAt, &s.CreatedAt); err != nil {
			return nil, err
		}

		entryRows, err := r.pool.Query(context.Background(),
			`SELECT id, session_id, exercise_id, sets, reps, weight, duration_seconds, notes, created_at FROM workout_entries WHERE session_id=$1`,
			s.ID,
		)
		if err != nil {
			return nil, err
		}
		entries := []domain.WorkoutEntry{}
		for entryRows.Next() {
			var e domain.WorkoutEntry
			if err := entryRows.Scan(&e.ID, &e.SessionID, &e.ExerciseID, &e.Sets, &e.Reps, &e.Weight, &e.DurationSeconds, &e.Notes, &e.CreatedAt); err != nil {
				entryRows.Close()
				return nil, err
			}
			entries = append(entries, e)
		}
		entryRows.Close()
		s.Entries = entries
		sessions = append(sessions, s)
	}
	return sessions, nil
}
