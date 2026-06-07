# Data Model

## Entity-Relationship Overview

```text
users ──┬── owner_profiles        (1:1)
        ├── tenant_profiles       (1:1)
        ├── apartments            (1:N, as owner)
        ├── applications          (1:N, as tenant)
        ├── group_members         (1:N)
        ├── group_invitations     (1:N, as inviter/invitee)
        ├── group_join_requests   (1:N, as requester)
        ├── group_join_request_votes (1:N, as voter)
        └── messages              (1:N, as sender/receiver)

apartments ──┬── apartment_photos (1:N)
             ├── applications     (1:N)
             ├── groups           (1:N)
             └── messages         (1:N)

groups ──┬── group_members        (1:N)
         ├── group_invitations    (1:N)
         ├── group_join_requests  (1:N)
         ├── applications         (1:N)
         └── messages             (1:N)
```

## Tables

### `users`

| Column      | Type     | Constraints                | Description          |
|-------------|----------|----------------------------|----------------------|
| id          | uuid     | PK, `gen_random_uuid()`    | User identifier      |
| email       | text     | NOT NULL, UNIQUE           | Email address        |
| full_name   | text     | NOT NULL                   | Display name         |
| avatar_url  | text     | nullable                   | Avatar image URL     |
| role        | text     | NOT NULL, CHECK(tenant|owner|admin) | User role   |
| bio         | text     | nullable                   | Short biography      |
| created_at  | timestamptz | DEFAULT now()           | Creation timestamp   |
| updated_at  | timestamptz | DEFAULT now()           | Last update timestamp|

### `tenant_profiles`

| Column              | Type        | Constraints                          | Description                    |
|---------------------|-------------|--------------------------------------|--------------------------------|
| id                  | uuid        | PK, `gen_random_uuid()`              | Profile identifier             |
| user_id             | uuid        | NOT NULL, UNIQUE, FK → users(id)     | User reference                 |
| budget_max          | integer     | nullable                             | Maximum monthly budget (€)     |
| preferred_area      | text        | nullable                             | Preferred neighborhood/area    |
| smoking             | boolean     | DEFAULT false                        | Smoker?                        |
| pets                | boolean     | DEFAULT false                        | Has pets?                      |
| age                 | integer     | nullable                             | Age                            |
| sex                 | text        | nullable, CHECK(male|female|other|prefer_not_to_say) | Sex           |
| tenant_situation    | text        | nullable, CHECK(student|worker|unemployed) | Current situation      |
| degree              | text        | nullable                             | Degree program                 |
| profession          | text        | nullable                             | Profession/job                 |
| socialization_level | text        | nullable, CHECK(low|medium|high)     | Socialization preference       |
| nightlife_level     | text        | nullable, CHECK(low|medium|high)     | Nightlife preference           |
| created_at          | timestamptz | DEFAULT now()                        | Creation timestamp             |
| updated_at          | timestamptz | DEFAULT now()                        | Last update timestamp          |

### `owner_profiles`

| Column       | Type        | Constraints                     | Description             |
|--------------|-------------|---------------------------------|-------------------------|
| id           | uuid        | PK, `gen_random_uuid()`         | Profile identifier      |
| user_id      | uuid        | NOT NULL, UNIQUE, FK → users(id)| User reference          |
| display_name | text        | nullable                        | Public display name     |
| phone        | text        | nullable                        | Contact phone           |
| verified     | boolean     | DEFAULT false                   | Owner verified flag     |
| created_at   | timestamptz | DEFAULT now()                   | Creation timestamp      |
| updated_at   | timestamptz | DEFAULT now()                   | Last update timestamp   |

### `apartments`

| Column           | Type        | Constraints                                           | Description                |
|------------------|-------------|-------------------------------------------------------|----------------------------|
| id               | uuid        | PK, `gen_random_uuid()`                               | Apartment identifier       |
| owner_id         | uuid        | NOT NULL, FK → users(id)                              | Owner reference            |
| title            | text        | NOT NULL                                              | Property title             |
| description      | text        | nullable                                              | Description text           |
| address          | text        | NOT NULL                                              | Street address             |
| area             | text        | nullable                                              | Neighborhood/zone          |
| total_spots      | integer     | NOT NULL                                              | Total room spots           |
| occupied_spots   | integer     | DEFAULT 0, NOT NULL                                   | Currently occupied         |
| base_rent        | integer     | NOT NULL                                              | Monthly rent per spot (€)  |
| status           | text        | NOT NULL, CHECK( AVAILABLE \| PARTIALLY_OCCUPIED \| FULL \| CLOSED \| HIDDEN ) | Listing status |
| latitude         | double      | nullable                                              | Map latitude               |
| longitude        | double      | nullable                                              | Map longitude              |
| bathrooms        | integer     | nullable                                              | Number of bathrooms        |
| surface_m2       | integer     | nullable                                              | Surface area in m²         |
| floor            | integer     | nullable                                              | Floor number               |
| smoking_allowed  | boolean     | DEFAULT true                                          | Smoking allowed?           |
| pets_allowed     | boolean     | DEFAULT true                                          | Pets allowed?              |
| students_allowed | boolean     | DEFAULT true                                          | Students allowed?          |
| notes            | text        | nullable                                              | Internal notes             |
| available_spots  | integer     | nullable                                              | Computed available spots   |
| created_at       | timestamptz | DEFAULT now()                                         | Creation timestamp         |
| updated_at       | timestamptz | DEFAULT now()                                         | Last update timestamp      |

### `apartment_photos`

| Column       | Type        | Constraints                          | Description            |
|--------------|-------------|--------------------------------------|------------------------|
| id           | uuid        | PK, `gen_random_uuid()`              | Photo identifier       |
| apartment_id | uuid        | NOT NULL, FK → apartments(id) CASCADE| Apartment reference    |
| url          | text        | NOT NULL                             | Photo URL (Supabase)   |
| position     | integer     | DEFAULT 0                            | Display order          |
| created_at   | timestamptz | DEFAULT now()                        | Upload timestamp       |

### `groups`

| Column         | Type        | Constraints                                            | Description                |
|----------------|-------------|--------------------------------------------------------|----------------------------|
| id             | uuid        | PK, `gen_random_uuid()`                                | Group identifier           |
| created_by     | uuid        | NOT NULL, FK → users(id)                               | Group creator              |
| name           | text        | nullable                                               | Group name                 |
| description    | text        | nullable                                               | Group description          |
| status         | text        | NOT NULL, CHECK( FORMING \| READY \| APPLIED \| ACCEPTED \| REJECTED \| CLOSED ) | Group state machine |
| apartment_id   | uuid        | nullable, FK → apartments(id) SET NULL                 | Assigned apartment         |
| owner_accepted | boolean     | DEFAULT false, NOT NULL                                | Owner confirmed flag       |
| created_at     | timestamptz | DEFAULT now()                                          | Creation timestamp         |
| updated_at     | timestamptz | DEFAULT now()                                          | Last update timestamp      |

### `group_members`

| Column           | Type        | Constraints                                     | Description              |
|------------------|-------------|-------------------------------------------------|--------------------------|
| id               | uuid        | PK, `gen_random_uuid()`                         | Membership identifier    |
| group_id         | uuid        | NOT NULL, FK → groups(id) CASCADE               | Group reference          |
| user_id          | uuid        | NOT NULL, FK → users(id) CASCADE                | User reference           |
| role             | text        | NOT NULL, CHECK(owner|member)                   | Role in group            |
| status           | text        | NOT NULL, CHECK(INVITED|ACCEPTED|REJECTED|LEFT) | Membership status        |
| member_accepted  | boolean     | DEFAULT false, NOT NULL                         | Accepted by member?      |
| joined_at        | timestamptz | nullable                                        | When they joined         |
| created_at       | timestamptz | DEFAULT now()                                   | Creation timestamp       |

**Unique constraint**: `(group_id, user_id)`

### `group_invitations`

| Column         | Type        | Constraints                                           | Description              |
|----------------|-------------|-------------------------------------------------------|--------------------------|
| id             | uuid        | PK, `gen_random_uuid()`                               | Invitation identifier    |
| group_id       | uuid        | NOT NULL, FK → groups(id) CASCADE                     | Group reference          |
| invited_by     | uuid        | NOT NULL, FK → users(id) CASCADE                      | Who sent the invitation  |
| invited_user_id| uuid        | NOT NULL, FK → users(id) CASCADE                      | Invited user             |
| status         | text        | NOT NULL, CHECK(PENDING|ACCEPTED|REJECTED|EXPIRED)    | Invitation status        |
| created_at     | timestamptz | DEFAULT now()                                         | Creation timestamp       |
| responded_at   | timestamptz | nullable                                              | Response timestamp       |

### `group_join_requests`

| Column            | Type        | Constraints                                                  | Description               |
|-------------------|-------------|--------------------------------------------------------------|---------------------------|
| id                | uuid        | PK, `gen_random_uuid()`                                      | Request identifier        |
| group_id          | uuid        | NOT NULL, FK → groups(id) CASCADE                            | Target group              |
| requester_user_id | uuid        | NOT NULL, FK → users(id) CASCADE                             | Who wants to join         |
| status            | text        | NOT NULL, CHECK(PENDING|APPROVED|REJECTED|CANCELLED)         | Request status            |
| source            | text        | DEFAULT 'DIRECT_REQUEST', CHECK(DIRECT_REQUEST|GROUP_INVITATION) | How the request originated |
| created_at        | timestamptz | DEFAULT now(), NOT NULL                                      | Creation timestamp        |
| updated_at        | timestamptz | DEFAULT now(), NOT NULL                                      | Last update timestamp     |

**Partial unique index**: `(group_id, requester_user_id)` WHERE status = 'PENDING'

### `group_join_request_votes`

| Column      | Type        | Constraints                                      | Description            |
|-------------|-------------|--------------------------------------------------|------------------------|
| id          | uuid        | PK, `gen_random_uuid()`                          | Vote identifier        |
| request_id  | uuid        | NOT NULL, FK → group_join_requests(id) CASCADE   | Join request reference |
| voter_user_id | uuid      | NOT NULL, FK → users(id) CASCADE                 | Who voted              |
| decision    | text        | NOT NULL, CHECK(APPROVE|REJECT)                  | Vote decision          |
| created_at  | timestamptz | DEFAULT now(), NOT NULL                          | Creation timestamp     |
| updated_at  | timestamptz | DEFAULT now(), NOT NULL                          | Last update timestamp  |

**Unique constraint**: `(request_id, voter_user_id)`

### `applications`

| Column              | Type        | Constraints                                                     | Description                |
|---------------------|-------------|-----------------------------------------------------------------|----------------------------|
| id                  | uuid        | PK, `gen_random_uuid()`                                         | Application identifier     |
| apartment_id        | uuid        | NOT NULL, FK → apartments(id) CASCADE                           | Target apartment           |
| tenant_id           | uuid        | nullable, FK → users(id) CASCADE                                | Individual applicant       |
| group_id            | uuid        | nullable, FK → groups(id) CASCADE                               | Group applicant            |
| type                | text        | NOT NULL, CHECK(individual|group)                               | Application type           |
| status              | text        | NOT NULL, CHECK(PENDING_OWNER|REJECTED_BY_OWNER|FULLY_CONFIRMED|CANCELLED) | Application status |
| owner_confirmed_at  | timestamptz | nullable                                                        | When owner confirmed       |
| created_at          | timestamptz | DEFAULT now()                                                   | Creation timestamp         |
| updated_at          | timestamptz | DEFAULT now()                                                   | Last update timestamp      |

**Constraint**: Exactly one of `tenant_id` or `group_id` must be set (not both).

**Partial unique indexes**:
- `(apartment_id, tenant_id)` WHERE status IN (PENDING_OWNER, PENDING_CONFIRMED_TENANTS)
- `(apartment_id, group_id)` WHERE status IN (PENDING_OWNER, PENDING_CONFIRMED_TENANTS)

### `messages`

| Column       | Type        | Constraints                               | Description                 |
|--------------|-------------|-------------------------------------------|-----------------------------|
| id           | uuid        | PK, `gen_random_uuid()`                   | Message identifier          |
| sender_id    | uuid        | NOT NULL, FK → users(id) CASCADE          | Who sent the message        |
| receiver_id  | uuid        | nullable, FK → users(id) CASCADE          | Who receives (if individual)|
| apartment_id | uuid        | nullable, FK → apartments(id) CASCADE     | Scoped to an apartment      |
| group_id     | uuid        | nullable, FK → groups(id) CASCADE         | Scoped to a group           |
| content      | text        | NOT NULL                                  | Message body                |
| created_at   | timestamptz | DEFAULT now(), NOT NULL                   | Sent timestamp              |
| read_at      | timestamptz | nullable                                  | When it was read            |

## Indexes

Key indexes beyond PKs and FKs:

| Index                                      | Purpose                                    |
|--------------------------------------------|--------------------------------------------|
| `idx_messages_conversation`                | Efficient conversation listing             |
| `idx_group_members_group_user_status`      | Lookup user membership in groups           |
| `idx_applications_individual_active_unique`| Prevent duplicate active individual apps   |
| `idx_applications_group_active_unique`     | Prevent duplicate active group apps        |
| `idx_group_join_requests_pending_unique`   | One pending join request per user per group|
| `idx_group_invitations_group_user_status`  | Lookup invitations by group/user/status    |

## Triggers

All tables with `updated_at` have a `BEFORE UPDATE` trigger that calls `update_updated_at_column()` to automatically set `updated_at = NOW()`.

## Row Level Security (RLS)

All tables have RLS enabled. Access is controlled by Supabase policies (managed externally).

## Related Docs

- [Architecture overview](architecture.md)
- [API reference](api-reference.md)
- [Compatibility engine](compatibility-engine.md)
