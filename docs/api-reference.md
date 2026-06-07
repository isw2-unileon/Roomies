# API Reference

Base URL: `http://localhost:8080` (development) or `https://roomies-1-fegt.onrender.com` (production)

## Authentication

All authenticated endpoints require HTTP-only cookies:
- `roomies_access_token` — short-lived JWT
- `roomies_refresh_token` — long-lived refresh token

---

## Public Endpoints

### Health Check

```
GET /health
```

Response: `200 OK`

### Connectivity Test

```
GET /api/hello
```

Response: `200 OK` with greeting message.

### Auth — Login

```
POST /api/auth/login
```

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK` — Sets `roomies_access_token` and `roomies_refresh_token` cookies.

### Auth — Register

```
POST /api/auth/register
```

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "tenant"
}
```

**Response:** `201 Created`

### Auth — Confirm Email

```
POST /api/auth/confirm
```

**Request body:**
```json
{
  "token_hash": "..."
}
```

**Response:** `200 OK`

### Auth — Forgot Password

```
POST /api/auth/forgot-password
```

**Request body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

### Auth — Reset Password

```
POST /api/auth/reset-password
```

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "password": "newpassword"
}
```

**Response:** `200 OK`

### Auth — Logout

```
POST /api/auth/logout
```

**Response:** `200 OK` — Clears session cookies.

### List Apartments (Public)

```
GET /api/apartments
```

**Query parameters:**
| Param  | Type   | Description          |
|--------|--------|----------------------|
| query  | string | Search by title/area |
| area   | string | Filter by zone       |
| min_rent| int   | Minimum rent         |
| max_rent| int   | Maximum rent         |
| rooms  | int    | Minimum rooms        |
| pets   | bool   | Pets allowed?        |
| smoking| bool   | Smoking allowed?     |

**Response:** `200 OK` — Array of apartments.

### Apartments Map View

```
GET /api/apartments/map
```

**Query parameters:**
| Param  | Type   | Description                |
|--------|--------|----------------------------|
| lat    | float  | Center latitude            |
| lng    | float  | Center longitude           |
| radius | float  | Search radius in km        |

**Response:** `200 OK` — Array of apartments within radius with distance.

### Reverse Geocode

```
GET /api/geocode/reverse?lat=...&lng=...
```

**Response:** `200 OK`
```json
{
  "display_name": "Calle Ancha, León, Spain",
  "address": { ... }
}
```

---

## Authenticated Endpoints (Any Role)

### Get Profile Status

```
GET /api/profile/status
```

**Response:**
```json
{
  "role": "tenant",
  "onboarding_completed": true,
  "has_profile": true
}
```

This is the primary endpoint to determine post-login redirect.

### Create/Update Tenant Profile

```
POST /api/tenant-profile
PUT /api/tenant-profile
```

**Request body:**
```json
{
  "budget_max": 600,
  "preferred_area": "Centro",
  "smoking": false,
  "pets": false,
  "age": 22,
  "sex": "male",
  "tenant_situation": "student",
  "degree": "Computer Science",
  "socialization_level": "medium",
  "nightlife_level": "low"
}
```

### Get Personal Tenant Info

```
GET /api/tenant-profile/personal
PUT /api/tenant-profile/personal
```

Personal info includes `full_name`, `bio`, `avatar_url`.

### Upload Avatar

```
POST /api/tenant-profile/avatar
POST /api/owner-profile/avatar
```

**Request:** Multipart form with `avatar` file field.

**Response:** `200 OK` — Updated avatar URL.

### Get My Tenant Profile

```
GET /api/tenant-profile/me
```

### Get Specific Tenant Profile

```
GET /api/tenant-profile/:userId
```

### List Public Tenant Profiles

```
GET /api/tenant/profiles
```

Returns profiles with compatibility scores relative to the requesting tenant.

### Owner Profile

```
GET  /api/owner-profile/me
PUT  /api/owner-profile
```

### Apartments — Interested Tenants

```
GET /api/apartments/:id/interested
```

---

## Tenant Endpoints

### Explore Apartments (with Compatibility)

```
GET /api/tenant/apartments
```

Returns apartments with compatibility score (0-100) for each listing.

### Explore Map View

```
GET /api/tenant/apartments/map
```

Same as public map but includes compatibility scores.

### Apartment Detail

```
GET /api/apartments/:id
```

**Response:** Full detail with photos, services, current residents, interested tenants, compatibility breakdown, and application status.

### Apartment Residents

```
GET /api/apartments/:id/tenants
```

### Applications

```
POST /api/apartments/:id/applications
POST /api/tenant/groups/:id/applications
```

**Individual application body:**
```json
{
  "type": "individual"
}
```

**Group application body:**
```json
{
  "type": "group"
}
```

```
POST   /api/applications/:id/cancel
POST   /api/applications/:id/leave
GET    /api/tenant/applications
```

### Groups

```
GET    /api/tenant/groups
GET    /api/tenant/groups/:id
POST   /api/tenant/groups
DELETE /api/tenant/groups/:id
PATCH  /api/tenant/groups/:id/leave
```

**Create group body:**
```json
{
  "name": "My Group",
  "description": "Looking for a flat together"
}
```

### Group Invitations

```
POST   /api/tenant/groups/:id/invitations
POST   /api/tenant/groups/:id/accept
POST   /api/tenant/group-invitations/:id/accept
POST   /api/tenant/group-invitations/:id/reject
GET    /api/tenant/group-candidates
```

**Send invitation body:**
```json
{
  "invited_user_id": "uuid"
}
```

### Join Requests

```
POST   /api/tenant/groups/:id/join-request
GET    /api/tenant/groups/:id/join-requests
POST   /api/tenant/groups/:id/join-requests/:requestID/vote
POST   /api/tenant/groups/:id/join-requests/:requestID/cancel
```

**Vote body:**
```json
{
  "decision": "APPROVE"
}
```

### Group Apartment Assignment

```
PATCH /api/tenant/groups/:id/apartment
```

**Request body:**
```json
{
  "apartment_id": "uuid"
}
```

### My Group for Apartment

```
GET /api/apartments/:id/my-group
```

### Messages

```
POST /api/messages
```

**Request body:**
```json
{
  "apartment_id": "uuid",
  "receiver_id": "uuid",
  "content": "Hello, I'm interested in the room."
}
```

```
GET  /api/messages/conversations
GET  /api/messages/conversations/:apartmentId/:otherUserId
POST /api/messages/conversations/:apartmentId/:otherUserId/read
```

---

## Owner Endpoints

### My Properties

```
GET  /api/owner/apartments
GET  /api/owner/apartments/:id
PATCH /api/owner/apartments/:id
```

### Create Property

```
POST /api/apartments
```

**Request body:**
```json
{
  "title": "Cozy room in Centro",
  "description": "Bright room with city views",
  "address": "Calle Ancha, 10",
  "area": "Centro",
  "total_spots": 3,
  "base_rent": 450,
  "latitude": 42.5987,
  "longitude": -5.5671,
  "bathrooms": 2,
  "surface_m2": 90,
  "floor": 3,
  "smoking_allowed": false,
  "pets_allowed": true,
  "students_allowed": true
}
```

### Upload Photos

```
POST /api/owner/apartment-photos
```

Multipart form with `photos` file field (multiple files).

### Close / Reopen Property

```
POST /api/owner/apartments/:id/close
POST /api/owner/apartments/:id/reopen
```

### Manage Tenants

```
GET  /api/owner/apartments/:id/tenants
POST /api/owner/apartments/:id/tenants/:tenantID/remove
```

### Applications

```
GET  /api/owner/applications
GET  /api/owner/applications/:id
POST /api/owner/applications/:id/approve
POST /api/owner/applications/:id/reject
```

---

## Common Response Codes

| Code | Meaning              |
|------|----------------------|
| 200  | Success              |
| 201  | Created              |
| 400  | Bad request / validation error |
| 401  | Unauthenticated      |
| 403  | Forbidden (wrong role) |
| 404  | Not found            |
| 409  | Conflict (duplicate) |
| 500  | Internal server error|

Error responses follow:
```json
{
  "error": "description of what went wrong"
}
```

## Related Docs

- [Architecture overview](architecture.md)
- [Data model](data-model.md)
- [Compatibility engine](compatibility-engine.md)
