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

## Accounts and course data

Use real registered accounts and manage course content through the tutor studio.
The seed command creates no accounts or sample content and does not reset data.
Existing school administrators can assign Tutor or Admin roles.

## Surfaces

| Path | Who |
|------|-----|
| `/` `/courses` `/classes` | Public catalog + live schedule |
| `/student` | Student hub |
| `/tutor` `/tutor/courses/*` `/tutor/classes/new` | Tutor desk |
| `/classes/:id/room` | Live classroom |
| `/settings` | Profile + password (all roles) |
| `/admin` | Stats, roles, password resets |
