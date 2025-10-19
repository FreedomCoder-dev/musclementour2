package db

import (
	"context"
	"embed"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		data, err := migrationFiles.ReadFile("migrations/" + name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		statements := strings.Split(string(data), ";")
		for _, stmt := range statements {
			trimmed := strings.TrimSpace(stmt)
			if trimmed == "" {
				continue
			}
			if _, err := pool.Exec(ctx, trimmed); err != nil {
				return fmt.Errorf("exec migration %s: %w", name, err)
			}
		}
	}
	return nil
}
