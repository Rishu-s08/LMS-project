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

The app will be available at `http://localhost:8000`. PostgreSQL runs on port `5432`.

Migrations run automatically on container startup (`prisma migrate deploy`).

### Without Docker

Requires Node.js 20+ and a running PostgreSQL instance.

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

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app setup + route mounting
│   ├── server.ts                 # HTTP server bootstrap
│   ├── config/
│   │   └── config.ts             # Environment variable loader
│   ├── db/
│   │   └── prisma.ts             # Prisma client with PrismaPg adapter
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT verification + user injection
│   │   ├── role.middleware.ts    # Role-based access control
│   │   ├── validation.middleware.ts  # Zod schema validation
│   │   └── error.middleware.ts   # Centralized error handler
│   ├── shared/
│   │   ├── errors/api_error.ts   # Custom ApiError class
│   │   ├── utils/asyncHandler.ts # Async error wrapper
│   │   └── constants/enums.ts    # Role enum
│   └── modules/
│       ├── authentication/
│       │   ├── auth/             # Login, logout, forgot/reset password
│       │   ├── refreshToken/     # Token rotation service + repository
│       │   └── passwordToken/    # Password reset token repository
│       ├── users/                # Registration, profile, password change
│       └── courses/              # Course CRUD, archive/unarchive
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

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions, authentication flow diagrams, and database schema.
