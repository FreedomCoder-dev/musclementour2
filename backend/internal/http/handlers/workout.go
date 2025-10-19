package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/musclementour/app/internal/http/middleware"
	"github.com/musclementour/app/internal/services"
)

type WorkoutHandler struct {
	workouts *services.WorkoutService
}

func NewWorkoutHandler(svc *services.WorkoutService) *WorkoutHandler {
	return &WorkoutHandler{workouts: svc}
}

type workoutRequest struct {
	StartedAt   *time.Time                   `json:"startedAt"`
	CompletedAt *time.Time                   `json:"completedAt"`
	Entries     []services.WorkoutEntryInput `json:"entries"`
}

func (h *WorkoutHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := middleware.GetAuthContext(r)
	if ctx == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var req workoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	input := services.WorkoutSessionInput{Entries: req.Entries}
	if req.StartedAt != nil {
		input.StartedAt = *req.StartedAt
	}
	if req.CompletedAt != nil {
		input.CompletedAt = *req.CompletedAt
	}
	session, err := h.workouts.Create(ctx.UserID, input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, session)
}

func (h *WorkoutHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := middleware.GetAuthContext(r)
	if ctx == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	sessions, err := h.workouts.List(ctx.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, sessions)
}
