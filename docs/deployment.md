# Deployment Guide

## Production Architecture

```text
Internet
    │
    ▼
┌────────────────┐     ┌────────────────┐
│  Render        │     │  Supabase      │
│  • Go API      │────▶│  • PostgreSQL  │
│  • Static      │     │  • Auth API    │
│    frontend    │     │  • Storage     │
└────────────────┘     └────────────────┘
```

The application is deployed on [Render](https://render.com/) with a separate Supabase project for production.

## Prerequisites

- A [Render](https://render.com/) account
- A [Supabase](https://supabase.com/) project (production tier)
- Git repository pushed to GitHub

## Environment Variables (Production)

| Variable                   | Description                                   | Source                          |
|----------------------------|-----------------------------------------------|---------------------------------|
| `PORT`                     | Backend server port                           | Set by Render (default: 8080)   |
| `GIN_MODE`                 | Set to `release`                              |                                 |
| `CORS_ALLOW_ORIGIN`        | Frontend URL (e.g. `https://roomies.onrender.com`) |                              |
| `DATABASE_URL`             | PostgreSQL connection URL                     | Supabase Database settings      |
| `SUPABASE_URL`             | Supabase project URL                          | Supabase API settings           |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key                             | Supabase API settings           |
| `SUPABASE_SECRET_KEY`      | Supabase service_role key                     | Supabase API settings           |
| `FRONTEND_URL`             | Frontend base URL for redirects               |                                 |

## Deploying on Render

### 1. Create a Web Service (Backend)

1. **New +** → **Web Service**
2. Connect your GitHub repository
3. Settings:
   - **Name**: `roomies-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Runtime**: Go
   - **Build Command**: `go build -o server ./backend/cmd/server`
   - **Start Command**: `./server`
   - **Plan**: Free or Starter

4. Add all environment variables from the table above.

### 2. Create a Static Site (Frontend)

1. **New +** → **Static Site**
2. Connect the same repository
3. Settings:
   - **Name**: `roomies-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free

4. Add environment variables:
   - `VITE_API_URL`: Your backend URL (e.g. `https://roomies-api.onrender.com`)

### 3. Configure Supabase (Production)

1. **Authentication → URL Configuration**
   - `Site URL`: `https://roomies-frontend.onrender.com`
   - Redirect URLs:
     - `https://roomies-frontend.onrender.com/`
     - `https://roomies-frontend.onrender.com/auth/callback`
     - `https://roomies-frontend.onrender.com/reset-password`

2. **Email templates**: Use `{{ .ConfirmationURL }}`

### 4. Deploy Database Schema

Run the SQL schema from `supabase/schema.sql` against the production database:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Execute

## Using Docker Compose (Alternative)

```bash
# Build and run locally with Docker
docker-compose up --build
```

The `docker-compose.yml` defines:
- `backend`: Go API server on port 8080
- `frontend`: Nginx serving the built frontend on port 80

For production, ensure the frontend build points to the correct API URL.

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD (see `.github/workflows/`):

| Workflow      | Trigger                  | Action                         |
|---------------|--------------------------|--------------------------------|
| `backend.yml` | Push/PR to `backend/`    | Lint, test, build Go binary    |
| `frontend.yml`| Push/PR to `frontend/`   | ESLint, typecheck, Vite build  |
| `e2e.yml`     | Manual dispatch          | Playwright E2E tests           |
| `codeql.yml`  | Weekly + push/PR         | Security analysis              |
| `deploy.yml`  | Push to `main`           | Deploy to production           |

## Supabase Email Redirect (Important)

For registration confirmation and password recovery:

1. **Site URL** must match the frontend deployment URL
2. **Redirect URLs** must include all valid paths
3. **Email templates** must use `{{ .ConfirmationURL }}` — do not hardcode URLs
4. The frontend handles the token via `/auth/callback` and `/reset-password` pages

## Health Check

After deployment, verify the backend is running:

```
GET https://roomies-api.onrender.com/health
```

Expected response: `200 OK`

## Related Docs

- [Getting started](getting-started.md)
- [Architecture overview](architecture.md)
- [Testing guide](testing.md)
