# Tutor studio and course catalogue

Stack: existing Next.js Pages Router, React, TypeScript, Tailwind and CSS; NestJS/Prisma/PostgreSQL API. No new packages.

## Design decisions

- Compact headers, plain tabs and neutral graphite/off-white surfaces replace hero panels and promotional banners on working pages.
- A single copper accent identifies actions, links, active states and focus. Generated category covers use muted flat fields and a shared geometric pattern.
- Tutor course management defaults to a table; mobile uses stacked rows. Real counts, dates and ratings replace invented insights. Total enrollments are labelled accurately; they are not unique students.
- Draft courses show the next relevant action; publishing requires a lesson. Imported prospectus placeholders must be reviewed first. Archive persists on the server, can be undone, and keeps existing students' course access.
- Catalogue queries are shareable, zero-lesson courses are excluded, and loading/errors/empty results have explicit states.

## Complete implementation files

### Tutor page and components

- `apps/web/pages/tutor/index.tsx`
- `apps/web/components/tutor/CourseStudio.tsx` — toolbar, table/grid, pagination, inline rename, bulk actions, confirmations, shortcuts.
- `apps/web/components/tutor/QuickCreate.tsx` — create draft and continue to lessons.
- `apps/web/components/tutor/StudioDialog.tsx` — native modal dialog/drawer, focus containment, Escape and focus restoration.
- `apps/web/components/tutor/TutorLiveClasses.tsx` — existing instant meetings, session links and roster access.
- `apps/web/pages/tutor/courses/[id].tsx` — stable details/lessons/students anchors.
- `apps/web/pages/tutor/courses/new.tsx` — existing full-page creation route, now draft-first.

### Catalogue

- `apps/web/pages/courses/index.tsx`
- `apps/web/components/CourseCard.tsx`
- `apps/web/components/catalogue/CategoryTabs.tsx`
- `apps/web/components/catalogue/FilterBar.tsx`
- `apps/web/components/catalogue/Dropdown.tsx`
- `apps/web/components/catalogue/CatalogueSkeletons.tsx`
- `apps/web/components/CommandPalette.tsx`
- `apps/web/components/AskTutor.tsx` — neutral icon, existing help panel retained.
- `apps/web/styles/workspaces.css` — complete workspace tokens and styles, imported by `pages/_app.tsx`.
- `apps/web/lib/api.ts` — archive, duplicate, catalogue and duration data.

### Backend

- `apps/api/src/modules/courses/courses.controller.ts`
- `apps/api/src/modules/courses/courses.service.ts`
- `apps/api/src/modules/courses/dto/create-course.dto.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261114090000_course_archive/migration.sql`
- `apps/api/tests/course-studio.cjs`

## Behaviour and limits

Archive and duplication require the updated API. Deploy the backend before publishing the frontend. The additive archive migration was applied to the configured Neon database; it does not remove or overwrite existing courses. A previously applied session-revocation migration is absent from this checkout; preserve that database history and recover the historical source separately, never reset it.

Catalogue pagination is performed on the server with a maximum of 24 returned courses per request. Filtering currently aggregates the public catalogue in memory; a substantially larger catalogue should move duration/rating aggregates and pagination into database queries. Categories normalize capitalization/spacing and `animaion` for display and filtering; stored original values remain unchanged.

Bookmarks are saved on the current browser/device, not synced to user accounts. There is no invented revenue or enrollment trend. Students links lead to existing per-course reports; payment reporting is explicitly unavailable. The preview action opens the real course page using the current account, not an impersonated student session. Reordering and optional insights are omitted because the data model has no order or historical insights. Native modal dialogs are supported in modern browsers.

Completeness uses four actionable checks (details, lessons, reviewed prospectus pricing, publication). Category covers are generated automatically and do not require a separate upload step. Publishing is validated on the backend as well as the studio UI.

All source files above contain complete working implementations. No additional packages are required.
