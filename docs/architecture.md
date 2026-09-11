**EchoFreelance Architecture**

Overview:

- Frontend: Next.js (TypeScript) in `apps/web` — role hubs for Admin, Tutor, Student.
- Backend: NestJS (TypeScript) in `apps/api` — REST API, JWT auth, role guards.
- Database: PostgreSQL with Prisma ORM (`apps/api/prisma`).
- Shared types in `packages/types`.

Domain models:

- `User` (Student | Tutor | Admin)
- `Course` + `Lesson` (syllabus owned by a tutor)
- `Enrollment` (student ↔ course)
- `VirtualClass` + `ClassAttendance` (scheduled live sessions)

API prefix `/api`:

- Auth: `POST /auth/register`, `POST /auth/login`
- Users (admin): `GET /users`, `GET /users/stats`, `PATCH /users/:id/role`
- Courses: list/detail/enroll; tutors: create/update/delete/lessons/`taught`
- Classes: upcoming schedule, register, tutor create/update

Notes:

- Keep business logic in the API; frontend renders and calls the API.
- Meeting links are stored URLs (integrate Zoom/Daily later without schema rewrite).
- Secrets via env (see `.env.example`).
