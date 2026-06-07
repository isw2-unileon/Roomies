![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

# Roomies

Roomies is a web platform that helps people find compatible roommates and housing. Beyond standard listing platforms, the focus is on *living compatibility* — matching people by lifestyle, habits, and preferences so owners and tenants can make better decisions.

Key features: property exploration with map view and compatibility scoring, tenant groups with invitations and join requests, direct messaging between tenants and owners, full application lifecycle management, and role-based dashboards for both tenants and owners.

---

## Why Roomies

- Match people by lifestyle, not only by property details
- Support both tenant and owner roles with dedicated dashboards
- Tenants can form groups and apply together to properties
- Compatibility engine scores matches between tenants, apartments, and potential roommates
- Built-in messaging for direct communication
- Internationalized UI (English, Spanish, French, German)

---

## Current Functional Scope

### Authentication
- Login with email + password
- Register account with role selection (`tenant` or `owner`)
- Email confirmation flow via callback page (`/auth/callback`)
- Forgot password email flow
- Password reset page (`/reset-password`) with new password confirmation
- Session management via HTTP-only cookies (access + refresh tokens)
- Logout endpoint to clear server-side session

### Role-based routing & access control
- Unauthenticated users redirected to login
- Tenant with pending onboarding -> `/onboarding/tenant`
- Tenant with completed profile -> `/tenant/explore`
- Owner -> `/owner/properties`
- Protected routes enforce both authentication and correct role

### Tenant onboarding
- Two-step onboarding: personal information (name, bio, avatar) + housing preferences (budget, area, cleanliness, schedule, pets, smoking, etc.)
- Profile saved to `tenant_profiles`; redirected to explore on completion

### Property exploration (tenant)
- Browse available apartments with a filterable grid view
- Map view powered by **MapLibre GL** with radius-based search
- Filters: search query, area, price range, rooms, pets, smoking
- Real-time compatibility score displayed on each property card
- Detail page with: photo gallery, services & location, current residents, interested tenants, compatibility breakdown, and contact owner option

### Applications (tenant)
- Apply to an apartment (solo or as a group)
- Cancel an application before it is approved
- Leave an accepted apartment
- View all applications with status tracking (pending, approved, rejected)
- Group applications: apply with entire group to a pre-assigned apartment

### Tenant groups
- Create groups, invite other tenants by compatibility score
- Join requests with member voting (approve/reject)
- Group statuses: `FORMING`, `READY`, `APPLIED`, `ACCEPTED`, `REJECTED`, `CLOSED`
- Assign an apartment to the group
- Leave or delete a group

### Owner dashboard
- Overview of owned properties with key metrics
- Activity log and recent issues
- Publish new property listings with photos, rules, and location picker
- Close/reopen property listings
- Manage tenants living in each property

### Owner applications
- View all incoming applications across properties
- Approve or reject tenant applications
- Remove accepted tenants from a property

### Messaging
- Direct messaging between tenants and owners (scoped to an apartment)
- Conversation list with latest message preview
- Mark conversations as read

### Profiles
- **Tenant**: personal info (name, email, avatar), housing preferences (budget, area, cleanliness, schedule, pets, noise, smoking, etc.), compatibility-based roommate discovery
- **Owner**: personal info, display name, phone, avatar upload

### Compatibility engine
- Tenant-to-apartment matching based on budget, area, pets, smoking rules
- Tenant-to-tenant roommate compatibility based on budget, lifestyle, schedule, socialization, nightlife, smoking, studies/profession, age, pets
- Weighted scoring from 0–100 with descriptive reasons

### Map & geocoding
- MapLibre GL-based interactive map for property exploration
- Reverse geocoding via OpenStreetMap Nominatim API to resolve coordinates to zone/address

### Internationalization
- i18next with support for: English (`en`), Spanish (`es`), French (`fr`), German (`de`)
- Language preference persisted in localStorage
- Default: Spanish

---

## Architecture

### Backend (Go 1.24+)

Organized into domain packages following a service-repository-handler pattern:

| Package | Responsibility |
|---------|---------------|
| `auth/` | Authentication via Supabase Auth API (login, register, confirm, password recovery) |
| `profile/` | Tenant & owner profiles, avatar management, public profile listing with compatibility |
| `apartment/` | Property CRUD, map-radius search (Haversine), detail view with compatibility |
| `application/` | Application lifecycle (apply, approve, reject, cancel, leave), group applications |
| `group/` | Tenant groups with invitations, join requests, voting, apartment assignment |
| `message/` | Direct messaging between users, conversation management |
| `matching/` | Compatibility score engine (tenant↔apartment, tenant↔tenant) |
| `geocode/` | Reverse geocoding via OpenStreetMap Nominatim |
| `httpserver/` | Gin router setup, CORS, auth middleware, role-based guards |
| `platform/` | Config loading, PostgreSQL connection pool (pgx) |

- Framework: **Gin**
- Database: **PostgreSQL** via **pgx/pgxpool**
- Auth: **Supabase Auth API** (GoTrue HTTP client)
- Storage: **Supabase Storage** for avatars and apartment photos
- Session: HTTP-only cookies (`roomies_access_token`, `roomies_refresh_token`)

### Frontend (React 19 + TypeScript 5.7)

| Layer | Technology |
|-------|-----------|
| Build | Vite 6 |
| Routing | React Router v7 with role-based protected routes |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix UI primitives) |
| Maps | MapLibre GL |
| Icons | Heroicons + Lucide React |
| i18n | i18next + react-i18next (es, en, fr, de) |
| API | Custom `apiFetch` wrapper, service modules per domain |
| Testing | Vitest + Testing Library + happy-dom |

### Testing & quality
- Backend: `go test -v -race ./...`
- Frontend: `vitest` with Testing Library
- E2E: Playwright (Chromium, Firefox, WebKit)
- Linting: `golangci-lint` + ESLint + TypeScript (`tsc --noEmit`)

---

## Project Structure

```text
.
├── backend/
│   ├── cmd/server/                 # Entry point
│   ├── internal/
│   │   ├── apartment/              # Apartment CRUD, search, detail
│   │   ├── application/            # Application lifecycle
│   │   ├── auth/                   # Auth service + Supabase client
│   │   ├── closure/                # (placeholder)
│   │   ├── geocode/                # Reverse geocoding (Nominatim)
│   │   ├── group/                  # Tenant groups, invitations, voting
│   │   ├── httpserver/             # Gin router, middleware, CORS
│   │   ├── matching/               # Compatibility scoring engine
│   │   ├── message/                # Direct messaging
│   │   ├── platform/
│   │   │   ├── config/             # Environment loading
│   │   │   └── database/           # DB connection pool
│   │   └── profile/                # Tenant & owner profiles
│   └── bin/                        # Compiled binaries
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── auth/               # Login/register form components
│       │   ├── common/             # Shared UI components
│       │   ├── map/                # MapLibre GL wrapper
│       │   ├── owner/              # Owner-specific components
│       │   │   ├── owner_applications/
│       │   │   ├── owner_messages/
│       │   │   ├── owner_profile/
│       │   │   ├── owner_properties/
│       │   │   └── owner_publish_property/
│       │   └── tenant/             # Tenant-specific components
│       │       ├── tenant_applications/
│       │       ├── tenant_explore_details/
│       │       ├── tenant_groups/
│       │       ├── tenant_interested/
│       │       ├── tenant_onboarding/
│       │       ├── tenant_profile/
│       │       └── tenants_explore/
│       ├── hooks/                  # Custom React hooks
│       ├── i18n/                   # Translation files (es, en, fr, de)
│       ├── lib/                    # Utility functions
│       ├── pages/
│       │   ├── auth/               # Login, Register, Callback, ResetPassword
│       │   ├── owner/              # Dashboard, Publish, Applications, Messages, Profile
│       │   └── tenant/             # Onboarding, Explore, Detail, Groups, Messages, Profile
│       ├── routes/                 # Route definitions + protected route guard
│       ├── services/               # API service modules (auth, tenant, owner, message)
│       ├── styles/                 # Global styles
│       └── types/                  # TypeScript type definitions
├── e2e/                            # Playwright E2E tests
├── supabase/
│   └── migrations/                 # SQL migrations (001–029)
├── docs/                           # Documentation and ADRs
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

Create `backend/.env` with the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `8080` |
| `GIN_MODE` | Gin mode | `debug` |
| `CORS_ALLOW_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key for auth API calls | - |
| `SUPABASE_SECRET_KEY` | Supabase service role key for storage signing | - |
| `FRONTEND_URL` | Frontend base URL for redirects | `http://localhost:5173` |

Important:
- `SUPABASE_URL` and `DATABASE_URL` must target the same project
- Backend starts only if DB connection succeeds
- `SUPABASE_SECRET_KEY` is required for apartment image URL signing (optional, falls back gracefully)

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

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/hello` | Connectivity test |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/register` | Register new account |
| `POST` | `/api/auth/confirm` | Confirm account via token |
| `POST` | `/api/auth/forgot-password` | Send recovery email |
| `POST` | `/api/auth/logout` | Clear server session |
| `POST` | `/api/auth/reset-password` | Update password (requires Bearer token) |
| `GET` | `/api/apartments` | List apartments (with filters) |
| `GET` | `/api/apartments/map` | List apartments within map radius |
| `GET` | `/api/geocode/reverse` | Reverse geocode (lat, lng) |

### Authenticated (any role)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/profile/status` | Resolve role and onboarding state |
| `POST` | `/api/tenant-profile` | Save tenant onboarding preferences |
| `PUT` | `/api/tenant-profile` | Update tenant preferences |
| `GET` | `/api/tenant-profile/personal` | Get personal profile |
| `PUT` | `/api/tenant-profile/personal` | Save personal profile |
| `POST` | `/api/tenant-profile/avatar` | Upload tenant avatar |
| `GET` | `/api/tenant-profile/me` | Get my tenant profile |
| `GET` | `/api/tenant/profiles` | List public tenant profiles (with compatibility) |
| `GET` | `/api/tenant-profile/:userId` | Get specific tenant profile |
| `GET` | `/api/owner-profile/me` | Get owner profile |
| `PUT` | `/api/owner-profile` | Update owner profile |
| `POST` | `/api/owner-profile/avatar` | Upload owner avatar |
| `GET` | `/api/apartments/:id/interested` | List interested tenants for an apartment |

### Tenant-only

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tenant/apartments` | Explore apartments (with compatibility scores) |
| `GET` | `/api/tenant/apartments/map` | Map view apartment search |
| `GET` | `/api/apartments/:id` | Apartment detail (compatibility + application status) |
| `GET` | `/api/apartments/:id/tenants` | List residents of an apartment |
| `POST` | `/api/apartments/:id/applications` | Apply to an apartment |
| `POST` | `/api/tenant/groups/:id/applications` | Apply group to assigned apartment |
| `POST` | `/api/applications/:id/cancel` | Cancel an application |
| `POST` | `/api/applications/:id/leave` | Leave an accepted apartment |
| `GET` | `/api/tenant/applications` | List my applications |
| `GET` | `/api/tenant/groups` | List my groups (with filters) |
| `GET` | `/api/tenant/groups/:id` | Get group details |
| `POST` | `/api/tenant/groups` | Create a group |
| `DELETE` | `/api/tenant/groups/:id` | Delete a group |
| `PATCH` | `/api/tenant/groups/:id/leave` | Leave a group |
| `POST` | `/api/tenant/groups/:id/invitations` | Invite users to a group |
| `POST` | `/api/tenant/groups/:id/accept` | Accept group membership |
| `POST` | `/api/tenant/groups/:id/join-request` | Request to join a group |
| `GET` | `/api/tenant/groups/:id/join-requests` | List join requests for a group |
| `POST` | `/api/tenant/groups/:id/join-requests/:requestID/vote` | Vote on a join request |
| `POST` | `/api/tenant/groups/:id/join-requests/:requestID/cancel` | Cancel a join request |
| `GET` | `/api/tenant/group-candidates` | Find users to invite |
| `POST` | `/api/tenant/group-invitations/:id/accept` | Accept group invitation |
| `POST` | `/api/tenant/group-invitations/:id/reject` | Reject group invitation |
| `PATCH` | `/api/tenant/groups/:id/apartment` | Assign apartment to group |
| `GET` | `/api/apartments/:id/my-group` | Get my group for an apartment |
| `POST` | `/api/messages` | Send a message |
| `GET` | `/api/messages/conversations` | List conversations |
| `GET` | `/api/messages/conversations/:apartmentId/:otherUserId` | List conversation messages |
| `POST` | `/api/messages/conversations/:apartmentId/:otherUserId/read` | Mark conversation read |

### Owner-only

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/owner/apartments` | List my properties |
| `GET` | `/api/owner/apartments/:id` | Get property details |
| `PATCH` | `/api/owner/apartments/:id` | Update property |
| `POST` | `/api/owner/apartment-photos` | Upload property photos |
| `POST` | `/api/apartments` | Create a new property |
| `POST` | `/api/owner/apartments/:id/close` | Close a property |
| `POST` | `/api/owner/apartments/:id/reopen` | Reopen a property |
| `GET` | `/api/owner/apartments/:id/tenants` | List tenants in a property |
| `GET` | `/api/owner/applications` | List received applications |
| `GET` | `/api/owner/applications/:id` | Get application details |
| `POST` | `/api/owner/applications/:id/approve` | Approve an application |
| `POST` | `/api/owner/applications/:id/reject` | Reject an application |
| `POST` | `/api/owner/apartments/:id/tenants/:tenantID/remove` | Remove tenant from property |

---

## Testing

```bash
# all
make test

# backend
go test -v -race ./...

# frontend
cd frontend && npm run test

# typecheck
cd frontend && npx tsc --noEmit

# e2e (requires backend + frontend running)
make e2e
```

---

## Linting

```bash
make lint
```

---

## Build

```bash
make build
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
