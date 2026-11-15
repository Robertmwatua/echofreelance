# Mobile navigation, editable roadmaps and installable PWA

## Delivered

- Explicit desktop Home link, mobile Home link and breadcrumbs. Mobile hamburger has an accessible expanded state, Escape handling, focus return and scroll locking; it closes after navigation. Dense navigation switches to the menu below 1280px.
- Mobile bottom navigation, 44px+ touch controls, 16px form inputs, reduced hero type, fitted collage and full-width clear course CTA. Keyboard focus hides bottom navigation. Auth forms come before decorative media on phones. Safe-area padding supports standalone display.
- Catalogue introduction has a relevant technical photo. Course tickets show two actual roadmap stages and an explicit roadmap action instead of repetitive empty rating metadata.
- Tutors can create/edit their own courses and choose from 18 roadmap templates. Admins can manage any course. Roadmap stages are editable, saved as nullable JSONB, validated to 24 strings of 3–180 characters, and can be cleared. Public preview is an explicit nullable Boolean override; null preserves existing prospectus visibility, false hides an unpublished preview, true lists a preview. Publication, lesson access and enrollment checks remain independent. Copies start private.
- Create, quick-create and edit forms share `components/tutor/RoadmapEditor.tsx`. Changing roadmap details does not accidentally attempt to republish an already-published course.
- `/install`, a footer Install app control and mobile-menu installation link. Manifest, original 192/512/maskable PNG icons, Apple touch icon, and root-scoped service worker. Native Chromium prompt is used only when offered by the browser; other browsers receive manual instructions. iPhone/iPad instructions use Safari → Share → Add to Home Screen. No APK or app-store listing is implied.
- Offline fallback is a generic reconnect screen. Only that screen, icons and manifest are placed in Cache Storage. No account pages, API responses, lesson content, credentials or meeting data are cached. Learning and live calls still need internet. Service-worker updates do not force reload ongoing classes.

## Verification

- API build and 10 service/validation tests pass: publication, ownership, archive, copy privacy, public visibility, draft lesson protection, empty-course enrollment protection, editable roadmap persistence arguments and invalid DTO rejection.
- Frontend production build passes, including `/install` and all existing routes.
- Four PWA tests pass: valid standalone manifest/icon dimensions, public cache allowlist, API/mutation/cross-origin bypass, network-only account navigation with generic offline fallback.
- Browser checks: refreshed home, catalogue, install page, new-course and course editor fit at 320/390/768/1440px in light, and 390/768/1440px in dark, with no page horizontal overflow. Hamburger navigation and install help dialog checked. Template selected, edited, saved and reloaded through an isolated in-memory QA API. No client record was edited for UI tests. Native device installation was not performed on the user's machine; real installation availability is browser-controlled.
- Migration `20261115140000_editable_roadmaps` adds two nullable columns, preserving existing content. Applied successfully; read-only database inspection verifies types and defaults.
- Automatic approval review rejected a proposed production save-and-rollback QA test. It was not executed. Validation uses isolated tests and read-only production checks instead.

M-Pesa/Megapay integration is intentionally left for the next task; no payment API keys or payment behavior were changed.

Reference: [MDN: making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
