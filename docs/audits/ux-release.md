# UX and performance release audit — 15 November 2026

## Highest-impact findings

| Priority | Finding | Result |
|---|---|---|
| 1 | Actions looked like text links; payment errors repeated and references were hard to copy | Shared native Button system, separate navigation treatment, reference copy chips, stacked alerts and payment timelines |
| 2 | Admin tools were pushed below large promotional copy | Compact header, live counters, timeline, inline enquiry/reschedule drawers, people/course/class/report desks |
| 3 | Tutor editing had weak grouping and no save state | Field/Panel/Notice system, wider two-column editor, autosave of valid drafts, explicit publishing, Ctrl/⌘ S and unsaved-change warning |
| 4 | Progress overview used a query per enrolled course | Replaced with a relation query and actual next/last completed lesson metadata |
| 5 | Full-size images and globally bundled assistant/search code increased load | Responsive Next Image AVIF/WebP, lazy non-hero images, split assistant/search modules and swap/Latin fonts |
| 6 | Theme ignored OS setting on first visit; generic sharing metadata | OS theme fallback, route metadata, course JSON-LD, robots and dynamic public-course sitemap |

## Route inventory

This is a source audit, not a claim that every possible account/data condition was exercised manually. Mobile layout and keyboard behavior inherit SiteShell, native controls and the shared responsive components. Detailed browser verification and known exceptions are below. “Shared child” means the page delegates its states to its mounted component.

| Route | Loading | Empty | Error | Mobile / keyboard / old styles |
|---|---|---|---|---|
| /404 | static | not applicable | not applicable | Shared shell and controls; legacy class names are token aliases |
| /admin/activity | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/careers | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/classes | shared auth / children | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/community | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/courses | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/enquiries | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/payments | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/people | shared auth / children | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/planner | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/reconciliation | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /admin/reports | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /admissions | shared auth / children | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /careers/[id] | explicit | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /careers | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /certificates/[code] | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /certificates/mine | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /challenges/[slug] | static | not applicable | not applicable | Shared shell and controls; legacy class names are token aliases |
| /challenges | static | not applicable | not applicable | Shared shell and controls; legacy class names are token aliases |
| /classes/[id]/room | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /classes/[id] | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /classes | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /courses/[id] | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /courses | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /dashboard | static | not applicable | not applicable | Shared shell and controls; legacy class names are token aliases |
| /discussions | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /fees | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /forgot-password | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| / | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /install | shared auth / children | shared child / see notes | shared child | Shared shell and controls; legacy class names are token aliases |
| /login | shared auth / children | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /notes | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /privacy | explicit | explicit | shared child | Shared shell and controls; legacy class names are token aliases |
| /register | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /reset-password | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /settings | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /sitemap.xml | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /student | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /tutor/assignments/[id] | shared auth / children | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /tutor/challenges/new | static | not applicable | not applicable | Shared shell and controls; legacy class names are token aliases |
| /tutor/classes/new | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /tutor/courses/[id] | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |
| /tutor/courses/new | shared auth / children | shared child / see notes | explicit | Shared shell and controls; legacy class names are token aliases |
| /tutor | explicit | explicit | explicit | Shared shell and controls; legacy class names are token aliases |

## Implementation notes and limits

- New admin-only APIs: `GET /api/school/admin/overview`, `/activity?offset=`, `/search?q=`, `/community`. All retain JWT + Admin guards. Activity is derived from current enrolment/payment/post records, not a durable audit ledger; capped at 1,000 recent rows.
- Role-scoped `GET /api/school/search?q=` includes public courses/tutor names; lesson/post results require an enrolled or managing account. Admin search adds people, classes and staff actions. Search never returns private account email to anonymous users.
- `DELETE /api/courses/:id/lessons/:lessonId` accepts only manager-owned private drafts without progress, notes or resources. The UI confirms deletion and delays it five seconds for Undo; leaving the component cancels an uncommitted deletion. Published/used teaching records are preserved.
- `GET /api/payments/courses/:id/community` supplies the private WhatsApp invitation only to a signed-in enrolled student with verified payments meeting the quoted deposit. Set server-only `STUDENT_WHATSAPP_GROUP_URL` on Render to activate the invitation; it is intentionally not embedded in the public repository. There is no automatic WhatsApp membership or removal; invite links can be forwarded by members. No public social footer exposes it.
- No tutor application, flagged-post queue, seat capacity, tuition due date or cover-image field exists in the current model. Counters use real job applications, registration counts and unpaid quoted balances; none is mislabeled as tutor applications, seats left or overdue debt. Community review is read-only, not a flag/moderation workflow. Cover upload is explicitly unavailable.
- Replies open an email draft; saving internal notes does not send email. SMTP is not configured. One-hour email reminders remain TODO in NotificationsService; in-app reminders continue.
- Card payments remain a disabled coming-soon preview, not a live Paystack integration. M-Pesa quote/idempotency and server verification remain unchanged.
- Saved filters, collapsed activity, recent commands and tips are scoped per account in browser storage. Role changes, class edits and follow-up notes support five-second undo where reversible. Password resets and destructive operations cannot promise undo.
- New staff tables have sticky sortable headers, local 20-row pagination, status/date/course filtering, CSV formula escaping and selection/bulk actions where meaningful. Server-paged payments retain batch controls; CSV exports only the loaded, filtered batch. No bulk payment charging exists.
- PWA caches immutable public shell JS/CSS and install assets with a bounded cache. Authenticated HTML, API responses, financial records and lesson bodies are never stored by the service worker. The existing offline page remains the navigation fallback.
- Font subsetting uses Google Fonts Latin selection and `display=swap`; route code splitting uses Next pages plus dynamic assistant/search imports.

## Keyboard shortcuts

Ctrl/⌘ K opens search; arrows choose a result; Enter opens it; Escape closes dialogs. In staff workspaces outside editable fields: `/` opens search, `N` schedules a class, `G` then `C` opens courses, `G` then `T` opens tutors, `?` shows help. Ctrl/⌘ S saves the course editor. Lesson Move up/down buttons provide a keyboard alternative to drag-and-drop.

## Verification

- API / Next production builds and 47 isolated PostgreSQL integration tests. No production mutation, real STK or student email used for QA.
- Local browser: compact admin overview, follow-up drawer save, account search via keyboard, course draft autosave and Ctrl+S.
- Responsive checks and Lighthouse results are recorded below after completion. Lighthouse simulated mobile throttling is not a manual Fast 3G end-to-end acceptance test.

## Next five improvements

1. Configure school SMTP and implement a durable opt-in email reminder outbox.
2. Complete Paystack compliance and verified hosted card checkout.
3. Add audited community reports/moderation and a real tutor-application workflow.
4. Add explicit intake capacity and fee due dates if the school needs seats/overdue reporting.
5. Add durable staff audit events, server-side table filters/pagination and historical reports as volume grows.

### Contrast and interaction migration

Actual token contrast ratios: orange button / ink: 5.66:1, light muted / paper: 5.66:1, dark muted / paper: 8.74:1, light danger / surface: 6.46:1, dark danger / surface: 9.32:1. These exceed AA for normal text; disabled controls are visibly disabled and not counted as active text contrast.

The recorded JSX migration converted 211 action controls and 56 low-priority navigation links. Inline references were not converted (0); inline support email/privacy references remain links. Native summary controls, dialog scrims and whole-card navigation retain their native semantics. Primary/secondary/danger buttons share Button.tsx; tertiary navigation uses NavigationLink, never an action button.

Final browser matrix: 24 checks across Admin, People, Tutor editor and Fees, in light and dark at 390/768/1440px; all confirmed the expected page heading and zero horizontal overflow. Evidence: `responsive-checks.json`. Keyboard search selection and editor Ctrl+S were exercised; draft autosave persisted. The offline fallback was observed without private account content. 17 local HTTP permission checks passed.
