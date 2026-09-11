# EchoFreelance

Tech school platform for cybersecurity, software engineering, cloud, and more.

Roles:

- **Student** — enroll, unlock lessons, register for live classes
- **Tutor** — create/publish courses, add lessons, schedule virtual classes
- **Admin** — campus stats, promote users to Tutor/Admin

## Quick start (local)

```bash
cp .env.example .env
npm install
./scripts/dev-db.sh
npm run prisma:migrate --workspace=echofreelance-api
npm run prisma:seed --workspace=echofreelance-api
npm run dev:api   # :4000
npm run dev:web   # :3000
```

## Demo accounts (password `password123` — change in Settings)

| Role    | Email                         |
|---------|-------------------------------|
| Admin   | admin@echofreelance.dev       |
| Tutor   | tutor@echofreelance.dev       |
| Student | student@echofreelance.dev     |

Catalog starts empty: tutors create courses & live sessions. Live rooms open in-browser (Jitsi).

## Surfaces

| Path | Who |
|------|-----|
| `/` `/courses` `/classes` | Public catalog + live schedule |
| `/student` | Student hub |
| `/tutor` `/tutor/courses/*` `/tutor/classes/new` | Tutor desk |
| `/classes/:id/room` | Live classroom |
| `/settings` | Profile + password (all roles) |
| `/admin` | Stats, roles, password resets |
