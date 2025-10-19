# Muscle Mentour

Muscle Mentour is a progressive web app (PWA) for planning and logging strength workouts even when athletes go offline. It ships
with a Go monolith backend, a React SPA frontend, PostgreSQL storage, and a Docker Compose stack fronted by Traefik and NGINX.

## Features

- **Role-based authentication** with access/refresh tokens (user & admin roles).
- **Offline-first workout logging**. Exercises can be preloaded into IndexedDB, workouts are cached locally when offline, and
  they auto-sync in the background when connectivity returns.
- **Admin exercise management** for curating the exercise library that powers the athlete experience.
- **Modern, mobile-first UI** with a focus on quick navigation and clear call-to-actions.
- **Comprehensive container stack** with PostgreSQL, Traefik routing, and NGINX serving the compiled React SPA.

## Architecture overview

```text
repo
├── backend            # Go monolith (chi router, JWT auth, pgx repository)
│   ├── cmd/server     # Application entry point
│   ├── internal       # Clean architecture-inspired modules
│   └── internal/db    # SQL migrations embedded at build time
├── frontend           # React + Vite SPA / PWA with Tailwind styling
│   ├── public         # Manifest, icons, service worker
│   └── src            # Pages, context, hooks, components
├── docker-compose.yml # Compose stack (Traefik, backend, frontend, PostgreSQL)
└── .gitlab-ci.yml     # CI pipeline running go test, npm build, docker compose build
```

### Backend technology stack

- Go 1.22, chi router, pgx connection pool
- Embedded SQL migrations (idempotent) executed on startup
- Bcrypt password hashing & JWT token issuance (access + refresh)
- Repository/service/handler layering for maintainability

### Frontend technology stack

- React 18 with Vite build tooling
- Tailwind CSS + custom gradients for the mobile-first aesthetic
- React Router for SPA navigation
- IndexedDB (via `idb`) for offline caching and sync queues
- Custom service worker caching the application shell

### Deployment topology

- Traefik (`api.localhost` & `app.localhost`) routes HTTP traffic
- Backend container exposes REST API on port `8080`
- Frontend container builds the SPA and serves it from NGINX
- PostgreSQL holds authentication, exercises, and workout history

## REST API schema

Base path: `/api/v1`

| Method | Path | Role | Description |
| ------ | ---- | ---- | ----------- |
| `POST` | `/auth/register` | Public | Register a new athlete account (role `user`) |
| `POST` | `/auth/login` | Public | Exchange credentials for access + refresh tokens |
| `POST` | `/auth/refresh` | Public | Rotate an access token using a valid refresh token |
| `POST` | `/auth/logout` | Authenticated | Invalidate a refresh token |
| `GET` | `/profile` | Authenticated | Retrieve the current user profile |
| `GET` | `/exercises` | Public/authenticated | List exercises (same endpoint supports offline preload) |
| `POST` | `/exercises` | Admin | Create a new exercise |
| `PUT` | `/exercises/{id}` | Admin | Update exercise metadata |
| `DELETE` | `/exercises/{id}` | Admin | Remove an exercise |
| `GET` | `/workouts` | Authenticated | List the authenticated user's latest workout sessions |
| `POST` | `/workouts` | Authenticated | Persist a workout session with one or more exercise entries |

### Authentication payloads

- Login/Register response: `{ user: { id, email, role }, tokens: { accessToken, refreshToken, expiresIn } }`
- Refresh response: `{ user, tokens }`
- Workout submission request:

```json
{
  "startedAt": "2024-06-01T10:00:00Z",
  "completedAt": "2024-06-01T10:45:00Z",
  "entries": [
    {
      "exerciseId": "<uuid>",
      "sets": 4,
      "reps": 10,
      "weight": 80,
      "durationSeconds": 1800,
      "notes": "RPE 8, paused last rep"
    }
  ]
}
```

## Running locally

1. **Configure hosts** (optional but recommended for Traefik routing):

   ```bash
   echo "127.0.0.1 app.localhost api.localhost" | sudo tee -a /etc/hosts
   ```

2. **Start the stack**:

   ```bash
   docker compose up --build
   ```

   The SPA is available at `http://app.localhost` and the API at `http://api.localhost`.

3. **Default admin user** is created automatically on the first run:

   - Email: `admin@musclementour.app`
   - Password: `ChangeMe123!`

   Change the credentials via environment variables before deploying.

4. **Stop the stack** with `docker compose down` (add `-v` to drop the Postgres volume).

## Offline workflow

1. Sign in while connected and click **"Preload for offline"** on the exercise selection page.
2. Head into the gym — exercises remain accessible without a network.
3. Log sets and reps. Results are queued in IndexedDB if the network is absent.
4. When connectivity returns, background sync automatically posts pending workouts to the API.

## Development scripts

```bash
# Frontend
cd frontend
npm install
npm run dev    # http://localhost:5173

# Backend
cd backend
go run ./cmd/server
```

Set `VITE_API_URL` to point at your backend while running the SPA locally (e.g. `VITE_API_URL=http://localhost:8080`).

## Continuous integration

The GitLab pipeline executes:

1. `go test ./...` inside the backend module
2. `npm ci && npm run build` inside the frontend
3. `docker compose build` to ensure container images compile

## License

MIT
