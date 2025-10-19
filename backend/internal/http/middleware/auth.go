package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/musclementour/app/internal/auth"
	"github.com/musclementour/app/internal/config"
	"github.com/musclementour/app/internal/domain"
)

type contextKey string

const (
	userIDKey contextKey = "userID"
	roleKey   contextKey = "role"
)

type AuthContext struct {
	UserID string
	Role   domain.Role
}

func WithAuth(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				http.Error(w, "missing authorization header", http.StatusUnauthorized)
				return
			}
			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				http.Error(w, "invalid authorization header", http.StatusUnauthorized)
				return
			}

			claims, err := auth.ParseToken(parts[1], cfg.AccessTokenSecret)
			if err != nil {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
			ctx = context.WithValue(ctx, roleKey, domain.Role(claims.Role))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(role domain.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			value := r.Context().Value(roleKey)
			if value == nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			userRole, ok := value.(domain.Role)
			if !ok || userRole != role {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func GetAuthContext(r *http.Request) *AuthContext {
	userID, _ := r.Context().Value(userIDKey).(string)
	role, _ := r.Context().Value(roleKey).(domain.Role)
	if userID == "" {
		return nil
	}
	return &AuthContext{UserID: userID, Role: role}
}
