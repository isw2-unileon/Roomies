# ADR-002: Supabase for Authentication and File Storage

## Status

Accepted

## Date

2026-02-16

## Context

The application needs:
1. User authentication with email/password, email confirmation, and password recovery
2. File storage for user avatars and apartment photos
3. Secure session management

Building these from scratch would require significant effort and security review.

## Decision

Use **Supabase Auth** for authentication and **Supabase Storage** for file uploads.

- Supabase Auth provides email/password authentication, email confirmation flows, password reset, and session management via JWT tokens
- The Go backend integrates with Supabase Auth API (GoTrue HTTP client) rather than the PostgreSQL-level `auth.users` table
- Supabase Storage handles avatar uploads and apartment photos with signed URLs
- Sessions are managed via HTTP-only cookies (`roomies_access_token`, `roomies_refresh_token`) that the backend validates on each request

## Consequences

**Positive:**
- Avoid implementing a custom auth system with all its security pitfalls
- Email confirmation and password recovery work out of the box
- File storage includes CDN delivery and signed URLs
- The backend stays stateless (session state lives in Supabase)

**Negative:**
- External dependency — if Supabase is down, auth and uploads stop working
- Database and auth live in the same Supabase project, creating coupling
- Limited customization of auth flows (must work within Supabase's model)
- Service role key (`SUPABASE_SECRET_KEY`) must be kept secret in the backend
