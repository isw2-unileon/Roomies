# ADR-003: Domain-Driven Layered Architecture

## Status

Accepted

## Date

2026-02-16

## Context

The backend needs a consistent structure for implementing features across multiple domains (apartments, applications, groups, messages, profiles, etc.). Each domain requires:
- Data access (PostgreSQL queries)
- Business logic (validation, calculations, orchestration)
- HTTP interface (request parsing, response serialization)

Without a consistent pattern, the codebase would become disorganized as features grow.

## Decision

Each domain follows a strict **4-layer pattern** within its own package:

```text
internal/<domain>/
├── <domain>.go          # 1. Domain models + interfaces (Repository, Service)
├── service/
│   └── <domain>.go      # 2. Business logic implementation
├── postgres/
│   └── <domain>.go      # 3. PostgreSQL repository implementation
└── httpadapter/
    └── <domain>.go      # 4. HTTP handlers (Gin)
```

Key rules:
- Domain models are plain Go structs with `json` tags
- Interfaces are defined at the consumer (domain package), not the implementer
- Dependencies are injected via constructor functions
- Business logic never depends on HTTP or database concerns directly
- Repositories accept `context.Context` for cancellation and tracing

## Consequences

**Positive:**
- Clear separation of concerns — easy to reason about each layer
- Testability — services can be tested with mock repositories
- Consistent mental model for all team members to add new features
- Easy to swap implementations (e.g., mock repository for tests)

**Negative:**
- More files per feature (4 files for a simple CRUD domain)
- Boilerplate for passing data through all layers
- Overkill for very simple operations (one query + one response)
