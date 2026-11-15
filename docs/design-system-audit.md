# Site-wide editorial design audit

Audit before implementation. The homepage alone uses the editorial paper system. All other routes use old navy globals or an independent graphite/copper workspace palette. Both must be migrated; route logic and API behaviour remain unchanged.

## Routes and entry points

- `/_app` — `apps/web/pages/_app.tsx` — layout/document entry point; mixed styles.
- `/_document` — `apps/web/pages/_document.tsx` — layout/document entry point; mixed styles.
- `/admin` — `apps/web/pages/admin/index.tsx` — old shared template styles; migrate.
- `/certificates/[code]` — `apps/web/pages/certificates/[code].tsx` — old shared template styles; migrate.
- `/certificates/mine` — `apps/web/pages/certificates/mine.tsx` — old shared template styles; migrate.
- `/challenges/[slug]` — `apps/web/pages/challenges/[slug].tsx` — old shared template styles; migrate.
- `/challenges` — `apps/web/pages/challenges/index.tsx` — old shared template styles; migrate.
- `/classes/[id]/room` — `apps/web/pages/classes/[id]/room.tsx` — old shared template styles; migrate.
- `/classes/[id]` — `apps/web/pages/classes/[id].tsx` — old shared template styles; migrate.
- `/classes` — `apps/web/pages/classes/index.tsx` — old shared template styles; migrate.
- `/courses/[id]` — `apps/web/pages/courses/[id].tsx` — old shared template styles; migrate.
- `/courses` — `apps/web/pages/courses/index.tsx` — separate workspace system; needs editorial migration.
- `/dashboard` — `apps/web/pages/dashboard.tsx` — role redirect; access/loading state needs shared styles.
- `/discussions` — `apps/web/pages/discussions/index.tsx` — old shared template styles; migrate.
- `/` — `apps/web/pages/index.tsx` — editorial reference; token extraction required.
- `/login` — `apps/web/pages/login.tsx` — old shared template styles; migrate.
- `/notes` — `apps/web/pages/notes/index.tsx` — old shared template styles; migrate.
- `/register` — `apps/web/pages/register.tsx` — old shared template styles; migrate.
- `/settings` — `apps/web/pages/settings.tsx` — old shared template styles; migrate.
- `/student` — `apps/web/pages/student/index.tsx` — old shared template styles; migrate.
- `/tutor/assignments/[id]` — `apps/web/pages/tutor/assignments/[id].tsx` — old shared template styles; migrate.
- `/tutor/challenges/new` — `apps/web/pages/tutor/challenges/new.tsx` — old shared template styles; migrate.
- `/tutor/classes/new` — `apps/web/pages/tutor/classes/new.tsx` — old shared template styles; migrate.
- `/tutor/courses/[id]` — `apps/web/pages/tutor/courses/[id].tsx` — old shared template styles; migrate.
- `/tutor/courses/new` — `apps/web/pages/tutor/courses/new.tsx` — old shared template styles; migrate.
- `/tutor` — `apps/web/pages/tutor/index.tsx` — separate workspace system; needs editorial migration.
- `/404` — framework default; add custom editorial page.
- Community is the existing `/discussions` route; account/profile is `/settings`. No existing routes will be renamed.

## Layouts and wrappers

- `pages/_app.tsx`: global CSS ordering and SiteShell.
- `pages/_document.tsx`: fonts, initial theme, document structure.
- `components/SiteShell.tsx`: global header, account menu, mobile navigation, notifications, help and footer; homepage-only overrides.
- `components/RequireRole.tsx`: auth verification and loading/error wrapper; preserve permissions.

## Every shared component

- `apps/web/components/AskAnything.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/AskTutor.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/CategoryField.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/ClassWorkspace.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/CommandPalette.tsx` — editorial reference or new shared primitive; consolidate.
- `apps/web/components/CourseCard.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/DocumentHead.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/FloatingLaptop.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/FloatingPhone.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/JaasRoom.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/LabPreview.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/LiveDot.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/PageFeedback.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/ProgressBar.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/RequireRole.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/SiteShell.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/Sparkle.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/TechPhoto.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/catalogue/CatalogueSkeletons.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/catalogue/CategoryTabs.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/catalogue/Dropdown.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/catalogue/FilterBar.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/tutor/CourseStudio.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/tutor/QuickCreate.tsx` — inspect/migrate to global editorial tokens; retain behaviour.
- `apps/web/components/tutor/StudioDialog.tsx` — editorial reference or new shared primitive; consolidate.
- `apps/web/components/tutor/TutorLiveClasses.tsx` — inspect/migrate to global editorial tokens; retain behaviour.

## Styles and theme sources

- `apps/web/styles/globals.css`: old navy/blue tokens, rounded surfaces, gradients and soft shadows.
- `apps/web/styles/editorial-home.css`: actual reference values, currently scoped to home.
- `apps/web/styles/workspaces.css`: independent graphite/copper tokens and rounded workspace controls.
- `apps/web/tailwind.config.js`: old Inter display mapping and glow shadow alias.
- `apps/web/lib/theme.ts`: existing persisted light/dark switch; preserve.

## Implementation direction

One `tokens.css` owns the exact homepage colours, type families, scale, spacing, borders, hard shadows and motion. Global primitives and existing semantic class names consume those tokens. Homepage/workspace files retain layout rules only. No backend, database, role or payment changes in this pass.
