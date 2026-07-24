# Learning Management System (LMS)

> 🚧 **Actively under development** — This project is being built from scratch as a full-stack Learning Management System.

## What is this?

A web-based LMS where faculty can create courses, manage classes, post assignments and resources, and students can enroll, submit work, and track their academics. Built with a clean modular architecture, role-based access control, and production-ready auth patterns.

---

## Current Status

### ✅ Completed

| Module | Description |
|--------|-------------|
| **Authentication** | Login, logout, token refresh (rotation), forgot password, reset password |
| **Users** | Registration, profile fetch, change password, role-based user lookup |
| **Courses** | CRUD, archive/unarchive, lookup by ID or code |
| **Classes** | Ties a course to a faculty for a specific semester/year/branch, archive/unarchive |
| **Enrollments** | Enroll/unenroll students in classes, bidirectional lookups, unique constraint |
| **Assignments** | Faculty posts assignments with deadlines, file attachments (Supabase Storage) |
| **Resources** | Course materials (PDFs, images) shared per class with cloud storage |
| **Submissions** | Students submit work against assignments, ownership + deadline enforcement |
| **Infrastructure** | Docker + Docker Compose setup, Prisma migrations, centralized error handling |
| **Middleware** | JWT auth, RBAC (role-based access), Zod body + params validation, Multer file upload |

### 🔨 In Progress

| Module | Description |
|--------|-------------|
| **Announcements** | Faculty/admin announcements to classes or globally |

### 📋 Planned

| Module | Description |
|--------|-------------|
| **Notifications** | In-app notifications for students on new assignments, grades, etc. |
| **Frontend** | React/Next.js frontend (not yet started) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Express 5 · TypeScript 6 · Node.js 20 |
| Database | PostgreSQL 15 · Prisma 7.8 (PrismaPg adapter) |
| Auth | JWT (access + refresh tokens) · bcrypt · crypto |
| File Storage | Supabase Storage · Multer |
| Validation | Zod 4 |
| DevOps | Docker · Docker Compose |
| Frontend | TBD |

---

## Project Structure

```
LMS project/
├── backend/              # REST API (Express + Prisma)
│   ├── src/
│   │   ├── modules/      # Domain modules (auth, users, courses, ...)
│   │   ├── middlewares/   # Auth, RBAC, validation, error handling
│   │   ├── shared/        # Reusable utilities, errors, constants
│   │   ├── config/        # Environment config
│   │   └── db/            # Prisma client setup
│   ├── prisma/            # Schema + migrations
│   ├── ARCHITECTURE.md    # Design decisions & flow diagrams
│   └── README.md          # Backend-specific docs
└── frontend/             # (Not yet started)
```

---

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd "LMS project/backend"

# Run with Docker (recommended)
docker-compose up --build

# App: http://localhost:8000
# DB:  localhost:5432
```

Or run locally (requires Node.js 20+ and PostgreSQL):

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
# App: http://localhost:3000
```

---

## Architecture Highlights

- **Layered modules** — Each domain follows Route → Controller → Service → Repository
- **Stateless access tokens** + **stateful refresh tokens** with rotation and revocation
- **Password reset** uses SHA-256 hashed tokens (raw token never stored)
- **Password change/reset revokes all sessions** across devices
- **Zod validation** sanitizes both `req.body` and `req.params` before any business logic runs
- **Soft-archive pattern** — Courses (and classes) are archived, never deleted

See [`backend/ARCHITECTURE.md`](./backend/ARCHITECTURE.md) for full design decisions and flow diagrams.

---

## Roles

| Role | Capabilities |
|------|-------------|
| **STUDENT** | View own profile, enroll in classes, submit assignments, change password |
| **FACULTY** | All student capabilities + view any user, manage their classes |
| **ADMIN** | Full access — create courses, manage all users, archive/unarchive |
