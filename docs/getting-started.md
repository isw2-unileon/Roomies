# Getting Started

How to use this template to start a new project.

## 1. Create Your Repository

Click **Use this template** on GitHub (or clone and re-init):

```bash
git clone https://github.com/isw2-unileon/proyect-scaffolding.git my-project
cd my-project
rm -rf .git
git init
```

## 2. Rename the Go Module

Update the module path in `go.mod` to match your new repository:

```bash
# Replace with your actual module path
go mod edit -module github.com/your-org/my-project
```

Then update all import paths in Go files:

```bash
grep -rl "isw2-unileon/proyect-scaffolding" backend/ | xargs sed -i '' 's|isw2-unileon/proyect-scaffolding|your-org/my-project|g'
```

Run `go mod tidy` to verify.

## 3. Update the Auto-Assign Workflow

Edit `.github/workflows/auto-assign.yml` and replace `jferrl` with your GitHub username.

## 4. Install Dependencies

```bash
make install
```

This runs `go mod download`, `npm ci` in `frontend/`, and `npm ci` in `e2e/`.

## 5. Run Locally

Open two terminals:

```bash
# Terminal 1 - Backend on :8080
make run-backend

# Terminal 2 - Frontend on :5173
make run-frontend
```

Open http://localhost:5173 to see the app. The Vite dev server proxies `/api` and `/health` requests to the Go backend.

## 6. Build Your Application

### Backend

Add your Go code following the existing layout:

```text
backend/
├── cmd/server/main.go          # Entry point - add routes here
└── internal/
    ├── config/config.go        # Add env vars here
    ├── domain/                 # Create: domain models
    ├── service/                # Create: business logic
    ├── repository/             # Create: data access
    └── api/                    # Create: HTTP handlers
```

The sample `/api/hello` endpoint in `main.go` shows where to start. As the app grows, extract handlers into `internal/api/` and business logic into `internal/service/`.

### Frontend

The frontend is a standard Vite + React + TypeScript + Tailwind project:

```text
frontend/src/
├── App.tsx                     # Root component - start here
├── main.tsx                    # Entry point
├── index.css                   # Tailwind imports
├── components/                 # Create: React components
├── services/                   # Create: API client functions
└── types/                      # Create: TypeScript types
```

Path aliases are configured -- use `@/components/Foo` instead of relative imports.

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

## 8. CI/CD

The template includes four GitHub Actions workflows:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `backend.yml` | Push/PR changing `backend/` or `go.mod` | `go vet` + `go test -race` + `go build` |
| `frontend.yml` | Push/PR changing `frontend/` | ESLint + TypeScript check + Vite build |
| `e2e.yml` | Manual dispatch | Playwright tests across browsers |
| `codeql.yml` | Weekly + push/PR | Security analysis for Go and JS/TS |

## 9. Record Decisions

Use Architecture Decision Records to document important choices:

```bash
cp docs/adr/000-template.md docs/adr/002-your-decision.md
```

See [docs/adr/](adr/) for the template and existing records.

## Related Docs

- [Why a monorepo](monorepo.md)
- [Go best practices](golang.md)
- [ADR template](adr/000-template.md)
