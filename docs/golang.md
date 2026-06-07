# Go Backend Conventions

Guidelines and conventions used in the Roomies Go backend.

## Domain Package Pattern

Every domain (`apartment`, `application`, `auth`, `group`, `message`, `matching`, `profile`, `geocode`) follows the same layered structure:

```text
internal/<domain>/
├── <domain>.go            # Domain models, interfaces (repository, service)
├── service/
│   └── <domain>.go        # Business logic
├── postgres/
│   └── <domain>.go        # PostgreSQL repository implementation
└── httpadapter/
    └── <domain>.go        # HTTP handlers (Gin)
```

### Example: `internal/apartment/`

```
internal/apartment/
├── apartment.go           # Apartment struct, Repository interface, Service interface
├── service/
│   └── apartment.go       # ServiceImpl — business logic
├── postgres/
│   └── apartment.go       # RepositoryImpl — SQL queries via pgx
└── httpadapter/
    └── apartment.go       # HTTP handlers — bindings, responses
```

## Dependency Injection

All services are wired in `cmd/server/main.go`. Dependencies are passed explicitly through constructors:

```go
// Typical constructor
func NewService(repo Repository, matchingSvc matching.Service) Service {
    return &serviceImpl{repo: repo, matchingSvc: matchingSvc}
}
```

## Interfaces at the Consumer

Interfaces are defined in the domain package where they are consumed, not where they are implemented:

```go
// apartment/apartment.go
type Repository interface {
    FindByID(ctx context.Context, id uuid.UUID) (*Apartment, error)
    Search(ctx context.Context, filter SearchFilter) ([]Apartment, error)
}

type Service interface {
    GetByID(ctx context.Context, id uuid.UUID) (*ApartmentDetail, error)
    Search(ctx context.Context, filter SearchFilter) ([]Apartment, error)
}
```

The `postgres/` and `service/` packages implement these interfaces implicitly.

## Error Handling

- Wrap errors with context using `%w`:
  ```go
  return nil, fmt.Errorf("finding apartment %s: %w", id, err)
  ```
- Define domain-specific sentinel errors in the domain package:
  ```go
  var ErrNotFound = errors.New("apartment not found")
  ```
- HTTP adapters map domain errors to HTTP status codes:
  ```go
  if errors.Is(err, ErrNotFound) {
      c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
      return
  }
  ```

## Context Propagation

- `context.Context` is threaded through all layers: handler → service → repository
- Used for request cancellation, timeouts, and scoped values (e.g., authenticated user ID)

```go
// Getting the authenticated user ID from context
userID := c.GetString("user_id")
```

## Models and Validation

- Domain models are plain structs with `json` and optionally `db` tags
- No ORM — raw SQL via `pgx`
- Input validation happens in the HTTP adapter layer before calling the service

## Testing

- Table-driven tests with `t.Run` for subtests
- Mock repositories via the `Repository` interface
- Run with `-race` to detect data races:
  ```bash
  go test -v -race ./...
  ```

## Key Dependencies

| Library       | Purpose                    |
|---------------|----------------------------|
| `gin`         | HTTP framework             |
| `pgx`         | PostgreSQL driver/pool     |
| `google/uuid` | UUID generation            |
| `slog`        | Structured logging (std)   |
| `golang-jwt`  | JWT token parsing          |

## Further Reading

- [Effective Go](https://go.dev/doc/effective_go)
- [Google Go Style Guide](https://google.github.io/styleguide/go/)
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
