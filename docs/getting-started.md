# Getting Started

Guide to set up and run the Roomies project locally.

## Prerequisites

- [Go](https://go.dev/dl/) `1.24+`
- [Node.js](https://nodejs.org/) `22+`
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) project (free tier works)

## 1. Clone the Repository

```bash
git clone https://github.com/isw2-unileon/Roomies.git
cd Roomies
```

## 2. Install Dependencies

```bash
make install
```

This runs `go mod download`, `npm ci` in `frontend/`, and `npm ci` in `e2e/`.

## 3. Configure Environment Variables

Create `backend/.env` in the project root:

```env
PORT=8080
GIN_MODE=debug
CORS_ALLOW_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
SUPABASE_SECRET_KEY=<your-service-role-key>
FRONTEND_URL=http://localhost:5173
```

### Getting Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API
2. Copy **Project URL** → `SUPABASE_URL`
3. Copy **anon public** key → `SUPABASE_PUBLISHABLE_KEY`
4. Copy **service_role** key → `SUPABASE_SECRET_KEY`
5. In **Database** settings, find your connection string → `DATABASE_URL`

> `SUPABASE_URL` and `DATABASE_URL` must target the same project. The backend starts only if the DB connection succeeds.

## 4. Supabase Email Redirect Setup

For registration confirmation and password recovery to work correctly:

1. **Authentication → URL Configuration**
   - `Site URL`: `http://localhost:5173`
   - Redirect URLs:
     - `http://localhost:5173/`
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/reset-password`

2. **Email templates**
   - Use `{{ .ConfirmationURL }}` in both templates:
     - Confirm signup
     - Reset password

Do not hardcode links without the Supabase token payload.

## 5. Run Locally

Open two terminals:

```bash
# Terminal 1 — Backend on :8080
make run-backend

# Terminal 2 — Frontend on :5173
make run-frontend
```

Open http://localhost:5173 to see the app. The Vite dev server proxies `/api` and `/health` requests to the Go backend.

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

## 6. Verify It Works

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/health
- API test: http://localhost:8080/api/hello

## 7. Available Make Commands

```bash
make install         # Install all dependencies
make run-backend     # Backend with hot reload (Air)
make run-frontend    # Frontend dev server (Vite)
make build-backend   # Build Go binary
make build-frontend  # Build frontend for production
make test            # Run all tests
make lint            # Run all linters
make e2e             # Run Playwright E2E tests
```

## 8. Project Structure Overview

```text
.
├── backend/       # Go API (Gin framework)
├── frontend/      # React 19 + TypeScript + Vite
├── e2e/           # Playwright E2E tests
├── supabase/      # Database schema + config
├── docs/          # Documentation + ADRs
└── .github/       # CI/CD workflows
```

## Related Docs

- [Architecture overview](architecture.md)
- [API reference](api-reference.md)
- [Frontend guide](frontend.md)
- [Deployment guide](deployment.md)
- [Testing guide](testing.md)
