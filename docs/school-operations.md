# School operations, careers and account access

## What is available

- `/student`: tuition balances, statement/PDF links, upcoming class actions and learning progress.
- `/fees?course=...`: a fixed student quote, access-deposit progress, amount shortcuts, verified tuition receipts and remaining balance. No card payments were added in this change.
- `/admin/payments`: full tuition fee, percentage discount, optional campaign end and adjustable access-deposit percentage. New quotes default to **50% paid before access**. Discounted tuition and deposits round up to whole KES. A first request below the required deposit is rejected (large deposits above the KES 150,000 transaction cap can be accumulated in capped payments). Requests include the tuition/deposit quote shown in the browser; changed quotes must be reviewed before charging.
- `/admin/reconciliation`: outstanding quoted balances, unmet deposits and requests delayed >15 minutes; manual email drafts and ledger links. Filters apply to the current page. No automatic collection/email occurs.
- `/tutor/courses/[id]`: draft/published lesson editing, plain-text student preview, video URL, reordering, resource links/removal. New lessons start as drafts. Existing lessons remain published after migration. Students cannot fetch draft resources or complete draft lessons. Resources must use HTTPS.
- `/admissions`: consented public enquiries; `/admin/enquiries`: private shared inbox, status and follow-up notes. Email links open the admin's mail app; the system does not claim that a reply was sent.
- `/careers` and `/careers/[id]`: real open vacancies and signed-in applications with CV/portfolio HTTPS links. No demo vacancies are published. `/admin/careers` manages drafts/publication, expiry and private applicant reviews. Applications are unique per person/role. Applicants see their own stage, never internal notes. There is no automated hiring decision or promise of placement. CV files are links; file upload hosting was not added.
- `/admin/planner`: shared tasks, assignment to staff, editable due dates, reopen/done, upcoming classes and assignment deadlines, and direct class/course actions. Tutors see their assigned open tasks in the tutor dashboard. Calendar links let the user save a task manually; no external events are created automatically.

Admin landing cards and the shared workspace navigation link all desks. Careers is in the desktop/mobile navigation; admissions is in the mobile menu/footer and course enquiry buttons. Account menus link fees/receipts.

## Existing data and brochure prices

The migration adds fields/tables. It does not set production fees or invent jobs/applicants. Existing account quotes keep `unlockCents=100` (their prior KES 1 first-instalment agreement), original tuition and access. Existing enrolments are never revoked when the default deposit changes. New quotes snapshot the tuition, active discount and access deposit. Subsequent course policy changes affect new quotes only.

`prisma/brochure-fees.json` transcribes **page 2** of `tech school v1 Trifold Brochure.pdf`: Certificate in Computer Applications 12,500; Advanced Digital Professional 22,000; Kids' Tech Explorer 8,000; AI & Machine Learning 145,000; Blockchain 95,000; Quantum Computing 195,000; Sustainable Technology 65,000; Custom Software 130,000; Digital Transformation 45,000 KES. It also records their stated durations. Registration KES 500 and certification KES 1,000 are displayed separately, as requested, and are **not included in tuition checkout**. No fee is inferred for unmatched programmes.

The client's new 50% rule supersedes the brochure's smaller deposit examples. Its Blockchain schedule totals 94,900 vs 95,000, and Quantum schedule totals 194,800 vs 195,000; those monthly schedules are not copied. The listed total tuition is authoritative.

`node apps/api/tools/import-brochure-fees.cjs` previews the import. `--apply` updates seven existing programmes (including the AI title) and adds the two missing brochure programmes as **public previews with private draft teaching content**. It preserves lesson/publication states and never modifies fee accounts, payments or enrolments. New programmes are owned by the existing prospectus tutor. The import is explicit, not an automatic seed on deployment. Do not run unrelated seeds.

## Google sign-in setup

1. In the school's Google Cloud project, configure the OAuth consent screen and create an OAuth **Web application** client.
2. Add authorized JavaScript origins `https://www.echofreelancetechschool.com` and `https://echofreelancetechschool.com` (add `http://localhost:3002` only for local testing if desired). This uses Google Identity Services ID-token sign-in; no redirect URI/client secret is needed for this flow.
3. Put its public client ID in backend `GOOGLE_CLIENT_ID` and redeploy. The frontend fetches this value and displays the Google button when configured. A CSP, if introduced later, must allow Google Identity Services resources.
4. Complete any Google publishing/testing requirements in that console, then test a real sign-in. No real Google account was used for QA; tests mock verified provider responses.

The backend verifies Google's signature, issuer/audience/expiry through `google-auth-library`, a single-use server nonce and verified email. Existing Gmail/verified Workspace accounts can link by Google-authoritative email. An existing third-party-domain account is not silently linked from a non-authoritative email claim. Provider credentials cannot set an app role. New users start as Students. The application session uses the current database role and session version.

## Forgot password setup

Add server-only `WEB_URL`, `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS or 465 TLS), `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM` using the school's email provider. Use the provider's SMTP credential/app password, not a personal password in source. Authorize the sending address/domain as required by that provider.

`/forgot-password` is honest about unavailable SMTP configuration and links school support. Once configured, requests return a generic account-existence-neutral response. Tokens are cryptographically random, stored hashed, single-use, expire after 15 minutes, and are passed in a URL fragment rather than HTTP query logs. The reset page removes the fragment immediately. Password changes/resets increment a database session version so previous JWTs stop working. Admin password resets also revoke existing sessions. Delivery failures do not expose which accounts exist or log reset links/passwords.

Google sign-in, public enquiries and reset requests have database-backed submission limits. SMTP and Google live delivery/sign-in remain deployment acceptance checks after credentials are supplied. Do not claim live OAuth/email recovery is verified from local mocks.

## Validation

Build both workspaces. Run `tests/payments.cjs` and `tests/school-operations.cjs` only against disposable localhost `ef_payment_test`; each test refuses production URLs. Tests cover payment concurrency/receipts, new deposit rules, retained quotes, lesson privacy/order, admissions, job deadlines and duplicate/private applications, staff tasks, nonce replay, token hashing/expiry and session revocation. Render receipts to PNG with `pdftoppm` for visual review. No real STK prompt or reset email is sent by QA.

## Release validation (15 November 2026)

API and Next.js production builds passed (38 frontend routes). The isolated PostgreSQL suites passed 44 tests: 17 payments, 10 course studio and 17 school operations. Browser checks covered public enquiries reaching the admin inbox, a student job application, a persisted assigned planner task, and mobile light/dark layouts. The receipt was rendered and reviewed as a single A4 page. No real payment, reset email or Google account was used for QA.

The production dependency audit reports zero high/critical advisories; four moderate advisories remain in the existing Nest dependency chain and require a separately tested major upgrade. Patched Next.js and compatible transitive dependency updates are included.

Google setup references: [Web client configuration](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [server token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
