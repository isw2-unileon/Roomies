# Design Decisions

This document consolidates the key design decisions made during the development of Roomies. For formal Architecture Decision Records, see [docs/adr/](adr/).

## Why Go (Gin) for the Backend?

| Factor | Decision |
|--------|----------|
| **Performance** | Go provides low-latency request handling, important for real-time compatibility scoring |
| **Concurrency** | Goroutines and channels simplify handling concurrent requests from multiple tenants |
| **Deployment** | Single binary deployment — no runtime dependencies |
| **Team familiarity** | Part of the university curriculum (INSO2) |

Alternatives considered: Node.js/Express, Python/Django, Java/Spring Boot. Go was chosen for its simplicity, performance, and educational context.

## Why Supabase for Auth and Storage?

| Concern | Decision |
|---------|----------|
| **Authentication** | Supabase Auth provides email/password auth, email confirmation, password recovery out of the box |
| **File storage** | Supabase Storage handles avatar and photo uploads with built-in CDN |
| **Avoid building auth** | Implementing a secure auth system from scratch is error-prone and time-consuming |
| **Cost** | Generous free tier for development and small-scale production |

The alternative would be a custom auth system with bcrypt + JWT, which was rejected due to the complexity of email confirmation flows, password reset, and session management.

## Why PostgreSQL (pgx) Instead of an ORM?

| Factor | Decision |
|--------|----------|
| **Control** | Raw SQL gives full control over queries, especially for complex joins and GIS-like distance calculations |
| **Performance** | No ORM overhead; direct mapping with `pgx` |
| **Simplicity** | The query patterns are straightforward — an ORM would add complexity without significant benefit |
| **Type safety** | Go's type system paired with `pgx` provides sufficient safety |

The application primarily uses CRUD operations with moderate join complexity. The Haversine distance calculation for map-radius search is implemented as an in-memory computation rather than a PostGIS extension, keeping the schema simple.

## Why HTTP-Only Cookies for Auth Tokens?

| Factor | Decision |
|--------|----------|
| **Security** | HTTP-only cookies are not accessible via JavaScript, mitigating XSS token theft |
| **Simplicity** | The browser automatically includes cookies with requests |
| **Supabase compatibility** | Supabase Auth API works well with cookie-based sessions |

## Why MapLibre GL Instead of Google Maps / Leaflet?

| Factor | Decision |
|--------|----------|
| **Cost** | Free and open-source — no API key or usage fees required |
| **Privacy** | No data sent to Google — user location data stays under our control |
| **Features** | Provides GL rendering, custom markers, and interactive controls comparable to commercial offerings |

## Why a Hexagonal Architecture (Ports & Adapters)?

See [ADR-003](adr/003-hexagonal-architecture.md) for the full decision record.

**Summary:** Each domain (`apartment`, `application`, etc.) follows a hexagonal pattern with ports and adapters:

```text
Input adapter (HTTP handler) → Service (use cases) → Output ports (interfaces)
                                                         ↓
                                              Output adapters (PostgreSQL, Supabase)
```

The service layer defines interfaces (ports) and depends only on them — never on Gin, pgx, or external services directly. This provides testability, swappable adapters, and a core that is completely isolated from frameworks and infrastructure.

## Why React 19 + TypeScript + Vite?

See [ADR-005](adr/005-frontend-framework.md) for the full decision record.

**Summary:** React was chosen for its ecosystem, TypeScript for type safety, and Vite for fast development iteration. shadcn/ui provides accessible, customizable components without the weight of a full component library.

## Why Feature-Sliced Component Structure?

The frontend is organized by role (`tenant/`, `owner/`) instead of technical type (`components/`, `pages/`). This makes it easier to:

- Navigate the codebase when working on role-specific features
- Share code within a role without crossing concerns
- Reason about access control and feature boundaries

## Why Compatibility Scoring Instead of Simple Filtering?

The matching engine uses weighted scoring rather than boolean filters to:

- Show degrees of compatibility rather than binary matches
- Allow tenants to discover apartments that mostly match their preferences
- Facilitate group formation by ranking potential roommates
- Provide explainable results through the score breakdown

## Related Documents

- [Architecture overview](architecture.md)
- [Compatibility engine](compatibility-engine.md)
- [ADR-001: Monorepo structure](adr/001-monorepo-structure.md)
- [ADR-002: Supabase Auth & Storage](adr/002-supabase-auth-storage.md)
- [ADR-003: Hexagonal architecture](adr/003-hexagonal-architecture.md)
- [ADR-004: Compatibility engine](adr/004-compatibility-engine.md)
- [ADR-005: Frontend framework](adr/005-frontend-framework.md)
