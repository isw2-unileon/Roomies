![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

# Roomies

Roomies is a web application designed to make it easier to find rooms and roommates through a user compatibility system. Unlike traditional rental platforms, the application focuses not only on the property itself but also on the people who will live together, taking into account their habits, preferences, and lifestyle.

Users looking for accommodation can create a profile including information such as budget, preferred area, move-in date, and living preferences. Based on this data, the platform recommends compatible homes and potential roommates. The matching process requires approval from the property owner and, if there are already people living in the apartment, from the current roommates as well, ensuring that all parties agree with the new tenant joining.

In addition, the platform allows flexible management of housing occupancy. For example, in an apartment with multiple available spots, tenants can propose to the owner to close the apartment for fewer occupants in exchange for paying a higher total rent. This allows the use of the property to be adapted to the living preferences of the users.

---

## 🧑‍💻 Team Members

| Name | Email |
|------|-------|
| Diego Fuertes | dfuerl00@estudiantes.unileon.es |
| Sergio López | sloper00@estudiantes.unileon.es |
| Aitor Fernandes | afernf38@estudiantes.unileon.es |
| Jairo Ugidos | jugidh00@estudiantes.unileon.es |

---

## 🛠️ Tech Stack

### Backend
- **Go** 1.24+
- **Gin** - HTTP web framework
- **slog** - Structured logging

### Frontend
- **React** 19
- **TypeScript** 5.7
- **Vite** 6
- **Tailwind CSS** 4

### Testing & DevOps
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **golangci-lint** - Go linting
- **ESLint** - JS/TS linting

---

## 📁 Project Structure

```
├── backend/                  # Go API server (Gin)
│   ├── cmd/server/           # Entry point
│   ├── internal/
│   │   └── config/           # Environment configuration
│   └── .air.toml             # Hot reload config
│
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── eslint.config.js
│   ├── vitest.config.ts
│   └── package.json
│
├── e2e/                      # Playwright E2E tests
│   ├── tests/
│   ├── playwright.config.ts
│   └── package.json
│
├── .github/workflows/        # CI/CD pipelines
├── Makefile                   # Development commands
├── go.mod                     # Go module definition
└── .golangci.yml              # Go linter configuration
```

---

## 📋 Prerequisites

- [Go](https://go.dev/dl/) **1.24+**
- [Node.js](https://nodejs.org/) **22+**
- [Git](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/isw2-unileon/Grupo-14.git
cd Grupo-14
```

### 2. Install dependencies

```bash
make install
```

This will install:
- Air (Go hot reload)
- golangci-lint (Go linter)
- Go modules
- Frontend npm dependencies
- E2E npm dependencies

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Available environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `GIN_MODE` | Gin mode (debug/release) | `debug` |
| `CORS_ALLOW_ORIGIN` | CORS allowed origin | `*` |
| `FRONTEND_URL` | Frontend URL used for password recovery redirect | `http://localhost:5173` |

---

## 🏃 Running the Project

### Development mode

```bash
# Terminal 1 - Backend with hot reload (port 8080)
make run-backend

# Terminal 2 - Frontend dev server (port 5173)
make run-frontend
```

The Vite dev server proxies `/api` requests to the backend automatically.

### Detailed run guide (without `make`)

Use this flow if you do not have `make` installed (common on Windows).

1. Install dependencies from project root:

```bash
go mod download
cd frontend && npm ci
cd ../e2e && npm ci
cd ..
```

2. Configure backend environment:

```bash
cp backend/.env.example backend/.env
```

3. Set a valid `DATABASE_URL` in `backend/.env`.
   - The backend starts only if database connection succeeds.
   - `SUPABASE_URL` and `DATABASE_URL` should point to the same Supabase project.

4. Start backend (Terminal 1):

```bash
cd backend
go run ./cmd/server
```

5. Start frontend (Terminal 2):

```bash
cd frontend && npm run dev
```

6. Open the app:
   - Frontend: `http://localhost:5173`
   - Backend health check: `http://localhost:8080/health`

7. Quick verification:
   - If backend is running correctly, `/health` returns `{ "status": "ok" }`.
   - Frontend requests to `/api/*` are proxied to backend automatically.

### Production build

```bash
# Build backend
make build-backend

# Build frontend
make build-frontend
```

---

## 🗄️ Database Migrations

> *(To be implemented)*

```bash
# Coming soon
make migrate
```

---

## 🧪 Running Tests

### All tests (backend + frontend)

```bash
make test
```

### Backend tests only

```bash
go test -v -race ./...
```

### Frontend tests only

```bash
cd frontend && npm run test
```

### Run a single test file

```bash
# Backend
go test -v -race ./backend/...

# Frontend
npx vitest run src/components/MyComponent.test.tsx
```

### E2E tests

```bash
make e2e
```

---

## 🔍 Linting

```bash
make lint
```

This runs both Go and frontend linters.

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/hello` | Sample endpoint |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the guidelines in [AGENTS.md](./AGENTS.md)
- Run `make lint` before committing
- Ensure all tests pass with `make test`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Gin](https://github.com/gin-gonic/gin) for the backend
- Built with [React](https://react.dev/) + [Vite](https://vitejs.dev/) for the frontend
