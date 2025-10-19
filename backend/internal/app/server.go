package app

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	chMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/musclementour/app/internal/config"
	"github.com/musclementour/app/internal/domain"
	"github.com/musclementour/app/internal/http/handlers"
	appMiddleware "github.com/musclementour/app/internal/http/middleware"
	"github.com/musclementour/app/internal/repository"
	"github.com/musclementour/app/internal/services"
	"github.com/musclementour/app/internal/storage/postgres"
)

type Server struct {
	cfg        *config.Config
	router     *chi.Mux
	shutdownFn func(context.Context) error
}

func NewServer(ctx context.Context, cfg *config.Config) (*Server, error) {
	storage, err := postgres.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	srv, err := newServerWithRepository(cfg, storage.Repository(), func(context.Context) error {
		storage.Close()
		return nil
	})
	if err != nil {
		storage.Close()
		return nil, err
	}
	return srv, nil
}

func NewServerWithRepository(cfg *config.Config, repo repository.Repository) (*Server, error) {
	return newServerWithRepository(cfg, repo, nil)
}

func newServerWithRepository(cfg *config.Config, repo repository.Repository, shutdown func(context.Context) error) (*Server, error) {
	authService := services.NewAuthService(cfg, repo)
	if err := authService.EnsureAdminExists(); err != nil {
		return nil, fmt.Errorf("ensure admin: %w", err)
	}
	exerciseService := services.NewExerciseService(repo)
	if err := exerciseService.EnsureDefaults(); err != nil {
		return nil, fmt.Errorf("seed exercises: %w", err)
	}
	workoutService := services.NewWorkoutService(repo)

	authHandler := handlers.NewAuthHandler(authService)
	exerciseHandler := handlers.NewExerciseHandler(exerciseService)
	workoutHandler := handlers.NewWorkoutHandler(workoutService)
	profileHandler := handlers.NewProfileHandler(repo)

	router := chi.NewRouter()
	router.Use(chMiddleware.Logger)
	router.Use(chMiddleware.Recoverer)
	router.Use(chMiddleware.RequestID)

	corsOpts := cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}
	if len(cfg.AllowedOrigins) == 0 {
		corsOpts.AllowedOrigins = []string{"*"}
	}
	router.Use(cors.Handler(corsOpts))

	router.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	authMw := appMiddleware.WithAuth(cfg)

	router.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/refresh", authHandler.Refresh)
		r.Post("/auth/logout", authHandler.Logout)

		r.Group(func(pr chi.Router) {
			pr.Use(authMw)
			pr.Get("/profile", profileHandler.GetProfile)
			pr.Get("/exercises", exerciseHandler.List)
			pr.Get("/workouts", workoutHandler.List)
			pr.Post("/workouts", workoutHandler.Create)

			pr.Group(func(ar chi.Router) {
				ar.Use(func(next http.Handler) http.Handler {
					return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						ctx := appMiddleware.GetAuthContext(r)
						if ctx == nil || ctx.Role != domain.RoleAdmin {
							http.Error(w, "forbidden", http.StatusForbidden)
							return
						}
						next.ServeHTTP(w, r)
					})
				})
				ar.Post("/exercises", exerciseHandler.Create)
				ar.Put("/exercises/{id}", exerciseHandler.Update)
				ar.Delete("/exercises/{id}", exerciseHandler.Delete)
			})
		})

		r.Get("/exercises", exerciseHandler.List)
	})

	return &Server{cfg: cfg, router: router, shutdownFn: shutdown}, nil
}

func (s *Server) Router() http.Handler {
	return s.router
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.shutdownFn != nil {
		return s.shutdownFn(ctx)
	}
	return nil
}
