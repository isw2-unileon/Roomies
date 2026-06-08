# System Architecture

## Overview

Roomies is a full-stack web application with a **Go REST API** backend and a **React SPA** frontend. Authentication and file storage are handled by **Supabase** (external service). The database is **PostgreSQL**.

```text
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Browser   │ ──▶ │  Go API      │ ──▶ │ PostgreSQL │
│  (React)    │ ◀── │  (Gin)       │ ◀── │            │
└─────────────┘     └──────┬───────┘     └────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Supabase    │
                    │  • Auth API  │
                    │  • Storage   │
                    └──────────────┘
```

## Backend Architecture (Go)

### Layer Diagram

```text
HTTP Request
    │
    ▼
┌──────────────────────┐
│   httpserver/        │  Gin router, CORS, middleware
│   • router.go        │  Auth middleware, role guards
│   • middleware.go    │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│   <domain>/          │  One package per domain
│   httpadapter/       │  HTTP handlers (bind, validate, respond)
│   ─────────────────  │
│   service/           │  Business logic (use cases)
│   ─────────────────  │
│   postgres/          │  Repository — SQL via pgx
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│   platform/          │  Cross-cutting
│   • config/          │  Environment loading
│   • database/        │  pgx connection pool
└──────────────────────┘
```

### Domains

| Domain          | Responsibility                                           |
|-----------------|----------------------------------------------------------|
| `auth`          | Supabase Auth integration, session management            |
| `profile`       | Tenant & owner profiles, avatar upload                   |
| `apartment`     | Property CRUD, map-radius search, detail                 |
| `application`   | Application lifecycle (apply, approve, reject, cancel)   |
| `group`         | Tenant groups, invitations, join requests, voting        |
| `message`       | Direct messaging, conversations, read status             |
| `matching`      | Compatibility scoring engine                             |
| `geocode`       | Reverse geocoding via Nominatim                          |
| `httpserver`    | Gin router, CORS, auth middleware                        |
| `platform`      | Config, database pool                                    |


### Request Flow

```
Client → httpserver (auth middleware) → httpadapter (parse + validate)
        → service (business logic)    → postgres (SQL query)
        → service (process result)    → httpadapter (serialize response)
        → Client
```

### Auth Middleware

The `httpserver/middleware.go` extracts JWT claims from HTTP-only cookies (`roomies_access_token`), validates them against Supabase, and sets `user_id` and `user_role` in the Gin context. Role-based guards reject requests that don't match the required role.

## Frontend Architecture (React)

### Layer Diagram

```text
┌──────────────────────────────┐
│   pages/                     │  Route-level components
│   • auth/                    │  Login, Register, Callback, ResetPassword
│   • tenant/                  │  Explore, Groups, Applications, Messages, Profile
│   • owner/                   │  Dashboard, Properties, Applications, Messages, Profile
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   components/                │  UI components
│   • auth/                    │  LoginForm, RegisterForm
│   • common/                  │  InviteDialog, LanguageSwitcher, SegmentedLevelField
│   • map/                     │  MapLibre GL wrapper
│   • tenant/                  │  Feature-specific tenant components
│   • owner/                   │  Feature-specific owner components
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   services/ + api.ts         │  HTTP client and service modules
│   • authService.ts           │
│   • tenantService.ts         │
│   • ownerService.ts          │
│   • messageService.ts        │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   Go API (REST)              │
└──────────────────────────────┘
```

### Routing

React Router v7 with role-based protected routes:

| Path                        | Role     | Component            |
|-----------------------------|----------|----------------------|
| `/login`                    | public   | LoginPage            |
| `/register`                 | public   | RegisterPage         |
| `/auth/callback`            | public   | AuthCallbackPage     |
| `/reset-password`           | public   | ResetPasswordPage    |
| `/onboarding/tenant`        | tenant   | TenantOnboarding     |
| `/tenant/explore`           | tenant   | TenantExplore        |
| `/tenant/groups`            | tenant   | TenantGroups         |
| `/tenant/applications`      | tenant   | TenantApplications   |
| `/tenant/messages`          | tenant   | TenantMessages       |
| `/tenant/profile`           | tenant   | TenantProfile        |
| `/owner/properties`         | owner    | OwnerDashboard       |
| `/owner/applications`       | owner    | OwnerApplications    |
| `/owner/messages`           | owner    | OwnerMessages        |
| `/owner/profile`            | owner    | OwnerProfile         |

## External Services

| Service                    | Purpose                                     |
|----------------------------|---------------------------------------------|
| **Supabase Auth API**      | User registration, login, email confirmation |
| **Supabase Storage**       | Avatar and apartment photo storage          |
| **OpenStreetMap Nominatim**| Reverse geocoding (coordinates → address)   |

## Data Flow Examples

### Tenant explores apartments with compatibility scores

```
1. Browser → GET /api/tenant/apartments?lat=...&lng=...&radius=...
2. httpserver → auth middleware (validate JWT cookie)
3. apartment/httpadapter → parse query params
4. apartment/service → call matching/service for scores
5. apartment/postgres → SQL query with Haversine distance
6. apartment/service → enrich results with compatibility scores
7. apartment/httpadapter → JSON response
8. Browser → renders MapLibre map + property cards
```

### Owner approves an application

```
1. Browser → POST /api/owner/applications/:id/approve
2. httpserver → auth middleware → owner role guard
3. application/httpadapter → parse application ID
4. application/service → validate application is PENDING_OWNER
5. application/postgres → UPDATE status to FULLY_CONFIRMED
6. application/service → update apartment occupied_spots
7. application/httpadapter → 200 OK
```

## Related Docs

- [Data model](data-model.md)
- [API reference](api-reference.md)
- [Frontend architecture](frontend.md)
- [Compatibility engine](compatibility-engine.md)
