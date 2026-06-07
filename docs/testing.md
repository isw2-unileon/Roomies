# Testing Guide

## Test Pyramid

```text
        ╱╲
       ╱ E2E ╲
      ╱────────╲
     ╱Integration╲
    ╱──────────────╲
   ╱   Unit Tests   ╲
  ╱──────────────────╲
```

- **Unit tests**: Go (table-driven), Vitest (component)
- **Integration**: Go (with real/mock PostgreSQL), Vitest (with mocked API)
- **E2E**: Playwright (full browser tests)

## Backend Tests (Go)

### Running Tests

```bash
# All backend tests
go test -v -race ./...

# Single package
go test -v -race ./backend/internal/apartment/...

# With coverage
go test -v -race -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Writing Tests

Follow table-driven test patterns:

```go
func TestCalculateCompatibility(t *testing.T) {
    tests := []struct {
        name     string
        tenant   TenantProfile
        apt      Apartment
        expected int
    }{
        {
            name: "perfect match",
            tenant: TenantProfile{BudgetMax: 500, Smoking: false, Pets: false},
            apartment: Apartment{BaseRent: 450, SmokingAllowed: false, PetsAllowed: false},
            expected: 100,
        },
        {
            name: "budget too low",
            tenant: TenantProfile{BudgetMax: 300, Smoking: false, Pets: false},
            apartment: Apartment{BaseRent: 500, SmokingAllowed: false, PetsAllowed: false},
            expected: 60, // only budget penalty
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := CalculateCompatibility(tt.tenant, tt.apartment)
            if got != tt.expected {
                t.Errorf("got %d, want %d", got, tt.expected)
            }
        })
    }
}
```

### Mocking Repositories

Define interfaces in the domain package, then implement mocks for tests:

```go
type mockApartmentRepo struct {
    apartments []Apartment
    err        error
}

func (m *mockApartmentRepo) FindByID(ctx context.Context, id uuid.UUID) (*Apartment, error) {
    if m.err != nil {
        return nil, m.err
    }
    for _, a := range m.apartments {
        if a.ID == id {
            return &a, nil
        }
    }
    return nil, ErrNotFound
}
```

### Run Tests with Race Detection

Always use `-race` locally and in CI:

```bash
go test -race ./...
```

## Frontend Tests (Vitest)

### Running Tests

```bash
cd frontend

# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

### Writing Component Tests

Uses `@testing-library/react` for component testing:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CompatibilityBadge } from './CompatibilityBadge';

describe('CompatibilityBadge', () => {
    it('shows green for high score', () => {
        render(<CompatibilityBadge score={85} />);
        expect(screen.getByText('85%')).toBeDefined();
        expect(screen.getByText('85%').className).toContain('green');
    });

    it('shows red for low score', () => {
        render(<CompatibilityBadge score={15} />);
        expect(screen.getByText('15%')).toBeDefined();
        expect(screen.getByText('15%').className).toContain('red');
    });
});
```

### Type Checking

```bash
cd frontend
npx tsc --noEmit
```

## E2E Tests (Playwright)

### Running Tests

```bash
# Full E2E suite (requires backend + frontend running)
make e2e

# Or manually
cd e2e
npx playwright test
```

### Test Structure

Tests are in `e2e/tests/`:

```
e2e/tests/
└── health.spec.ts
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get('http://localhost:8080/health');
    expect(response.status()).toBe(200);
});
```

### CI Configuration

The `e2e.yml` workflow runs E2E tests on manual dispatch across Chromium, Firefox, and WebKit.

## Linting

```bash
# Backend (golangci-lint)
golangci-lint run ./...

# Frontend (ESLint)
cd frontend && npm run lint

# All
make lint
```

## CI Integration

All tests run automatically in CI:

| Workflow      | Trigger               | What runs                        |
|---------------|-----------------------|----------------------------------|
| `backend.yml` | Push/PR to `backend/` | `go vet`, `go test -race`, build |
| `frontend.yml`| Push/PR to `frontend/`| ESLint, `tsc --noEmit`, Vite build |
| `e2e.yml`     | Manual dispatch       | Playwright across 3 browsers     |

## Related Docs

- [Getting started](getting-started.md)
- [Frontend architecture](frontend.md)
- [Go backend conventions](golang.md)
