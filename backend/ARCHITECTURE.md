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

Route parameters (`:courseId`, `:courseCode`) are also validated via `validateParams(schema)` — same pattern applied to `req.params`.

**Why:** Controllers and services can trust that `req.body` and `req.params` are already type-safe. No defensive `if (!email)` checks needed deeper in the stack.

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

### 12. Docker-Compose Multi-Service Architecture

A single `docker-compose.yml` at the project root orchestrates all infrastructure and application services:

```
┌─────────────────────────────────────────────────────────────────┐
│                    docker-compose.yml (root)                     │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure:                                                 │
│    • PostgreSQL 15 (Alpine) — shared DB, persistent volume       │
│    • Redis 7 (Alpine) — caching, 256MB LRU eviction             │
│    • RabbitMQ 4 — message broker for async notifications         │
│                                                                  │
│  Application Services:                                           │
│    • Backend (Express) — runs migrations + serves API            │
│    • Notification Server — consumes RabbitMQ, sends FCM/email    │
└─────────────────────────────────────────────────────────────────┘
```

- All infra services have **healthchecks**. App services use `depends_on: condition: service_healthy` to wait for readiness.
- Single `.env` at root — docker-compose interpolates `${VAR}` from it.
- Each app service has its own Dockerfile, own `prisma/schema.prisma`, and is independently buildable.
- Backend owns migrations (`prisma migrate deploy`). Notification server only generates types (`prisma generate`).
- Source code is volume-mounted for hot reload in dev; `node_modules` is isolated via anonymous volume.

**Why:** One `docker compose up` gives a fully working multi-service environment. Services are independently deployable. Healthchecks prevent startup race conditions. Shared `.env` eliminates config drift.

### 13. File Uploads — Multer + Supabase Storage

File handling follows a consistent pattern across assignments, resources, and submissions:

1. **Multer (memoryStorage)** parses the multipart request → file lives in `file.buffer`.
2. **Supabase Storage** receives the buffer with a unique filename and returns a public URL.
3. The public URL is stored in the DB record (`attachmentUrl` column).
4. On update with new file: upload new → delete old from cloud.
5. On delete: remove cloud file if exists.

Each domain uses its own Supabase bucket (`assignments`, `resources`, `submissions`) via `SupabaseConstants`.

**Why:** Decouples file storage from the app server. Files are served directly from Supabase CDN. No Express static file serving, no disk management. The shared `uploadToCloud`/`deleteFromCloud` utilities prevent code duplication across modules.

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

## Courses Flow

### Create Course (`POST /api/v1/courses`) — ADMIN Only

```
Client                      Server
  │                            │
  │─── { name, code, description?, credits } + Bearer token ──→│
  │                            ├─ Zod validates body
  │                            ├─ Auth middleware + ADMIN role check
  │                            ├─ Create course in DB
  │                            │
  │←── 201 + course ──────────────────────────────────────────────│
```

### Get All Courses (`GET /api/v1/courses`) — FACULTY/ADMIN

Returns all courses (no pagination currently).

### Get Course by ID/Code — FACULTY/ADMIN

- `GET /api/v1/courses/:courseId` — Validates UUID param via `validateParams`.
- `GET /api/v1/courses/code/:courseCode` — Validates code string param.

### Archive / Unarchive (`POST /api/v1/courses/:courseId/archive|unarchive`) — ADMIN Only

Soft-archive: sets `isArchived` flag to `true`/`false`. Course record is never deleted.

### Update Course (`PATCH /api/v1/courses/:courseId`) — ADMIN Only

Partial update using `createCourseSchema.partial()` with a refinement ensuring at least one field is provided.

### Design Decisions — Courses

| Decision | Reasoning |
|----------|-----------|
| Soft-archive instead of delete | Courses have cascading relationships (classes, enrollments). Archiving preserves history while hiding from active views. |
| `code` field is unique | Course codes (e.g., "CS101") are the natural human-readable identifier. Unique constraint prevents duplicates. |
| `validateParams` middleware | Route params (`:courseId`, `:courseCode`) are validated with Zod before reaching the controller — same pattern as body validation but for `req.params`. |
| Partial update with `.partial().refine()` | Allows updating any subset of fields while rejecting empty patch requests at the validation layer. |
| All routes require authentication | No public course browsing — all access requires at minimum FACULTY role. Only ADMIN can create/modify/archive. |

---

## Classes Flow

A **class** ties a course to a specific faculty member for a given semester, year, branch, and academic year. It's the actual "section" students enroll in.

### Create Class (`POST /api/v1/classes`) — FACULTY/ADMIN

```
Client                      Server
  │                            │
  │─── { facultyId, semester, year, branch, academicYear, courseId } ──→│
  │                            ├─ Zod validates body
  │                            ├─ Auth + role check (FACULTY/ADMIN)
  │                            ├─ Verify faculty exists and is not a STUDENT
  │                            ├─ Verify course exists
  │                            ├─ Create class in DB
  │                            │
  │←── 201 + class ───────────────────────────────────────────────────────│
```

### Get All Classes (`GET /api/v1/classes`) — ALL Authenticated Roles

Returns all classes (students can browse available classes).

### Get Classes by Faculty (`GET /api/v1/classes/faculty/:facultyId`) — FACULTY/ADMIN

Returns all classes assigned to a specific faculty member. Validates that the user is actually a faculty member.

### Get Class by ID (`GET /api/v1/classes/:classId`) — ALL Authenticated Roles

### Archive / Unarchive (`POST /api/v1/classes/:classId/archive|unarchive`) — FACULTY/ADMIN

Same soft-archive pattern as courses.

### Update Class (`PATCH /api/v1/classes/:classId`) — FACULTY/ADMIN

Partial update. If `facultyId` or `courseId` is being changed, validates the new references exist.

### Design Decisions — Classes

| Decision | Reasoning |
|----------|-----------|
| Faculty validated on create/update | Prevents assigning a STUDENT as the instructor. Service checks role before DB write. |
| Course validated on create/update | Ensures referential integrity at the application level, not just DB constraints — gives clean error messages. |
| Students can view classes | Students need to browse available classes to enroll. Read access is open to all authenticated roles. |
| Academic year as regex-validated string | Format `YYYY-YYYY` is enforced at validation layer. Keeps it human-readable without complex date logic. |
| Soft-archive, not delete | Classes have enrollments. Deleting would cascade-remove student records. Archive hides them instead. |

---

## Enrollments Flow

An **enrollment** maps a student to a class. The `@@unique([classId, studentId])` constraint in Prisma prevents duplicate enrollments at the database level.

### Create Enrollment (`POST /api/v1/enrollments`) — FACULTY/ADMIN

```
Client                      Server
  │                            │
  │─── { studentId, classId } + Bearer token ──→│
  │                            ├─ Zod validates body
  │                            ├─ Auth + role check (FACULTY/ADMIN only)
  │                            ├─ Create enrollment (DB unique constraint prevents duplicates)
  │                            │
  │←── 201 + enrollment ───────────────────────────│
```

### Get Enrollment by ID (`GET /api/v1/enrollments/:enrollmentId`) — FACULTY/ADMIN

Returns the enrollment with included student and class data.

### Delete Enrollment (`DELETE /api/v1/enrollments/:enrollmentId`) — FACULTY/ADMIN

Hard delete — enrollment is a pure mapping record, no history value in keeping it.

### Get All Classes by Student (`GET /api/v1/enrollments/students/:studentId/classes`) — ALL Roles

Validates the user is a STUDENT, then returns all classes they're enrolled in (includes class data).

### Get All Students by Class (`GET /api/v1/enrollments/classes/:classId/students`) — ALL Roles

Validates the class exists, then returns all enrolled students (includes student data).

### Design Decisions — Enrollments

| Decision | Reasoning |
|----------|-----------|
| Hard delete instead of soft-delete | Enrollments are pure join records. No audit trail needed — if a student drops, the record is removed. |
| No update route | An enrollment is just a (student, class) pair. Changing either field = delete + create. No partial update makes sense. |
| Unique constraint at DB level | `@@unique([classId, studentId])` — the database is the final guard against duplicates, not just application code. |
| FACULTY/ADMIN can enroll students | Students don't self-enroll (faculty manages class rosters). This matches real university workflows. |
| Include relations on read | `getEnrollmentById` includes student + class, `getStudentsByClassId` includes student — reduces follow-up queries. |
| Bidirectional lookup | Both "classes for a student" and "students for a class" are first-class queries. These are the two most common access patterns. |

---

## Assignments Flow

An **assignment** is posted by faculty to a class with a title, optional description, due date, and optional file attachment (uploaded to Supabase Storage).

### Create Assignment (`POST /api/v1/assignments`) — FACULTY/ADMIN

```
Client                      Server
  │                            │
  │─── multipart/form-data: { title, description?, dueDate, classId, │
  │     isPublished?, attachment? } + Bearer token ──────────────────→│
  │                            ├─ Auth + role check (FACULTY/ADMIN)
  │                            ├─ Multer parses file (memoryStorage → buffer)
  │                            ├─ Zod validates body
  │                            ├─ Verify class exists
  │                            ├─ Validate dueDate is in the future
  │                            ├─ If file: upload to Supabase → get public URL
  │                            ├─ Create assignment in DB (with attachmentUrl)
  │                            │
  │←── 201 + assignment ───────────────────────────────────────────────│
```

### Get Assignments by Class (`GET /api/v1/assignments/classes/:classId`) — ALL Roles

### Update Assignment (`PATCH /api/v1/assignments/:assignmentId`) — FACULTY/ADMIN

- Cannot update if due date has passed.
- If a new file is uploaded: upload new → delete old from cloud.
- Partial update (same `.partial().refine()` pattern).

### Delete Assignment (`DELETE /api/v1/assignments/:assignmentId`) — FACULTY/ADMIN

Deletes assignment record and removes attachment from Supabase if one exists.

### Design Decisions — Assignments

| Decision | Reasoning |
|----------|-----------|
| File upload via Supabase Storage | Decouples file storage from the app server. Supabase provides public URLs — no need to serve files through Express. |
| Multer memoryStorage | Files stay in RAM as buffers for direct upload to Supabase. No temp disk writes. Works for ≤10MB limit. |
| Due date validation | Prevents creating assignments with past deadlines. Also blocks edits after deadline passes. |
| `isPublished` flag | Faculty can create draft assignments (unpublished) before making them visible to students. |
| Old file cleanup on update | When a new attachment replaces the old one, the old file is deleted from cloud to avoid orphaned storage. |

---

## Resources Flow

A **resource** is course material (PDF, image) attached to a class. Similar to assignments but without due dates or submissions.

### Create Resource (`POST /api/v1/resources`) — FACULTY/ADMIN

```
Client                      Server
  │                            │
  │─── multipart/form-data: { title, description?, classId, │
  │     attachment? } + Bearer token ───────────────────────→│
  │                            ├─ Auth + role check (FACULTY/ADMIN)
  │                            ├─ Multer parses file
  │                            ├─ Zod validates body
  │                            ├─ Verify class exists
  │                            ├─ If file: upload to Supabase → get public URL
  │                            ├─ Create resource in DB
  │                            │
  │←── 201 + resource ─────────────────────────────────────────│
```

### Get Resources by Class (`GET /api/v1/resources/classes/:classId`) — ALL Roles

### Update Resource (`PATCH /api/v1/resources/:resourceId`) — FACULTY/ADMIN

If new file uploaded: upload new → delete old from cloud.

### Delete Resource (`DELETE /api/v1/resources/:resourceId`) — FACULTY/ADMIN

Deletes record and removes attachment from Supabase.

### Design Decisions — Resources

| Decision | Reasoning |
|----------|-----------|
| Same upload pattern as assignments | Consistent file handling (Multer → Supabase) across all modules. One shared `uploadToCloud` utility. |
| No due date or submissions | Resources are static materials — no student interaction beyond viewing/downloading. |
| Attachment is optional | A resource can be a text-only announcement-style post (title + description) without a file. |

---

## Submissions Flow

A **submission** is a student's work uploaded against an assignment. Enforces one submission per student per assignment via a unique constraint.

### Create Submission (`POST /api/v1/submissions`) — STUDENT Only

```
Client                      Server
  │                            │
  │─── multipart/form-data: { assignmentId, studentId, note?, │
  │     attachment? } + Bearer token ─────────────────────────→│
  │                            ├─ Auth + role check (STUDENT only)
  │                            ├─ Multer parses file
  │                            ├─ Zod validates body
  │                            ├─ Verify assignment exists
  │                            ├─ Verify studentId matches logged-in user (prevents spoofing)
  │                            ├─ Check due date hasn't passed
  │                            ├─ Verify student is enrolled in the assignment's class
  │                            ├─ If file: upload to Supabase → get public URL
  │                            ├─ Create submission in DB
  │                            │
  │←── 201 + submission ───────────────────────────────────────────│
```

### Get My Submission (`GET /api/v1/submissions/assignments/:assignmentId/my-submissions`) — STUDENT

Uses the composite unique key `(assignmentId, studentId)` for lookup.

### Get All Submissions for Assignment (`GET /api/v1/submissions/assignments/:assignmentId`) — FACULTY/ADMIN

Faculty views all student submissions for grading.

### Update Submission (`PATCH /api/v1/submissions/:submissionId`) — STUDENT Only

- Only the owning student can update.
- Cannot update after due date.
- Cannot change the assignment reference.
- File replacement follows same upload-new → delete-old pattern.

### Delete Submission (`DELETE /api/v1/submissions/:submissionId`) — STUDENT Only

- Only the owning student can delete.
- Cannot delete after due date.
- Removes file from Supabase if present.

### Design Decisions — Submissions

| Decision | Reasoning |
|----------|-----------|
| `@@unique([assignmentId, studentId])` | One submission per student per assignment. Enforced at DB level — prevents race conditions. |
| Ownership check (`userId !== data.studentId`) | Students can only submit for themselves. Prevents one student submitting on behalf of another. |
| Enrollment verification | Student must be enrolled in the class the assignment belongs to. Prevents submissions to random assignments. |
| Due date enforcement on create/update/delete | After deadline: no new submissions, no edits, no deletions. Preserves academic integrity. |
| Only STUDENT role can submit | Faculty/admin cannot submit on behalf of students. Clean separation of roles. |
| File upload to separate bucket | Submissions go to `submissions` bucket. Keeps cloud storage organized per domain. |

---

## Announcements Flow

An **announcement** is a message posted by faculty/admin to a class. Students can only view announcements for classes they're enrolled in.

### Create Announcement (`POST /api/v1/announcements`) — FACULTY/ADMIN

```
Client                      Server
  │                            │
  │─── { title, content, classId } + Bearer token ──→│
  │                            ├─ Auth + role check (FACULTY/ADMIN)
  │                            ├─ Zod validates body
  │                            ├─ Verify class exists
  │                            ├─ Create announcement in DB
  │                            │
  │←── 201 + announcement ─────────────────────────────│
```

### Get Announcements for Class (`GET /api/v1/announcements/class/:classId`) — ALL Roles

- FACULTY/ADMIN: direct access.
- STUDENT: enrollment is verified before returning data.

Results are ordered by `createdAt` descending (newest first).

### Update Announcement (`PATCH /api/v1/announcements/:announcementId`) — FACULTY/ADMIN

Partial update. Cannot change the class an announcement belongs to.

### Delete Announcement (`DELETE /api/v1/announcements/:announcementId`) — FACULTY/ADMIN

Hard delete — announcements are ephemeral by nature.

### Design Decisions — Announcements

| Decision | Reasoning |
|----------|-----------|
| Enrollment check for students | Students should only see announcements for their own classes. Prevents information leakage across classes. |
| Cannot change classId on update | An announcement belongs to a specific class context. Moving it would confuse students who already saw it. |
| Ordered by newest first | Announcements are time-sensitive. Most recent should appear at the top. |
| Hard delete | No archival value — once deleted, it's gone. Unlike courses/classes, announcements don't have cascading dependencies. |
| No file attachment (yet) | Validation schema has the `file` field defined as optional/future. Currently text-only. |

### 14. Redis Caching Layer

A read-through caching layer using Redis (ioredis) sits between the service and repository layers. Every GET endpoint checks Redis first; writes invalidate relevant cache entries.

**Architecture:**

```
Request → Controller → Service → [Redis Cache] → Repository → PostgreSQL
                                     ↑ HIT: return cached JSON
                                     ↓ MISS: query DB → cache result → return
```

**Cache Strategy:**

| Pattern | Description |
|---------|-------------|
| Read-through | `getJson(key)` → if null, fetch from DB, `setJson(key, data, TTL)` |
| Write-invalidate | On create/update/delete, `invalidateByPattern("lms:<module>:*")` clears all keys for that module |
| TTL-based expiry | Default 1 hour (3600s). Redis auto-evicts expired keys. |
| Graceful degradation | `maxRetriesPerRequest: null` + `retryStrategy` — if Redis is down, requests fall through to DB silently |

**Key Naming Convention:**

```
lms:<module>:<identifier>

Examples:
  lms:assignments:all                    # All assignments
  lms:assignments:<assignmentId>         # Single assignment
  lms:assignments:class:<classId>        # Assignments for a class
  lms:classes:all                        # All classes
  lms:classes:<classId>                  # Single class
  lms:classes:faculty:<facultyId>        # Classes by faculty
  lms:courses:all                        # All courses
  lms:courses:<courseId>                 # Single course
  lms:courses:code:<courseCode>          # Course by code
  lms:enrollments:<enrollmentId>         # Single enrollment
  lms:enrollments:class:<classId>        # Students in a class
  lms:enrollments:student:<studentId>    # Classes for a student
  lms:submissions:<submissionId>         # Single submission
  lms:submissions:assignment:<id>        # Submissions for an assignment
  lms:submissions:student:<studentId>    # Submissions by student
  lms:resources:all                      # All resources
  lms:resources:<resourceId>             # Single resource
  lms:resources:class:<classId>          # Resources for a class
```

**Invalidation Flow (write operations):**

```
Client                      Server
  │                            │
  │─── POST/PATCH/DELETE ─────→│
  │                            ├─ Execute DB write
  │                            ├─ SCAN "lms:<module>:*"
  │                            ├─ DEL all matching keys (pipelined)
  │                            │
  │←── Response ───────────────│
```

**Modules cached:** Assignments, Classes, Courses, Enrollments, Resources, Submissions.
**Not cached:** Authentication (security-sensitive), Users (low-volume), Announcements (time-sensitive, low-volume).

**Docker setup:** Redis 7 (Alpine) with 256MB memory limit + `allkeys-lru` eviction policy. Data persisted via named volume.

### 15. Structured Logging with Pino

All logging uses **pino** (JSON in production, pretty-printed in development) with **pino-http** for automatic request/response logging.

**Log Levels:**

| Level | Usage |
|-------|-------|
| `fatal` | App cannot start (missing DB, missing env var) |
| `error` | Unhandled exceptions, external service failures |
| `warn` | API errors (4xx), JWT failures, rate limit hits |
| `info` | Successful writes, connections established, server startup |
| `debug` | Cache hits/misses, request bodies (dev only) |

**What's logged:**
- Server startup (port, environment, connection status)
- Every HTTP request (method, URL, status code, response time) via pino-http middleware
- Write operations (create/update/delete) with relevant IDs
- Auth events (login, logout, password reset)
- External service connections (Redis, RabbitMQ)
- Errors with full context (path, method, error object)

**What's NOT logged:**
- Passwords, tokens, secrets
- Full request/response bodies in production
- Swagger UI requests (filtered out)

**Format:**
```typescript
// Structured context object + message
logger.info({ userId, email }, "User logged in");
logger.error({ err, path: req.path }, "Unhandled server error");
```

**Why:** Structured JSON logs can be shipped to any aggregator (CloudWatch, Datadog, ELK). Pretty-print in dev keeps terminal readable. pino is 5x faster than winston — zero overhead in hot paths.

### 16. Event-Driven Notifications via RabbitMQ

The backend publishes domain events to RabbitMQ. A separate **notification server** consumes these events and handles async work (FCM push, email, in-app notifications).

**Architecture:**

```
Backend (publisher)                    RabbitMQ                    Notification Server (consumer)
       │                                  │                                │
       ├─ createAssignment() ────────────→│ routing: assignment.created ──→│ fetch students → send FCM
       ├─ createResource() ──────────────→│ routing: resource.created ────→│ fetch students → send email
       ├─ createClass() ─────────────────→│ routing: classroom.created ───→│ notify enrolled students
       │                                  │                                │
```

**Exchange:** `notification_exchange` (topic type, durable)
**Routing keys:** `assignment.created`, `resource.created`, `classroom.created`

**Why topic exchange:** One binding pattern (`notification.#` or specific keys) catches all relevant events. Adding new event types doesn't require consumer changes — just publish with a new key and add a handler.

**Why separate server:**
- Backend stays fast (fire-and-forget publish, ~1ms)
- Notification failures don't affect API responses
- Can scale notification server independently
- Messages survive crashes (durable queue, requeue on failure)

**Message flow:**
1. Backend completes DB write
2. Backend publishes event with minimal payload (`{ classId, assignmentId }`)
3. Notification server consumes, fetches full data from shared DB
4. Processes notification (FCM/email) → ACKs on success, NACKs on failure (requeued)

---

## Database Schema (ERD)

```
┌──────────────────────────────┐
│            User              │
├──────────────────────────────┤
│ userId (PK, UUID)            │
│ email (UNIQUE)               │
│ password                     │
│ name                         │
│ branch?                      │
│ batch?                       │
│ sem? (1-8)                   │
│ avatarUrl?                   │
│ role (STUDENT/FACULTY/ADMIN) │
│ isActive                     │
│ createdAt / updatedAt        │
└──┬─────────┬─────────┬──────┘
   │ 1:N     │ 1:N     │ 1:N (as faculty)        1:N (as student)
   │         │         │                              │
   ▼         ▼         ▼                              │
┌────────────────┐ ┌──────────────────┐               │
│ RefreshToken   │ │ PasswordReset    │               │
│                │ │ Token            │               │
├────────────────┤ ├──────────────────┤               │
│ tokenId (PK,  │ │ resetTokenId(PK) │               │
│   UUID = jti) │ │ userId (FK)      │               │
│ userId (FK)   │ │ token (UNIQUE,   │               │
│ expiresAt     │ │   SHA-256 hash)  │               │
│ revokedAt?    │ │ expiresAt        │               │
│ createdAt     │ │ usedAt?          │               │
└────────────────┘ │ createdAt        │               │
  CASCADE DELETE    └──────────────────┘               │
                     CASCADE DELETE                    │
                                                      │
┌─────────────────────────┐                           │
│        Courses          │                           │
├─────────────────────────┤                           │
│ courseId (PK, UUID)     │                           │
│ name                    │                           │
│ code (UNIQUE)           │                           │
│ credits?                │                           │
│ description?            │                           │
│ isArchived              │                           │
│ createdAt / updatedAt   │                           │
└──────────┬──────────────┘                           │
           │ 1:N                                      │
           ▼                                          │
┌──────────────────────────────┐                      │
│          Classes             │                      │
├──────────────────────────────┤                      │
│ classId (PK, UUID)           │                      │
│ courseId (FK → Courses)      │                      │
│ facultyId (FK → User)       │                      │
│ semester, year, branch       │                      │
│ academicYear                 │                      │
│ isArchived                   │                      │
│ createdAt / updatedAt        │                      │
└──┬───────────┬───────────┬───┘                      │
   │ 1:N       │ 1:N       │ 1:N                     │
   ▼           ▼           ▼                          ▼
┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐
│ Assignment │ │ Resource │ │ Announcement │ │      Enrollment          │
├────────────┤ ├──────────┤ ├──────────────┤ ├──────────────────────────┤
│assignmentId│ │resourceId│ │announcementId│ │ enrollmentId (PK)        │
│ title      │ │ title    │ │ title        │ │ classId (FK → Classes)   │
│description?│ │descript? │ │ content      │ │ studentId (FK → User)    │
│ dueDate    │ │attachUrl?│ │ classId (FK) │ │ enrolledAt               │
│ attachUrl? │ │ classId  │ │ created/     │ │ UNIQUE(classId,studentId)│
│ isPublished│ │created/  │ │  updated     │ └──────────────────────────┘
│ classId(FK)│ │ updated  │ └──────────────┘       CASCADE DELETE
│ createdAt  │ └──────────┘
└─────┬──────┘
      │ 1:N
      ▼
┌──────────────────────────────────────┐
│           Submission                 │
├──────────────────────────────────────┤
│ submissionId (PK, UUID)              │
│ assignmentId (FK → Assignment)       │
│ studentId (FK → User)                │
│ submittedAt                          │
│ attachmentUrl?                       │
│ note?                                │
│ UNIQUE(assignmentId, studentId)      │
└──────────────────────────────────────┘
         CASCADE DELETE on both FKs
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
| Caching     | Redis 7 + ioredis       |
| Messaging   | RabbitMQ 4 + amqplib    |
| Logging     | Pino + pino-http        |
| Validation  | Zod 4                  |
| Auth        | jsonwebtoken + bcrypt   |
| File Storage| Supabase Storage        |
| File Upload | Multer (memoryStorage)  |
| Dev Server  | tsx watch (hot reload)  |
| Container   | Docker + Docker Compose |
