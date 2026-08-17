# NextRole

A job application tracker built as a proper full-stack project — not just a CRUD dashboard.
Track applications through a real pipeline (Saved → Applied → HR Interview → Technical →
Final → Offer / Rejected), with status history, interview notes, contacts, dashboard
statistics, and a job-description analyzer that extracts required skills, experience level,
and language requirements from a pasted posting.

## Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React + TypeScript (Vite) |
| Backend   | Kotlin + Spring Boot |
| Database  | PostgreSQL (Flyway migrations) |
| Auth      | JWT (Spring Security, BCrypt) |
| Infra     | Docker / Docker Compose |
| Testing   | JUnit + MockK (backend), Vitest + React Testing Library (frontend) |

## Current features

- User registration & login (JWT-based, rate-limited)
- Application CRUD (company, role, location, salary range, tech stack, job description,
  application date, status, notes)
- Table view with search

This is an actively growing project — status history, interviews, contacts, notes, a
dashboard, analytics, calendar view, and the job-description analyzer are built in
subsequent phases on top of this foundation.

## Getting started

### Option A — Docker Compose (backend + database)

```bash
cp .env.example .env   # fill in a real JWT_SECRET
docker compose up
```

This starts PostgreSQL and the Spring Boot API on `http://localhost:8080`, running Flyway
migrations automatically on startup.

### Option B — run the backend natively

```bash
cd backend
./gradlew bootRun
```

Requires a local PostgreSQL instance matching the connection details in
`backend/src/main/resources/application.yml` (or override via `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD` env vars).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and talks to the backend at `http://localhost:8080` by
default (override with `VITE_API_BASE_URL`, see `frontend/.env.example`).

## Testing

```bash
cd backend && ./gradlew test
cd frontend && npm test
```

## Project layout

```
NextRole/
  backend/    Kotlin/Spring Boot API
  frontend/   React/TypeScript app (Vite)
  docker-compose.yml
```
