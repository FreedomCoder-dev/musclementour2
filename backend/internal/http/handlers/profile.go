package handlers

import (
	"net/http"

	"github.com/musclementour/app/internal/http/middleware"
	"github.com/musclementour/app/internal/repository"
)

type ProfileHandler struct {
	repo repository.Repository
}

func NewProfileHandler(repo repository.Repository) *ProfileHandler {
	return &ProfileHandler{repo: repo}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	ctx := middleware.GetAuthContext(r)
	if ctx == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	user, err := h.repo.Users.GetByID(ctx.UserID)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, user)
}
