package services

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/musclementour/app/internal/auth"
	"github.com/musclementour/app/internal/config"
	"github.com/musclementour/app/internal/domain"
	"github.com/musclementour/app/internal/repository"
)

type AuthService struct {
	cfg        *config.Config
	repository repository.Repository
}

func NewAuthService(cfg *config.Config, repo repository.Repository) *AuthService {
	return &AuthService{cfg: cfg, repository: repo}
}

type RegisterRequest struct {
	Email    string
	Password string
}

type AuthResponse struct {
	User      *domain.User   `json:"user"`
	TokenPair auth.TokenPair `json:"tokens"`
}

func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &domain.User{
		Email:        req.Email,
		PasswordHash: string(hashed),
		Role:         domain.RoleUser,
	}
	if err := s.repository.Users.Create(user); err != nil {
		return nil, err
	}
	tokens, err := s.issueTokens(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}
	return &AuthResponse{User: user, TokenPair: *tokens}, nil
}

func (s *AuthService) Login(email, password string) (*AuthResponse, error) {
	user, err := s.repository.Users.GetByEmail(email)
	if err != nil {
		return nil, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, err
	}
	tokens, err := s.issueTokens(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}
	return &AuthResponse{User: user, TokenPair: *tokens}, nil
}

func (s *AuthService) Refresh(refreshToken string) (*auth.TokenPair, *domain.User, error) {
	claims, err := auth.ParseToken(refreshToken, s.cfg.RefreshTokenSecret)
	if err != nil {
		return nil, nil, err
	}
	hashed := auth.HashToken(refreshToken)
	exists, err := s.repository.RefreshTokens.Exists(hashed)
	if err != nil {
		return nil, nil, err
	}
	if !exists {
		return nil, nil, errors.New("refresh token not found")
	}

	user, err := s.repository.Users.GetByID(claims.UserID)
	if err != nil {
		return nil, nil, err
	}

	tokens, err := s.issueTokens(user.ID, string(user.Role))
	if err != nil {
		return nil, nil, err
	}

	if err := s.repository.RefreshTokens.Delete(hashed); err != nil {
		return nil, nil, err
	}

	return tokens, user, nil
}

func (s *AuthService) Logout(refreshToken string) error {
	hashed := auth.HashToken(refreshToken)
	return s.repository.RefreshTokens.Delete(hashed)
}

func (s *AuthService) EnsureAdminExists() error {
	count, err := s.repository.Users.CountAdmins()
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(s.cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	admin := &domain.User{
		Email:        s.cfg.AdminEmail,
		PasswordHash: string(hashed),
		Role:         domain.RoleAdmin,
	}
	return s.repository.Users.Create(admin)
}

func (s *AuthService) issueTokens(userID, role string) (*auth.TokenPair, error) {
	access, accessExp, err := auth.GenerateAccessToken(s.cfg.AccessTokenSecret, userID, role, s.cfg.AccessTokenTTL)
	if err != nil {
		return nil, err
	}
	refresh, refreshExp, err := auth.GenerateRefreshToken(s.cfg.RefreshTokenSecret, userID, s.cfg.RefreshTokenTTL)
	if err != nil {
		return nil, err
	}

	hashed := auth.HashToken(refresh)
	if err := s.repository.RefreshTokens.Save(hashed, userID, refreshExp); err != nil {
		return nil, err
	}

	return &auth.TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int64(time.Until(accessExp).Seconds()),
	}, nil
}
