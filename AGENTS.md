# AGENTS.md - Roomies Application Agent Guidelines

This document provides guidelines for agentic coding agents working on the Roomies project.

## Project Overview

**Roomies** is a roommate/flatmate matching application with a Go backend (Gin) and React + TypeScript frontend (Vite).

---

## Build/Lint/Test Commands

### Backend (Go)

```bash
# Run all backend tests
go test -v -race ./...

# Run tests with coverage
go test -v -race -cover ./...

# Run a single test file
go test -v -race ./backend/...

# Run a single test function
go test -v -race -run "TestFunctionName" ./...

# Build backend binary
go build -o backend/bin/server ./backend/cmd/server

# Run with hot reload (requires Air)
make run-backend
```

### Frontend (React/TypeScript)

```bash
# Run all frontend tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file (Vitest)
npx vitest run src/components/MyComponent.test.tsx

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
make e2e

# Run E2E tests from e2e directory
cd e2e && npx playwright test

# Run a single E2E test
cd e2e && npx playwright test tests/specific-test.spec.ts

# Run with UI mode
cd e2e && npx playwright test --ui

# Run headed (visible browser)
cd e2e && npx playwright test --headed
```

### Monorepo Commands

```bash
# Install all dependencies
make install

# Run all tests (backend + frontend)
make test

# Run all linters
make lint

# Run backend with hot reload
make run-backend

# Run frontend dev server
make run-frontend
```

---

## Code Style Guidelines

### Go (Backend)

**Formatting & Style:**
- Use `gofmt` for formatting (enforced by golangci-lint)
- Maximum function complexity: 15 (gocyclo)
- Maximum function statements: 50 (funlen)
- Maximum duplicated code threshold: 100 tokens (dupl)

**Naming Conventions:**
- Use `camelCase` for variable/function names
- Use `PascalCase` for exported types/structs
- Use `snake_case` for database fields and JSON keys
- Error variables should be named `err` or `errSomething`
- Context should be the first parameter: `func Foo(ctx context.Context, ...)`
- Getters should NOT use "Get" prefix: `user.Name()` not `user.GetName()`

**Imports:**
- Group imports: stdlib, external packages, internal packages
- Use aliased imports when needed for clarity
- Standard library imports first, then third-party, then internal

**Error Handling:**
- Always handle errors with `if err != nil`
- Return early on errors (don't use else)
- Wrap errors with context using `fmt.Errorf("operation: %w", err)`
- Never ignore errors with `_`
- Use `errorlint` for comprehensive error checking

**Example:**
```go
func GetUser(ctx context.Context, id string) (*User, error) {
    user, err := db.FindUser(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("finding user %s: %w", id, err)
    }
    return user, nil
}
```

**Required Linters:**
- errcheck, errorlint (error handling)
- staticcheck, govet (code quality)
- revive (naming conventions)
- gosec (security)
- nolintlint (lint directives)

---

### TypeScript/React (Frontend)

**Formatting & Style:**
- Use ESLint and Prettier conventions
- 2-space indentation
- Single quotes for strings
- No semicolons at end of statements

**Naming Conventions:**
- Components: `PascalCase` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useAuth`)
- Utilities: `camelCase` (e.g., `formatDate.ts`)
- Types/Interfaces: `PascalCase` with descriptive names (e.g., `UserProfile`)
- Constants: `SCREAMING_SNAKE_CASE`

**TypeScript:**
- Use explicit types; avoid `any`
- Use interfaces for object shapes
- Use type for unions and intersections
- Prefer `unknown` over `any` for truly unknown types

**Imports:**
- React imports first
- Then external libraries
- Then internal imports
- Relative imports with `@/` alias for src (e.g., `@/components/Button`)

**React Best Practices:**
- Use functional components with hooks
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback` when passed as props
- Extract reusable logic into custom hooks
- Keep components small and focused

**Example:**
```typescript
interface UserCardProps {
  user: User;
  onSelect?: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  const handleClick = useCallback(() => {
    onSelect?.(user.id);
  }, [onSelect, user.id]);

  return <div onClick={handleClick}>{user.name}</div>;
}
```

**Required ESLint Plugins:**
- react-hooks (rules enforced)
- react-refresh (dev only)

---

## Project Structure

```
backend/                    # Go API server
├── cmd/server/main.go     # Entry point
├── internal/
│   └── config/            # Environment configuration
│       └── config.go
├── .air.toml             # Hot reload config
└── tmp/                   # Air build output

frontend/                   # React + TypeScript + Vite
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── eslint.config.js
├── vitest.config.ts
└── package.json

e2e/                        # Playwright E2E tests
├── tests/
├── playwright.config.ts
└── package.json

.github/workflows/          # CI/CD pipelines
├── backend.yml
├── frontend.yml
└── e2e.yml
```

---

## Environment Variables

**Backend (.env):**
- `PORT` - Server port (default: 8080)
- `GIN_MODE` - Gin mode: debug/release (default: debug)
- `CORS_ALLOW_ORIGIN` - CORS origin (default: *)

**Frontend:** Uses Vite env variables (`VITE_*` prefix)

---

## CI/CD Pipeline

- **Backend CI:** Runs on push/PR to `backend/**`, runs golangci-lint, tests, and build
- **Frontend CI:** Runs on push/PR to `frontend/**`, runs lint, typecheck, and build
- **E2E CI:** Runs on push/PR to `e2e/**`, runs Playwright tests on chromium, firefox, webkit

---

## Key Technologies

- **Backend:** Go 1.24+, Gin, slog (structured logging)
- **Frontend:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4
- **Testing:** Vitest (unit), Playwright (E2E)
- **Linting:** golangci-lint (Go), ESLint + TypeScript ESLint (TS/JS)
