# EchoFreelance: Cloudflare + Supabase migration

## Target

- Cloudflare Workers runs the frontend and API as two services in one account. The frontend calls the API through a private service binding at `/api`; browsers need only one hostname. The API has no public workers.dev or preview URL.
- Supabase Postgres stores the existing Prisma schema. Existing IDs, enrollments, grades and password hashes are preserved when data is transferred.
- Cloudflare Cron invokes the existing reminder delivery and expired-note cleanup every minute. No always-running Render process is required.
- JaaS continues to provide live video; its quota and billing are independent of website hosting.

The first migration retains the current application authentication and permissions. Supabase Auth is **not** enabled by this change: switching password/session ownership simultaneously with hosting would risk breaking existing accounts. Supabase Storage is also not connected yet. Do not enable a second independent sign-up system against this application.

Workers Free currently allows only 10 ms CPU per request. Existing bcrypt password hashing is likely to exceed that; plan for Workers Paid (currently starting at $5/month plus overages) until authentication is offloaded or measured within limits. No paid account has been activated. Free CPU and bundle limits must be verified against the built application and real traffic, particularly bcrypt password operations and Nest startup. This migration removes the requirement for Render; it does not guarantee that the complete application fits Workers Free. A successful local build is not a deployed acceptance test.

## 1. Create a separate Supabase project

Create a project named EchoFreelance, choose a nearby region, and store the generated database password in a password manager. Do not use JengaStack's project or paste secrets into chat.

In Connect, obtain the transaction-pooler PostgreSQL connection string for runtime use and a direct or session-pooler connection string for migrations. Use the supplied URLs and ports exactly; URL-encode special characters in passwords. Runtime goes in `DATABASE_URL`; migration goes in `DIRECT_URL`. Never put either in a `NEXT_PUBLIC_*` variable.

Before importing: keep the old deployment and Neon database intact. Take and verify a database backup using PostgreSQL tools compatible with the source server. Restore to the new **empty** database, preserving Prisma migration history. Do not run the seed script. Compare row counts and relationships, then apply outstanding migrations. Avoid writing to both databases during cutover: arrange a short maintenance window and transfer the final data before pointing production to Supabase.

After import, run `scripts/supabase-lockdown.sql` in the Supabase SQL editor. It enables RLS and revokes Data API access to the application tables. The backend uses the server-only database connection; browser clients must not query these tables directly. Supabase Auth/Storage schemas are not modified.

## 2. Local configuration

Keep API development on Node with `npm run dev:api`, and frontend development with `npm run dev:web`. API `.env` contains `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and the existing JaaS configuration.

For a Workers preview, create ignored `apps/api/.dev.vars` with those server-only values. Use a separate development database. Workers runtime vars are declared in `apps/api/wrangler.jsonc`. Do not let test/preview sessions write to the production database.

## 3. Build and preview

From the repository root:

```sh
npm ci
npm run test:security --workspace=echofreelance-api
npm run cf:build --workspace=echofreelance-api
npm run cf:build --workspace=echofreelance-web
```

In separate terminals, run `npm run cf:dev --workspace=echofreelance-api` and `npm run cf:preview --workspace=echofreelance-web`. The service binding must resolve the local API Worker. Existing `.env.local` values for `NEXT_PUBLIC_API_URL` must be removed for a same-origin Cloudflare build; otherwise the compiled browser will still call the old server. Regular development defaults to localhost:4000.

## 4. Provision secrets, then deploy API before frontend

Log into the correct Cloudflare account using Wrangler. Configure API secrets using `wrangler secret put NAME` from `apps/api`, which prompts locally without recording the value in source:

- `DATABASE_URL`: Supabase runtime connection string.
- `DIRECT_URL`: used by local/CI Prisma migration commands, not needed in the Worker itself.
- `JWT_SECRET`: retain the existing strong secret when preserving sessions, or rotate deliberately and require login again.
- JaaS environment variables: copy the **names** from `apps/api/.env.example` and enter their values securely.
- `CORS_ORIGINS`: public frontend origin if direct cross-origin API use is desired. Same-origin service-binding calls do not require browser CORS.

Apply migrations explicitly against the new database using `npm run prisma:migrate --workspace=echofreelance-api`. Deploy the API, then build and deploy the frontend:

```sh
npm run cf:deploy --workspace=echofreelance-api
npm run cf:build --workspace=echofreelance-web
npm run cf:deploy --workspace=echofreelance-web
```

No script automatically migrates, imports, seeds, deletes or redirects production data. Before deployment, confirm the dry-run compressed bundle fits the chosen Cloudflare plan. Review current Cloudflare pricing and limits before upgrading.

## 5. Acceptance before changing DNS

Use the new Worker URL with separate tutor and student accounts. Verify registration/login, enrollment, unpublished-content access denial, submissions/grading, notes/expiry, reminders via actual Cron runs, confirmation dialogs, and live-room join/end/rejoin across two devices. Ensure unrelated tutors cannot moderate or delete each other's classes. Check mobile layout, request latency, CPU, memory/bundle limits, logs, DB connections and backend error handling. Verify database Data API requests cannot read application tables anonymously.

Only after these pass, add the client-owned domain to the web Worker and configure DNS through Cloudflare. Keep the old hosting available for rollback until the new deployment is stable; never roll back to an out-of-date database after accepting writes on the new one without reconciling data.

## Remaining work

This is a staged migration, not a completed production cutover. Supabase project setup, data backup/restore, secrets, deployment, and real multi-account video verification require account access and real integration tests. Supabase Auth, object storage uploads, email delivery and paid checkout remain separate implementation work. Do not cancel old hosting while these checks are outstanding.

## Local verification completed

- Updated frontend builds all 26 existing pages plus the new API proxy route with OpenNext.
- API Worker starts under Wrangler/workerd with the Worker-specific Prisma compiler and PostgreSQL sockets.
- Homepage, classes and frontend-to-API health return 200 through local service bindings.
- All seven Prisma migrations applied to a disposable PostgreSQL 17 database, without reading or modifying the hosted database.
- Database-backed registration/login, wrong-password rejection, public course reads and authenticated profiles pass through both Workers. Anonymous profile access returns 401 and student admin access returns 403.
- A real local scheduled event delivered a due reminder and removed an expired note from the disposable database.
- All 22 access-control, live-class and request-isolation regression tests pass.
- Lockdown SQL enables RLS on all 21 application/migration tables in the disposable database.

These checks do not verify hosted Supabase connectivity, JaaS calls, production CPU limits, or a completed production data transfer. Existing dependency advisories also remain; see `security-audit.md`. Do not treat this migration as resolving all launch blockers.

Official references:
- https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/
- https://developers.cloudflare.com/workers/platform/limits/
- https://opennext.js.org/cloudflare/get-started
- https://www.prisma.io/docs/orm/v6/prisma-client/deployment/edge/deploy-to-cloudflare
