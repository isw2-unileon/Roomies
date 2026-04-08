![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

# Roomies

Roomies is a web application to help people find compatible roommates and housing.
Beyond standard listing platforms, the focus is on *living compatibility* (habits, schedule, cleanliness, budget, noise tolerance) so owners and tenants can make better decisions.

---

## Why Roomies

- Match people by lifestyle, not only by property details
- Support both tenant and owner roles
- Provide onboarding to capture tenant preferences early
- Keep authentication secure with Supabase email confirmation and password recovery flows

---

## Current Functional Scope

### Authentication
- Login with email + password
- Register account with role selection (`tenant` or `owner`)
- Email confirmation flow via callback page (`/auth/callback`)
- Forgot password email flow
- Password reset page (`/reset-password`) with new password confirmation

### Tenant onboarding
- Tenant users are redirected to onboarding when profile data is still missing
- Onboarding saves profile preferences to `tenant_profiles`

### Role routing
- Tenant with pending onboarding -> `/onboarding/tenant`
- Owner -> `/owner/coming-soon`
- Authenticated user with completed flow -> `/app`

---

## Architecture

### Backend
- **Go 1.24+**
- **Gin** for HTTP API
- **pgx/pgxpool** for PostgreSQL connectivity
- **Supabase Auth API** integration for login/signup/verification/recovery

### Frontend
- **React 19 + TypeScript 5.7**
- **Vite 6**
- **Tailwind CSS 4**
- Lightweight client-side routing based on `window.history`

### Testing and quality
- Go tests: `go test -v -race ./...`
- Frontend unit tests: `npm run test`
- E2E: Playwright (`make e2e`)
- Linting: `golangci-lint` + `ESLint`

---

## Project Structure

```text
.
├── backend/
│   ├── cmd/server/                 # Backend entrypoint
│   └── internal/
│       ├── auth/                   # Auth service + profile status helpers
│       ├── config/                 # Environment loading
│       └── database/               # DB connection/pool setup
├── frontend/
│   └── src/
│       ├── App.tsx                 # Route resolution and page switching
│       └── pages/                  # Login/Register/Callback/Reset/Onboarding pages
├── e2e/                            # Playwright tests
├── supabase/                       # Supabase config and SQL migrations
└── .github/workflows/              # CI pipelines
```

---

## Team Members

| Name | Email |
|------|-------|
| Diego Fuertes | dfuerl00@estudiantes.unileon.es |
| Sergio Lopez | sloper00@estudiantes.unileon.es |
| Aitor Fernandes | afernf38@estudiantes.unileon.es |
| Jairo Ugidos | jugidh00@estudiantes.unileon.es |

---

## Prerequisites

- [Go](https://go.dev/dl/) `1.24+`
- [Node.js](https://nodejs.org/) `22+`
- [Git](https://git-scm.com/)

---

## Getting Started

### 1) Clone

```bash
git clone https://github.com/isw2-unileon/Roomies.git
cd Roomies
```

### 2) Install dependencies

```bash
make install
```

### 3) Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Recommended variables in `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `8080` |
| `GIN_MODE` | Gin mode | `debug` |
| `CORS_ALLOW_ORIGIN` | Allowed CORS origin | `*` |
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase API key used by backend auth calls | - |
| `FRONTEND_URL` | Frontend base URL for redirects | `http://localhost:5173` |

Important:
- `SUPABASE_URL` and `DATABASE_URL` must target the same project
- Backend starts only if DB connection succeeds

---

## Run in Development

### Using `make`

```bash
# Terminal 1
make run-backend

# Terminal 2
make run-frontend
```

### Without `make` (common on Windows)

```bash
# from repo root
go mod download
cd frontend && npm ci
cd ../e2e && npm ci

# start backend
cd ..
go run ./backend/cmd/server

# in another terminal, start frontend
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`  
Backend health: `http://localhost:8080/health`

---

## Supabase Email Redirect Setup (Important)

For registration confirmation and password recovery to work correctly, configure Supabase as follows:

1. **Authentication -> URL Configuration**
   - `Site URL`: `http://localhost:5173`
   - Add Redirect URLs:
     - `http://localhost:5173/`
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/reset-password`

2. **Email templates**
   - Use `{{ .ConfirmationURL }}` in both templates:
     - Confirm signup
     - Reset password

Do not hardcode links like `/auth/callback` or `/reset-password` without the Supabase token payload.

---

## Main API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/hello` | Connectivity test |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/register` | Register new account |
| `POST` | `/api/auth/confirm` | Confirm account via token/token_hash |
| `POST` | `/api/auth/forgot-password` | Send recovery email |
| `POST` | `/api/auth/reset-password` | Update password (requires bearer token from recovery link) |
| `GET` | `/api/profile/status` | Resolve user role and onboarding state |
| `POST` | `/api/tenant-profile` | Save tenant onboarding profile |

---

## Testing

```bash
# all
make test

# backend
go test -v -race ./...

# frontend
cd frontend && npm run test

# e2e
make e2e
```

Typecheck frontend:

```bash
cd frontend && npx tsc --noEmit
```

---

## Linting

```bash
make lint
```

---

## Build

```bash
make build-backend
make build-frontend
```

---

## Contributing

1. Create a feature branch
2. Implement and test changes
3. Run lint + tests before pushing
4. Open a Pull Request

Project coding rules are documented in [`AGENTS.md`](./AGENTS.md).

---

## License

MIT - see [`LICENSE`](LICENSE).
