# Go Backend Conventions

Guidelines and conventions used in the Roomies Go backend.

## Hexagonal Architecture (Ports & Adapters)

Every domain (`apartment`, `application`, `auth`, `group`, `message`, `matching`, `profile`, `geocode`) follows a **hexagonal (ports & adapters)** structure:

```text
internal/<domain>/
├── <domain>.go            # DOMAIN MODELS — pure Go structs, no external imports
├── service/
│   └── <domain>.go        # USE CASES + OUTPUT PORTS (interfaces)
│                           • repository interface
│                           • identityProvider interface (auth)
│                           • imageStorage interface (profile, group)
├── postgres/
│   └── <domain>.go        # OUTPUT ADAPTER — PostgreSQL implementation
└── httpadapter/
    └── <domain>.go        # INPUT ADAPTER — Gin HTTP handlers
```

### Example: `internal/profile/`

```
internal/profile/
├── profile.go             # TenantProfileInput, OwnerProfile — pure structs
├── service/
│   └── service.go         # Service + repository interface + imageStorage interface
├── postgres/
│   └── repository.go      # Output adapter: implements repository interface via pgx
└── httpadapter/
    └── handler.go         # Input adapter: Gin handlers, bindings, validation
```

## Dependency Injection (Composition Root)

All services and adapters are wired in `cmd/server/main.go` — the **composition root**. Dependencies are passed explicitly through constructors:

```go
// Output adapters created first (bottom-up)
profileRepo := profilepostgres.NewRepository(database.DB)
supabaseClient, _ := authsupabase.NewClient(url, key)

// Core service receives interfaces (output ports)
profileService := profileservice.NewService(profileRepo, storageClient)

// Input adapter receives core service
r := httpserver.NewRouter(cfg, authService, profileService, apartmentService, ...)
```

## Output Ports (Interfaces) at the Consumer

Output ports are defined as **interfaces in the `service/` package** where they are consumed, not where they are implemented:

```go
// profile/service/service.go — output port definition
type repository interface {
    UpsertTenantProfile(ctx context.Context, userID string, input profile.TenantProfileInput) error
    GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfileInput, error)
    // ...
}

type imageStorage interface {
    UploadObject(ctx context.Context, bucket, objectPath, contentType string, fileData []byte) error
    CreateSignedURL(ctx context.Context, bucket, path string, expiresIn int) (string, error)
}
```

The output adapters (`postgres/repository.go`, `supabase/client.go`) implement these interfaces implicitly. The core service never imports Gin, pgx, or any external framework — it only knows about its interfaces.

## Error Handling

- Wrap errors with context using `%w`:
  ```go
  return nil, fmt.Errorf("finding apartment %s: %w", id, err)
  ```
- Define domain-specific sentinel errors in the domain package:
  ```go
  var ErrNotFound = errors.New("apartment not found")
  ```
- Input adapters (httpadapter) map domain errors to HTTP status codes:
  ```go
  // The core returns sentinel errors, the input adapter translates them to HTTP
  if errors.Is(err, apartmentservice.ErrApartmentNotFound) {
      c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
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

## Key Dependencies (by layer)

| Library       | Layer/Adapter            | Purpose                    |
|---------------|--------------------------|----------------------------|
| `gin`         | Input adapter            | HTTP framework             |
| `pgx`         | Output adapter (postgres)| PostgreSQL driver/pool     |
| `google/uuid` | Domain/Across            | UUID generation            |
| `slog`        | Cross-cutting            | Structured logging (std)   |
| `golang-jwt`  | Input adapter            | JWT token parsing          |

Note: the **core domain and service packages** import only the standard library and their own domain package. Framework dependencies are confined to adapters (input: `httpadapter/`, output: `postgres/`, `supabase/`).

## Further Reading

- [Effective Go](https://go.dev/doc/effective_go)
- [Google Go Style Guide](https://google.github.io/styleguide/go/)
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
