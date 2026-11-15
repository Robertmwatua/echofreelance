# Editorial migration report

## Scope

All existing first-party routes now inherit one editorial design system. The homepage values were extracted into `apps/web/styles/tokens.css`; global primitives retain compatibility aliases so existing component APIs cannot fall back to navy/blue. No backend, database, payment, role or authentication logic was changed in this visual pass. Earlier unrelated work remains in the working tree.

The shared shell, catalogue/course tickets, session cards, lesson disclosure lists, notes, forms, filters, tabs, skeletons, dropdowns, feedback notes, notifications and Admin table use those tokens. Browser-native class/course/note confirmations are replaced by the shared accessible dialog; their existing mutations are unchanged. Unused floating devices and sparkle decorations were removed.

Community is `/discussions`; profile/account is `/settings`. Existing legacy redirect paths are retained. A custom `/404` was added. No first-party page was left on the old palette.

## Verification

- Final Next.js production build: passed, including TypeScript validation and all 26 generated pages. Build output isolated in `.next-editorial-final`; no dependency changes.
- Every route in the audit checked in the browser at 390, 768 and 1440 CSS px, in light and dark themes. Authenticated screens used a disposable local read-only fixture API, never production records. Legacy paths were checked through their redirects. No page-level horizontal overflow found. Dense Admin tables scroll within their own container.
- Protected screens were rechecked after session/data loading. Classroom entry error presentation was checked; this is visual QA, not a real two-person media/session test.
- Search dialog opened and closed; confirmation opened and cancelled without deleting data. Class filters produced the note-style empty state; loading/error states were inspected during local API startup/reconnection.
- Reduced-motion override disables reveal, pulse, transitions and smooth scrolling site-wide. Focus uses a 3px accessible accent outline; native dialog retains keyboard trapping, Escape handling and focus restoration.
- Source search: no old navy/blue literals, slate backgrounds, rounded-card classes, gradients, glows, glass blur, uppercase/letter-spaced eyebrows, or browser-native confirmations remain in page/component/style source. Generated build directories were excluded.
- `git diff --check`: passed.

| Contrast pair | Ratio |
| --- | ---: |
| Orange button / dark ink text | 5.66:1 |
| Light muted / paper | 5.66:1 |
| Light muted / surface | 6.28:1 |
| Dark muted / background | 8.74:1 |
| Dark muted / surface | 7.91:1 |
| Light link / paper | 6.23:1 |
| Dark link / surface | 8.28:1 |

These are WCAG AA token-pair checks, not a claim of a complete accessibility certification.

## Limits and data honesty

- JaaS owns the embedded meeting controls/media UI. Our classroom frame and loading/error/left-call states are migrated; cross-origin provider internals cannot be restyled here.
- Course codes are stable category-plus-ID labels, not invented curriculum identifiers. Session cards show actual registered counts; “seats left” is omitted because there is no capacity field. Ratings, tutor names, prices and times remain data-driven.
- Local QA fixtures live only in `/tmp`, and are not shipped. Preview screenshots may show explicitly named Visual QA accounts.
- This pass has not been committed, pushed or deployed.

## Files changed by the visual migration

- [apps/web/components/AskAnything.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/AskAnything.tsx) — updated/added
- [apps/web/components/AskTutor.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/AskTutor.tsx) — updated/added
- [apps/web/components/ClassWorkspace.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/ClassWorkspace.tsx) — updated/added
- [apps/web/components/CommandPalette.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/CommandPalette.tsx) — updated/added
- [apps/web/components/Confirmation.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/Confirmation.tsx) — updated/added
- [apps/web/components/CourseCard.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/CourseCard.tsx) — updated/added
- [apps/web/components/DocumentHead.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/DocumentHead.tsx) — updated/added
- [apps/web/components/FloatingLaptop.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/FloatingLaptop.tsx) — removed
- [apps/web/components/FloatingPhone.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/FloatingPhone.tsx) — removed
- [apps/web/components/JaasRoom.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/JaasRoom.tsx) — updated/added
- [apps/web/components/LabPreview.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/LabPreview.tsx) — updated/added
- [apps/web/components/LiveDot.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/LiveDot.tsx) — updated/added
- [apps/web/components/PageFeedback.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/PageFeedback.tsx) — updated/added
- [apps/web/components/ProgressBar.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/ProgressBar.tsx) — updated/added
- [apps/web/components/RequireRole.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/RequireRole.tsx) — updated/added
- [apps/web/components/SiteShell.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/SiteShell.tsx) — updated/added
- [apps/web/components/Sparkle.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/Sparkle.tsx) — removed
- [apps/web/components/TechPhoto.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/TechPhoto.tsx) — updated/added
- [apps/web/components/catalogue/CatalogueSkeletons.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/catalogue/CatalogueSkeletons.tsx) — updated/added
- [apps/web/components/ui.tsx](/home/robert/Desktop/school/echofreelance/apps/web/components/ui.tsx) — updated/added
- [apps/web/lib/theme.ts](/home/robert/Desktop/school/echofreelance/apps/web/lib/theme.ts) — updated/added
- [apps/web/pages/404.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/404.tsx) — updated/added
- [apps/web/pages/_app.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/_app.tsx) — updated/added
- [apps/web/pages/admin/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/admin/index.tsx) — updated/added
- [apps/web/pages/certificates/[code].tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/certificates/[code].tsx) — updated/added
- [apps/web/pages/certificates/mine.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/certificates/mine.tsx) — updated/added
- [apps/web/pages/challenges/[slug].tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/challenges/[slug].tsx) — updated/added
- [apps/web/pages/challenges/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/challenges/index.tsx) — updated/added
- [apps/web/pages/classes/[id].tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/classes/[id].tsx) — updated/added
- [apps/web/pages/classes/[id]/room.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/classes/[id]/room.tsx) — updated/added
- [apps/web/pages/classes/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/classes/index.tsx) — updated/added
- [apps/web/pages/courses/[id].tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/courses/[id].tsx) — updated/added
- [apps/web/pages/courses/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/courses/index.tsx) — updated/added
- [apps/web/pages/dashboard.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/dashboard.tsx) — updated/added
- [apps/web/pages/discussions/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/discussions/index.tsx) — updated/added
- [apps/web/pages/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/index.tsx) — updated/added
- [apps/web/pages/login.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/login.tsx) — updated/added
- [apps/web/pages/notes/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/notes/index.tsx) — updated/added
- [apps/web/pages/register.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/register.tsx) — updated/added
- [apps/web/pages/settings.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/settings.tsx) — updated/added
- [apps/web/pages/student/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/student/index.tsx) — updated/added
- [apps/web/pages/tutor/assignments/[id].tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/tutor/assignments/[id].tsx) — updated/added
- [apps/web/pages/tutor/challenges/new.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/tutor/challenges/new.tsx) — updated/added
- [apps/web/pages/tutor/classes/new.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/tutor/classes/new.tsx) — updated/added
- [apps/web/pages/tutor/courses/[id].tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/tutor/courses/[id].tsx) — updated/added
- [apps/web/pages/tutor/courses/new.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/tutor/courses/new.tsx) — updated/added
- [apps/web/pages/tutor/index.tsx](/home/robert/Desktop/school/echofreelance/apps/web/pages/tutor/index.tsx) — updated/added
- [apps/web/styles/editorial-home.css](/home/robert/Desktop/school/echofreelance/apps/web/styles/editorial-home.css) — updated/added
- [apps/web/styles/globals.css](/home/robert/Desktop/school/echofreelance/apps/web/styles/globals.css) — updated/added
- [apps/web/styles/tokens.css](/home/robert/Desktop/school/echofreelance/apps/web/styles/tokens.css) — updated/added
- [apps/web/styles/workspaces.css](/home/robert/Desktop/school/echofreelance/apps/web/styles/workspaces.css) — updated/added
- [apps/web/tailwind.config.js](/home/robert/Desktop/school/echofreelance/apps/web/tailwind.config.js) — updated/added
- [docs/design-system-audit.md](/home/robert/Desktop/school/echofreelance/docs/design-system-audit.md) — updated/added
- [docs/editorial-migration-report.md](/home/robert/Desktop/school/echofreelance/docs/editorial-migration-report.md) — removed
