# Architecture

## Overview

This is the backend for a Learning Management System (LMS) built with Express 5, TypeScript 6, Prisma 7.8, and PostgreSQL 15. It follows a modular layered architecture where each domain (users, authentication) is self-contained with its own route → controller → service → repository stack.

---

## Design Decisions

### 1. Layered Architecture (Route → Controller → Service → Repository)

Each module is split into four distinct layers:

- **Route** — Defines HTTP endpoints, wires up middleware (validation, auth, role checks), and delegates to controllers.
- **Controller** — Handles request/response. Extracts data from `req`, calls services, and formats the HTTP response. No business logic lives here.
- **Service** — Contains all business logic, orchestrates repository calls, handles transactions.
- **Repository** — Pure data-access layer. Talks only to Prisma. Accepts optional `tx` (transaction client) for atomic operations.

**Why:** Clean separation of concerns. Each layer is independently testable. Swapping the ORM only requires changes at the repository level.

### 2. Modular Domain Structure

```
src/modules/
├── authentication/
│   ├── auth/              (login, logout, forgot/reset password)
│   ├── refreshToken/      (token rotation logic)
│   └── passwordToken/     (password reset token storage)
├── users/
├── courses/
├── classes/
├── assignments/
├── submissions/
├── enrollments/
├── resources/
├── announcements/
└── notifications/
```

**Why:** Each module is a self-contained domain. As the app grows, modules don't bleed into each other. A developer working on `assignments` doesn't need to understand `authentication` internals.

### 3. JWT Access + Refresh Token Pattern (Stateless Access, Stateful Refresh)

- **Access Token** — Short-lived (configurable, default 15m). Contains `sub` (userId), `email`, `role`. Stateless — not stored in DB.
- **Refresh Token** — Long-lived (30 days in DB). Contains `sub` (userId) and `jti` (unique token ID). Stored in `RefreshToken` table with expiry and revocation timestamps.

**Why:**
- Access tokens are cheap to verify (no DB hit) — good for high-frequency API calls.
- Refresh tokens are stored in DB — enables instant revocation on logout, password change, or security events.
- `jti` (JWT ID) links the signed JWT to its database record, enabling per-token revocation.

### 4. Refresh Token Rotation

On every `/refresh` call:
1. Verify the incoming refresh token signature.
2. Look up the `jti` in the database → confirm it's not revoked and user is active.
3. **Revoke the old token** and **create a new one** inside a single Prisma transaction.
4. Return a fresh access token + refresh token pair.

**Why:** If a refresh token is stolen, it can only be used once. The legitimate user's next refresh attempt will fail (token already revoked), signaling a compromise.

### 5. Password Never Leaves the Backend

- Passwords are hashed with bcrypt (cost factor 10) before storage.
- Every service method that returns a user object destructures and strips the `password` field.
- The raw password only exists in memory during `bcrypt.compare()` and `bcrypt.hash()`.

### 6. Forgot Password — Hash-Based Token Storage

- A 32-byte cryptographically random token is generated (`crypto.randomBytes`).
- Only the **SHA-256 hash** of that token is stored in the database.
- The raw token is sent to the user (via email in production, in response body for dev).
- On reset, the incoming token is re-hashed and compared against the DB record.

**Why:** If the database is compromised, the attacker cannot reconstruct valid reset tokens from the stored hashes. Same principle as password hashing but lighter (SHA-256 is sufficient because the input has high entropy).

### 7. Password Change Revokes All Sessions

When a user changes their password (or resets it via forgot-password):
1. Update the password hash in a transaction.
2. Revoke **all** active refresh tokens for that user in the same transaction.

**Why:** After a password change, no previously issued refresh token should be usable. This forces re-authentication on all devices.

### 8. Zod Validation at the Edge

Every route that accepts a body runs it through `validateRequest(schema)` middleware **before** reaching the controller:
- Validates structure and types.
- Replaces `req.body` with the parsed/sanitized output (strips extra fields).
- Returns structured error messages on failure.

**Why:** Controllers and services can trust that `req.body` is already type-safe. No defensive `if (!email)` checks needed deeper in the stack.

### 9. Role-Based Access Control (RBAC)

Three roles: `STUDENT`, `FACULTY`, `ADMIN`. Access is enforced by chaining middlewares:

```typescript
router.get("/id/:userId", authMiddleware, authorizeRoles(roles.FACULTY, roles.ADMIN), controller.getUserById);
```

**Why:** Declarative and composable. Adding a new protected route is one line. The role middleware reads `req.user.role` (injected by auth middleware) and gates access.

### 10. Centralized Error Handling

All async route handlers are wrapped in `asyncHandler` which catches thrown errors and passes them to the Express error handler. The error handler differentiates:
- `ApiError` → structured JSON response with status code and error array.
- JWT errors (`JsonWebTokenError`, `TokenExpiredError`) → 401 with a clean message.
- Unhandled errors → generic 500.

**Why:** No `try/catch` blocks scattered across controllers. Throw `ApiError` from anywhere in the service layer and it propagates cleanly.

### 11. Prisma with PrismaPg Adapter

Using `@prisma/adapter-pg` instead of Prisma's built-in connection handling.

**Why:** Direct control over the PostgreSQL connection via the `pg` driver. Better for production scenarios (connection pooling, custom SSL, etc.).

### 12. Docker-Compose Dev Environment

- PostgreSQL 15 (Alpine) with persistent volume.
- Node app runs `prisma migrate deploy` on startup before `tsx watch`.
- Host source code is volume-mounted for hot reload; `node_modules` is isolated.

**Why:** One `docker-compose up` gives a fully working environment. No local Postgres install needed. Volume mount for node_modules prevents OS-specific binary conflicts.

---

## Authentication Flow

### Login (`POST /api/v1/auth/login`)

```
Client                      Server
  │                            │
  │─── email + password ──────→│
  │                            ├─ Find user by email
  │                            ├─ bcrypt.compare(password, hash)
  │                            ├─ Generate access token (sub, email, role)
  │                            ├─ Generate refresh token (sub, jti)
  │                            ├─ Store refresh token in DB (jti, userId, expiresAt: 30d)
  │                            │
  │←── accessToken + refreshToken + user (no password) ─────│
```

### Token Refresh (`POST /api/v1/auth/refresh`)

```
Client                      Server
  │                            │
  │─── refreshToken ──────────→│
  │                            ├─ jwt.verify(refreshToken, REFRESH_SECRET)
  │                            ├─ Find token by jti in DB
  │                            ├─ Check: not revoked, user exists, user isActive
  │                            ├─ TRANSACTION:
  │                            │    ├─ Revoke old refresh token (set revokedAt)
  │                            │    └─ Create new refresh token (new jti, 30d expiry)
  │                            ├─ Sign new access token
  │                            ├─ Sign new refresh token
  │                            │
  │←── new accessToken + new refreshToken ─────────────────│
```

### Logout (`POST /api/v1/auth/logout`) — Requires Auth

```
Client                      Server
  │                            │
  │─── Authorization: Bearer <access> + body: { refreshToken } ──→│
  │                            ├─ Auth middleware verifies access token
  │                            ├─ jwt.verify(refreshToken, REFRESH_SECRET)
  │                            ├─ Find token by jti → if not found/already revoked, return OK
  │                            ├─ Revoke refresh token in DB
  │                            │
  │←── 200 OK ─────────────────────────────────────────────────────│
```

### Forgot Password (`POST /api/v1/auth/forgot-password`)

```
Client                      Server
  │                            │
  │─── email ─────────────────→│
  │                            ├─ Find user by email (if not found → return success anyway*)
  │                            ├─ Generate 32-byte random token
  │                            ├─ SHA-256 hash the token
  │                            ├─ Store hash in DB (userId, expiresAt: 15min)
  │                            ├─ Build reset link with raw token
  │                            │
  │←── resetLink + token (dev only) ───────────────────────────────│

* Silent failure prevents email enumeration attacks.
```

### Reset Password (`POST /api/v1/auth/reset-password`)

```
Client                      Server
  │                            │
  │─── token + newPassword ───→│
  │                            ├─ SHA-256 hash the incoming token
  │                            ├─ Find by hash in DB
  │                            ├─ Validate: not expired, not used
  │                            ├─ TRANSACTION:
  │                            │    ├─ bcrypt hash new password
  │                            │    ├─ Update user password
  │                            │    ├─ Revoke ALL user's refresh tokens
  │                            │    └─ Mark token as used (set usedAt)
  │                            │
  │←── 200 OK ─────────────────────────────────────────────────────│
```

---

## Users Flow

### Register (`POST /api/v1/users/create`)

```
Client                      Server
  │                            │
  │─── { email, password, name, role?, branch?, sem?, avatarUrl? } ──→│
  │                            ├─ Zod validates + sanitizes body
  │                            ├─ Check duplicate email → 409 if exists
  │                            ├─ bcrypt.hash(password, 10)
  │                            ├─ Create user in DB
  │                            │
  │←── 201 + user (no password) ──────────────────────────────────────│
```

### Get Current User (`GET /api/v1/users/me`) — Any Authenticated Role

```
Client                      Server
  │                            │
  │─── Authorization: Bearer <token> ──→│
  │                            ├─ Auth middleware verifies token, injects req.user
  │                            ├─ Fetch user by req.user.sub
  │                            │
  │←── 200 + user profile (no password) ──│
```

### Get User by ID/Email (`GET /api/v1/users/id/:userId` | `/email/:email`) — FACULTY/ADMIN Only

Same as above but restricted to elevated roles via `authorizeRoles` middleware.

### Change Password (`POST /api/v1/users/change-password`) — Any Authenticated Role

```
Client                      Server
  │                            │
  │─── { oldPassword, newPassword } + Bearer token ──→│
  │                            ├─ Verify old password with bcrypt.compare
  │                            ├─ bcrypt.hash(newPassword, 10)
  │                            ├─ TRANSACTION:
  │                            │    ├─ Update password in DB
  │                            │    └─ Revoke ALL refresh tokens for user
  │                            │
  │←── 200 "Password changed. Please login again." ───│
```

---

## Database Schema (ERD)

```
┌──────────────────────────┐
│         User             │
├──────────────────────────┤
│ userId (PK, UUID)        │
│ email (UNIQUE)           │
│ password                 │
│ name                     │
│ branch?                  │
│ sem? (1-8)               │
│ avatarUrl?               │
│ role (STUDENT/FACULTY/   │
│       ADMIN)             │
│ isActive                 │
│ createdAt                │
│ updatedAt                │
└──────────┬───────────────┘
           │ 1:N
           │
┌──────────▼───────────────┐     ┌────────────────────────────┐
│     RefreshToken         │     │   PasswordResetToken       │
├──────────────────────────┤     ├────────────────────────────┤
│ tokenId (PK, UUID = jti) │     │ resetTokenId (PK, UUID)    │
│ userId (FK → User)       │     │ userId (FK → User)         │
│ expiresAt                │     │ token (UNIQUE, SHA-256 hash)│
│ revokedAt?               │     │ expiresAt                  │
│ createdAt                │     │ usedAt?                    │
└──────────────────────────┘     │ createdAt                  │
                                 └────────────────────────────┘
        CASCADE DELETE                   CASCADE DELETE
```

---

## Middleware Pipeline

Every protected request flows through:

```
Request → express.json() → validateRequest(schema) → authMiddleware → authorizeRoles(...) → Controller
                                                                                              │
                                                                                              ▼
Response ←────────────────────── errorHandler ←──────────────────────────────── throw ApiError
```

---

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Runtime     | Node.js 20 (Alpine)     |
| Framework   | Express 5              |
| Language    | TypeScript 6 (strict)   |
| ORM         | Prisma 7.8 + PrismaPg   |
| Database    | PostgreSQL 15           |
| Validation  | Zod 4                  |
| Auth        | jsonwebtoken + bcrypt   |
| Dev Server  | tsx watch (hot reload)  |
| Container   | Docker + Docker Compose |
