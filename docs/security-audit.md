# Functionality and security audit — 16 October 2026

## Scope

Source-level review of authentication, ownership/enrollment checks, course materials, grading, classroom management, password updates, navigation, deployment scripts, and production npm advisories. This is not a penetration-test certification or proof of a secure production deployment.

## Implemented fixes

| Priority | Finding | Change |
| --- | --- | --- |
| High | Discussions, announcements, and direct lesson-resource endpoints disclosed course content without enrollment | Shared `requireCourseAccess` now checks course visibility plus enrollment, ownership, or admin privileges |
| High | Any Tutor role could see draft assignments in other tutors' courses | Assignment listing uses course ownership, not the generic role; enrolled non-owners only receive published assignments |
| High | Password resets did not revoke already issued login tokens | Added `User.sessionVersion`; password changes/admin resets increment it and token validation compares it. Existing versionless tokens count as version zero until credentials change |
| High | Predictable development JWT secret was silently usable in production | Production refuses missing/short JWT secrets; validator pins HS256 |
| High | Auth endpoints had no login-attempt limits | Added bounded in-memory per-IP/account (10/15min) and shared-IP (300/15min) buckets, HTTP 429 and Retry-After. Proxy trust is explicit/configurable |
| High | Production Docker startup seeded/deleted all data and ran the dev server | Removed seed from Docker startup, compile and run production build; development seed blocks production/remote hosts |
| High | Priced courses could be unlocked by a free enrollment request without payment | Block paid enrollment until verified checkout exists; frontend indicates paid enrollment unavailable. Existing enrollments are preserved |
| Medium | Wrong current password returned 401, triggering global logout | Returns a form validation error instead; successful password changes explicitly require fresh login |
| Medium | Login `next` allowed external redirects | Reject non-local paths, double-slash destinations, and backslashes |
| Medium | API reflected any browser origin | Explicit CORS allowlist; default production origin is the current Vercel website |
| Medium | Tutor roles could complete unrelated lessons without enrolling | Enrollment or course ownership/admin now required |
| Medium | Submitted grades could exceed assignment maximum | Enforced assignment maxPoints before any grade write |
| Medium | Public certificate verification disclosed student emails | Public verification omits email |
| Medium | Lesson links accepted unsafe URL schemes; videoUrl was stored but not displayed | New resource/video links require HTTP(S); lesson view provides Watch lesson video; legacy resource links are scheme-filtered |
| Medium | Failed private-note loading opened a blank note that could overwrite existing text | Failed reads close the editor and show an error |
| Medium | Updated class schedules could end before their start | Validate effective dates during updates |
| UX/security | Privilege/credential/publishing actions executed without meaningful confirmation | Added native confirmation popups for role changes, admin resets, own-password changes, grades, completion, publishing changes, and class broadcasts. Existing course/class/note deletion and cancellation confirmations retained; destructive class deletion states associated-data consequences |

## Dependencies: unresolved launch blocker

`npm audit --omit=dev --registry=https://registry.npmjs.org` reported 13 production findings: 2 critical, 5 high, 5 moderate, 1 low. This is a package advisory inventory; individual exploitability depends on used features, deployment, and reachability. Next 13.5.11 and Nest 10 remain installed. Compatible `npm audit fix --ignore-scripts` did not resolve the findings; a forced major upgrade was not applied as an incidental change.

Before a client launch, upgrade Next.js and NestJS to supported patched versions and validate Pages Router behavior, React compatibility, video embed permissions, Docker/Node runtime, and auth endpoints. Re-run the audit and review transitive packages, including Multer, lodash, proxy-addr, PostCSS, and source-map-js. Do not interpret passing application tests as resolving dependency advisories.

## Deployment requirements

1. Back up the production database using the existing procedure.
2. Generate Prisma client and apply additive migration `20261016150000_session_revocation` before serving the updated API. This audit did not apply the migration to Neon.
3. Set a strong stable `JWT_SECRET` of at least 32 characters on every production API instance. Changing it logs out existing users.
4. Set `CORS_ORIGINS` to exact frontend origins, comma-separated. Add the custom domain when configured; add localhost only if you deliberately permit local development against production.
5. Set `TRUST_PROXY_HOPS` to the host's verified reverse-proxy count so client-IP rate limits operate correctly. Do not blindly trust arbitrary forwarded headers.
6. Deploy frontend/API together; sign in again after changing/resetting passwords.

## Remaining work

- Move login tokens from localStorage to a deliberately designed secure-cookie/refresh-session flow, with CSRF protection appropriate to that design.
- Implement email verification and self-service password recovery; do not rely on manual admin passwords for the final product.
- Implement a payment provider with verified, idempotent server-side payment events before enabling paid enrollment.
- Use distributed or edge rate limits for multiple instances; current limits reset on restart and are per process.
- Replace notification-after-write paths with an outbox/transaction strategy so an alert failure cannot make a successfully persisted mutation appear to fail.
- Aggregate dashboard/gradebook queries and paginate unbounded lists before increasing traffic.
- Verify live media, accurate attendance, reminders, backup restoration, and multi-tutor rooms on real deployed services. Current attendance is authorized entry, not provider-confirmed call duration.
- Existing frontend optional-content fetches can mask section failures as empty collections; give sections independent error states.

## Verification

Backend build and frontend production build passed. The automated security/live-class suite checks enrollment/ownership, draft isolation, grade limits, certificate privacy, token revocation, password behavior, weak secrets, rate limiting, paid-enrollment denial, and the prior meeting/notes/reminder rules. No real student data was deleted, no password was changed, and no production migration was run during these checks. Docker image changes were reviewed but not built in this environment.
