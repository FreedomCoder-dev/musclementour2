package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	ServerPort         int
	DatabaseURL        string
	AccessTokenSecret  string
	RefreshTokenSecret string
	AccessTokenTTL     time.Duration
	RefreshTokenTTL    time.Duration
	AdminEmail         string
	AdminPassword      string
	AllowedOrigins     []string
}

func Load() (*Config, error) {
	cfg := &Config{}

	portStr := getEnv("SERVER_PORT", "8080")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid SERVER_PORT: %w", err)
	}
	cfg.ServerPort = port
	cfg.DatabaseURL = getEnv("DATABASE_URL", "postgres://postgres:postgres@db:5432/musclementour?sslmode=disable")
	cfg.AccessTokenSecret = getEnv("ACCESS_TOKEN_SECRET", "supersecretaccess")
	cfg.RefreshTokenSecret = getEnv("REFRESH_TOKEN_SECRET", "supersecretrefresh")

	accessTTLStr := getEnv("ACCESS_TOKEN_TTL", "15m")
	cfg.AccessTokenTTL, err = time.ParseDuration(accessTTLStr)
	if err != nil {
		return nil, fmt.Errorf("invalid ACCESS_TOKEN_TTL: %w", err)
	}
	refreshTTLStr := getEnv("REFRESH_TOKEN_TTL", "168h")
	cfg.RefreshTokenTTL, err = time.ParseDuration(refreshTTLStr)
	if err != nil {
		return nil, fmt.Errorf("invalid REFRESH_TOKEN_TTL: %w", err)
	}

	cfg.AdminEmail = getEnv("ADMIN_EMAIL", "admin@musclementour.app")
	cfg.AdminPassword = getEnv("ADMIN_PASSWORD", "ChangeMe123!")

	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		cfg.AllowedOrigins = splitAndTrim(origins)
	}

	return cfg, nil
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return def
}

func splitAndTrim(input string) []string {
	raw := strings.Split(input, ",")
	out := make([]string, 0, len(raw))
	for _, item := range raw {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
