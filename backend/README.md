# LMS Backend

A modular REST API for a Learning Management System, built with Express 5, TypeScript, Prisma, and PostgreSQL.

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run

```bash
cd backend
docker-compose up --build
```

The app will be available at `http://localhost:8000`. PostgreSQL runs on port `5432`. Redis runs on port `6379`.

Migrations run automatically on container startup (`prisma migrate deploy`).

### Without Docker

Requires Node.js 20+ and a running PostgreSQL instance. Redis is optional (falls back to DB queries if unavailable).

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Set environment variables in `.env` (see below).

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT` | Server port | `3000` |
| `ACCESS_TOKEN_SECRET` | JWT signing secret for access tokens | — |
| `ACCESS_TOKEN_EXPIRY` | Access token TTL | `15m` |
| `REFRESH_TOKEN_SECRET` | JWT signing secret for refresh tokens | — |
| `REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `30d` |
| `DB_USER` | PostgreSQL user (Docker) | — |
| `DB_PASSWORD` | PostgreSQL password (Docker) | — |
| `DB_NAME` | PostgreSQL database name (Docker) | — |

---

## API Endpoints

Base URL: `/api/v1`

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | No | Login with email + password |
| POST | `/refresh` | No | Get new token pair using refresh token |
| POST | `/logout` | Yes | Revoke refresh token |
| POST | `/forgot-password` | No | Request password reset link |
| POST | `/reset-password` | No | Reset password with token |

### Users (`/api/v1/users`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/create` | No | — | Register a new user |
| GET | `/me` | Yes | ALL | Get current user profile |
| GET | `/id/:userId` | Yes | FACULTY, ADMIN | Get user by ID |
| GET | `/email/:email` | Yes | FACULTY, ADMIN | Get user by email |
| POST | `/change-password` | Yes | ALL | Change password (revokes all sessions) |

### Courses (`/api/v1/courses`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | Yes | FACULTY, ADMIN | Get all courses |
| GET | `/:courseId` | Yes | FACULTY, ADMIN | Get course by ID |
| GET | `/code/:courseCode` | Yes | FACULTY, ADMIN | Get course by code |
| POST | `/` | Yes | ADMIN | Create a new course |
| PATCH | `/:courseId` | Yes | ADMIN | Partial update a course |
| POST | `/:courseId/archive` | Yes | ADMIN | Archive a course |
| POST | `/:courseId/unarchive` | Yes | ADMIN | Unarchive a course |

### Classes (`/api/v1/classes`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | Yes | ALL | Get all classes |
| GET | `/:classId` | Yes | ALL | Get class by ID |
| GET | `/faculty/:facultyId` | Yes | FACULTY, ADMIN | Get classes by faculty |
| POST | `/` | Yes | FACULTY, ADMIN | Create a new class |
| PATCH | `/:classId` | Yes | FACULTY, ADMIN | Partial update a class |
| POST | `/:classId/archive` | Yes | FACULTY, ADMIN | Archive a class |
| POST | `/:classId/unarchive` | Yes | FACULTY, ADMIN | Unarchive a class |

### Enrollments (`/api/v1/enrollments`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/:enrollmentId` | Yes | FACULTY, ADMIN | Get enrollment by ID |
| POST | `/` | Yes | FACULTY, ADMIN | Enroll a student in a class |
| DELETE | `/:enrollmentId` | Yes | FACULTY, ADMIN | Remove an enrollment |
| GET | `/students/:studentId/classes` | Yes | ALL | Get all classes for a student |
| GET | `/classes/:classId/students` | Yes | ALL | Get all students in a class |

### Assignments (`/api/v1/assignments`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | Yes | ADMIN | Get all assignments |
| GET | `/:assignmentId` | Yes | FACULTY, ADMIN | Get assignment by ID |
| GET | `/classes/:classId` | Yes | ALL | Get assignments by class |
| POST | `/` | Yes | FACULTY, ADMIN | Create assignment (multipart) |
| PATCH | `/:assignmentId` | Yes | FACULTY, ADMIN | Update assignment (multipart) |
| DELETE | `/:assignmentId` | Yes | FACULTY, ADMIN | Delete assignment + cloud file |

### Resources (`/api/v1/resources`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | Yes | ADMIN | Get all resources |
| GET | `/:resourceId` | Yes | FACULTY, ADMIN | Get resource by ID |
| GET | `/classes/:classId` | Yes | ALL | Get resources by class |
| POST | `/` | Yes | FACULTY, ADMIN | Create resource (multipart) |
| PATCH | `/:resourceId` | Yes | FACULTY, ADMIN | Update resource (multipart) |
| DELETE | `/:resourceId` | Yes | FACULTY, ADMIN | Delete resource + cloud file |

### Submissions (`/api/v1/submissions`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/assignments/:assignmentId` | Yes | FACULTY, ADMIN | All submissions for an assignment |
| GET | `/:submissionId` | Yes | FACULTY, ADMIN | Get submission by ID |
| GET | `/assignments/:assignmentId/my-submissions` | Yes | STUDENT | Get own submission for assignment |
| POST | `/` | Yes | STUDENT | Submit work (multipart) |
| PATCH | `/:submissionId` | Yes | STUDENT | Update submission (multipart) |
| DELETE | `/:submissionId` | Yes | STUDENT | Delete submission |

### Announcements (`/api/v1/announcements`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/class/:classId` | Yes | ALL | Get announcements for a class |
| GET | `/:announcementId` | Yes | ALL | Get announcement by ID |
| POST | `/` | Yes | FACULTY, ADMIN | Create announcement |
| PATCH | `/:announcementId` | Yes | FACULTY, ADMIN | Update announcement |
| DELETE | `/:announcementId` | Yes | FACULTY, ADMIN | Delete announcement |

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app setup + route mounting
│   ├── server.ts                 # HTTP server bootstrap
│   ├── config/
│   │   ├── config.ts             # Environment variable loader
│   │   └── redis.config.ts       # Redis client (ioredis) setup
│   ├── db/
│   │   └── prisma.ts             # Prisma client with PrismaPg adapter
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT verification + user injection
│   │   ├── role.middleware.ts    # Role-based access control
│   │   ├── validation.middleware.ts  # Zod schema validation
│   │   └── error.middleware.ts   # Centralized error handler
│   ├── shared/
│   │   ├── errors/api_error.ts   # Custom ApiError class
│   │   ├── utils/
│   │   │   ├── asyncHandler.ts   # Async error wrapper
│   │   │   └── redis.utils.ts    # Cache manager (getOrSet, invalidate, key generators)
│   │   └── constants/enums.ts    # Role enum
│   └── modules/
│       ├── authentication/
│       │   ├── auth/             # Login, logout, forgot/reset password
│       │   ├── refreshToken/     # Token rotation service + repository
│       │   └── passwordToken/    # Password reset token repository
│       ├── users/                # Registration, profile, password change
│       ├── courses/              # Course CRUD, archive/unarchive
│       ├── classes/              # Class CRUD, archive/unarchive, faculty assignment
│       ├── enrollments/          # Enroll/unenroll students, bidirectional lookups
│       ├── assignments/          # Assignment CRUD with file upload (Supabase)
│       ├── resources/            # Class resources/materials with file upload
│       ├── submissions/          # Student submissions with ownership + deadline enforcement
│       └── announcements/        # Faculty/admin announcements per class
├── prisma/
│   └── schema.prisma             # Database schema (User, RefreshToken, PasswordResetToken)
├── docker-compose.yml
├── dockerfile
├── tsconfig.json
└── package.json
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `tsx watch --no-cache src/server.ts` | Start dev server with hot reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/server.js` | Run compiled production build |
| `seed` | `tsx prisma/seed.ts` | Seed database with demo data |
| `db:reset` | `tsx prisma/reset.ts` | Clear all data and reseed |
| `db:fresh` | `prisma migrate reset --force && npm run seed` | Reset migrations + seed |

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions, authentication flow diagrams, and database schema.
