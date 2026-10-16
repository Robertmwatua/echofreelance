# Live classroom deployment and verification

## Two different authentication systems

The website uses an API JWT (`JWT_SECRET`). JaaS uses a separately signed RSA participant token. An `Unauthorized` message on `/tutor` while courses fail to load is an application-login failure, before JaaS is involved. Sign out and sign back in against the deployed API. If the new login still fails, check that Vercel's `NEXT_PUBLIC_API_URL` points to the intended API, all API instances share the same stable `JWT_SECRET`, and the user still exists in that API's database. Do not rerun the destructive development seed to repair login.

Protected pages now verify `/users/me` before rendering role-specific data. A 401 from authenticated API requests clears the rejected session and sends the user to login with a return URL and a session-expired explanation. Transient network errors offer retry rather than deleting the session.

## Required JaaS deployment configuration

Set `JAAS_APP_ID`, `JAAS_API_KEY_ID`, and `JAAS_PRIVATE_KEY` on the API service. The API key id must start with the matching app id plus `/`. Upload the corresponding public key to that application's JaaS console; keep the RSA private key only on the API. Parsing a private key locally does not prove its public key is uploaded or that the subscription is active. Tutor/admin `/api/classes/live-status` reports local configuration diagnostics, not provider-side verification.

Use HTTPS for the frontend and API. Ensure browser/hosting Permissions-Policy allows camera and microphone in the JaaS iframe. The integration uses the official app-scoped external API script and prejoin device selection, with muted audio initially. Camera/mic errors, fatal meeting errors, loading delays, and hangup are handled through SDK events. Tokens are scoped to one literal room. The new-tab fallback carries the participant token; do not share its URL or include it in analytics/logs.

## Admission behavior

Only the host/admin can transition a scheduled class to Live. Registered and enrolled students join after that transition. Completed, cancelled, and expired sessions reject admission. Signing failure happens before entering-room status/attendance writes. Scheduled integrated classes reject missing JaaS configuration before creation.

Attendance currently records authorized room entry, not independently verified conference participation. Accurate call attendance and automatic end-of-call state require authenticated JaaS webhooks; they are not claimed by these checks. Mark sessions completed from the existing host controls. Recording permissions do not prove the account includes cloud recording or that recordings are persisted automatically.

## Verification

Run `npm run test:live --workspace=echofreelance-api`. Tests cover real local RSA signing/verification, escaped PEM normalization, app/key mismatch, non-RSA rejection, room scope, moderator roles, closed-room denial, host-only start, and no writes on signing failure. Service tests use database stubs; they do not establish a real meeting connection.

For production acceptance use separate real tutor and enrolled-student accounts, preferably separate devices:

1. Verify fresh login, course ownership, and `/classes/live-status`.
2. Start a real instant session on a published course; register the student and join the same room.
3. Verify bidirectional audio/video, moderator controls, chat, desktop screen sharing, reconnect, and hangup.
4. Repeat on current desktop Chrome/Firefox/Edge and Safari, Android Chrome, and iOS Safari. Mobile screen sharing and background/Bluetooth behavior depend on browser/platform.
5. Confirm an unenrolled account is denied, a student cannot start a scheduled room, and closed/expired rooms are denied.
6. Confirm recording separately using the account's enabled recording feature and actual output storage.

Sources: https://developer.8x8.com/jaas/docs/iframe-api-integration/ ; https://developer.8x8.com/jaas/docs/api-keys-jwt/ ; https://developer.8x8.com/jaas/docs/jaas-browser-support/ ; https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe-events/

Local environment during this audit did not contain JaaS credentials. Production API URL and actual two-party meeting verification are still required before calling the deployment operational.

## Post-call management, shared notes, and reminders

Built-in rooms now replace the video component with an explicit post-call panel on `videoConferenceLeft` or `readyToClose`. Participants can rejoin, open class notes/recordings, or return to the course; hosts can mark the class completed. This is separate from leaving a meeting and is not a provider-side forced hangup for all participants. External 8x8 fallback tabs remain on the provider's site after hangup and cannot be controlled by the app.

Class details expose cancel, complete, and delete actions to the host/admin. Live classes must be completed or cancelled before deletion; deletion cascades to attendance, class notes, and reminders. The UI requires confirmation. Other tutors cannot manage someone else's class. Tutors share the school's backend JaaS credentials, but each participant receives a room-scoped token with host permissions based on ownership.

Host/admin shared notes default to 24-hour availability in the UI, with 48 hours, seven days, custom local datetime, or no expiry. API reads omit expired notes immediately; the background delivery cycle also deletes expired rows. These are shared class notes; existing private lesson notes remain separate.

Personal reminders are persisted per class/user. Save/update/remove controls and the saved reminder time are shown on class details. While the API is running, a minute-based process creates in-app notifications with deterministic IDs, recovers pending reminders after restart, and skips closed/expired classes. The navbar polls unread Alerts each minute. These are not email/browser push reminders, and the server must stay running for timely delivery.

### Deployment requirement

This release adds `ClassNote` and `ClassReminder` tables. Before serving the updated API run:

```
npm run prisma:generate --workspace=echofreelance-api
npm run prisma:migrate --workspace=echofreelance-api
```

Build the API with the generated client and deploy frontend/API together. Do not run the development seed. Back up the production database first according to the existing deployment procedure. The migration is additive and does not delete existing data. It has not been applied to the client's production database by this agent.

Verification: frontend production build, backend compilation, and eleven live-class regression tests passed. Tests cover note expiry, unauthorized management, live-delete rejection, and idempotent reminder delivery. Actual production JaaS media, external fallback behavior, and reminder delivery with the migrated production database still need a real tutor/student acceptance session.
