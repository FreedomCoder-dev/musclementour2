package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/musclementour/app/internal/domain"
	"github.com/musclementour/app/internal/http/middleware"
	"github.com/musclementour/app/internal/services"
)

type ExerciseHandler struct {
	exercises *services.ExerciseService
}

func NewExerciseHandler(svc *services.ExerciseService) *ExerciseHandler {
	return &ExerciseHandler{exercises: svc}
}

func (h *ExerciseHandler) List(w http.ResponseWriter, r *http.Request) {
	exercises, err := h.exercises.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, exercises)
}

func (h *ExerciseHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := middleware.GetAuthContext(r)
	if ctx == nil || ctx.Role != domain.RoleAdmin {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	var input services.ExerciseInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	ex, err := h.exercises.Create(input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, ex)
}

func (h *ExerciseHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := middleware.GetAuthContext(r)
	if ctx == nil || ctx.Role != domain.RoleAdmin {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	var input services.ExerciseInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	input.ID = chi.URLParam(r, "id")
	ex, err := h.exercises.Update(input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, ex)
}

func (h *ExerciseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := middleware.GetAuthContext(r)
	if ctx == nil || ctx.Role != domain.RoleAdmin {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.exercises.Delete(id); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
