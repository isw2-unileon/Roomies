# Roomies Description

Roomies is a web application designed to make it easier to find rooms and roommates through a user compatibility system. Unlike traditional rental platforms, the application focuses not only on the property itself but also on the people who will live together, taking into account their habits, preferences, and lifestyle.

Users looking for accommodation can create a profile including information such as budget, preferred area, move-in date, and living preferences. Based on this data, the platform recommends compatible homes and potential roommates. The matching process requires approval from the property owner and, if there are already people living in the apartment, from the current roommates as well, ensuring that all parties agree with the new tenant joining.

In addition, the platform allows flexible management of housing occupancy. For example, in an apartment with multiple available spots, tenants can propose to the owner to close the apartment for fewer occupants in exchange for paying a higher total rent. This allows the use of the property to be adapted to the living preferences of the users.

# Monorepo Template: Go + React/Vite

A monorepo template for full-stack applications with a **Go** backend and a **React + TypeScript + Vite** frontend.

## Project Structure

```text
├── backend/              Go API server (Gin)
│   ├── cmd/server/       Entry point
│   └── internal/config/  Environment config
│
├── frontend/             React + TypeScript + Vite + Tailwind
│   └── src/
│
├── e2e/                  Playwright E2E tests
├── .github/workflows/    CI/CD pipelines
└── Makefile              Dev commands
```

## Prerequisites

- [Go](https://go.dev/dl/) 1.24+
- [Node.js](https://nodejs.org/) 22+

## Getting Started

```bash
make install

# Terminal 1
make run-backend    # port 8080

# Terminal 2
make run-frontend   # port 5173
```

The Vite dev server proxies `/api` requests to the backend.

## Commands

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `make install`      | Install all dependencies      |
| `make run-backend`  | Backend with hot reload (Air) |
| `make run-frontend` | Frontend dev server (Vite)    |
| `make test`         | Run all tests                 |
| `make lint`         | Run all linters               |
| `make e2e`          | Run Playwright E2E tests      |

## API

| Method | Path         | Description     |
| ------ | ------------ | --------------- |
| `GET`  | `/health`    | Health check    |
| `GET`  | `/api/hello` | Sample endpoint |
