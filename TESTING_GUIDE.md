# StudySync Release Verification Guide

Use this guide before every release. Run the automated release gate first, then complete the manual UI checklist.

Automated tests use temporary SQLite databases. They do not modify `server/data/studysync.db`.

## 1. Start The Application

Double-click `Start StudySync.cmd`, or run:

```powershell
npm.cmd run dev
```

Expected startup output:

```text
[API] StudySync API running at http://localhost:3001
[WEB] Local: http://localhost:3000/
```

Open `http://localhost:3000`.

Health check:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Expected output:

```text
ok database
-- --------
True sqlite
```

## 2. Run The Complete Automated Release Gate

```powershell
npm.cmd run release:check
```

Expected result:

- TypeScript finishes without errors.
- ESLint finishes without errors.
- All 15 API/integration tests pass.
- Vite prints `built in ...`.
- Performance budgets pass.
- npm audit prints `found 0 vulnerabilities`.
- Command exits successfully.

Expected test names:

```text
secure authentication lifecycle works
login endpoint rate limits repeated failures
logout-all revokes every active session for the user
API requires authentication and derives profile user from session
match, conversation, group, session, and attendance access enforce membership
liveness, readiness, request IDs, and centralized errors work
PostgreSQL migrations apply once and create the required schema
staging and backup operations are explicitly configured
production starts with registered users only, removes simulated payments, and delivers reset links
request validation rejects malformed input before state changes
workflow integrity rejects duplicate and invalid state transitions
complete workflow restores from backend after a new login
collaborative schema has required membership tables, foreign keys, and indexes
```

Any `fail`, TypeScript error, ESLint error, build error, or reported high-severity vulnerability blocks release.

## 3. Test Commands Individually

| Area | Command | Expected output |
|---|---|---|
| TypeScript and ESLint | `npm.cmd run lint` | Exits successfully with no errors |
| All integration tests | `npm.cmd run test` | `tests 15`, `pass 15`, `fail 0` |
| Workflow E2E only | `npm.cmd run test:e2e` | `tests 2`, `pass 2`, `fail 0` |
| Browser E2E and WCAG | `npm.cmd run test:browser` | `8 passed` |
| WCAG A/AA only | `npm.cmd run test:a11y` | `2 passed` |
| Build and bundle budgets | `npm.cmd run test:performance` | Prints bundle sizes and exits successfully |
| Production build | `npm.cmd run build` | Vite prints generated `dist` assets and `built in ...` |
| Dependency security | `npm.cmd run audit` | `found 0 vulnerabilities` |

## 4. Manual Authentication Checklist

Use a new email address for each registration test to avoid duplicate-account errors.

### Registration And Secure Session

1. Open the landing page and click the profile/login button.
2. Switch to **Sign up**.
3. Register with a valid email and a password containing at least 8 characters.

Expected:

- Registration succeeds and opens the dashboard.
- A profile avatar appears at the top-right.
- Refreshing the browser keeps the user logged in.
- Browser DevTools, Application, Cookies contains `studysync_session`.
- The cookie is `HttpOnly` and `SameSite=Strict`.
- The password and session token do not appear in Local Storage.

Failure:

- Plain password or session token appears in Local Storage.
- Refreshing immediately loses the session.
- The session cookie is readable from browser JavaScript.

### Password Validation

Try registering with a password shorter than 8 characters.

Expected:

```text
Password must be at least 8 characters
```

Try registering again with an existing email.

Expected:

```text
An account with this email already exists.
```

### Logout And Revocation

1. Log in.
2. Open the profile menu.
3. Click **Log out**.
4. Try opening `http://localhost:3000/dashboard`.

Expected:

- The user returns to the public/authentication page.
- The dashboard cannot be opened without logging in again.

`logout-all`, session expiry, and reset-triggered session revocation are verified automatically by `server/tests/auth.integration.test.ts`.

### Password Reset

1. Open the login form.
2. Click **Forgot password?**
3. Enter an existing development account email and submit.
4. In development, the reset token is filled into the form.
5. Enter a new password and submit.
6. Try logging in with both passwords.

Expected:

- The reset request shows:

```text
If the account exists, password reset instructions have been created.
```

- The old password fails with `Incorrect email or password.`
- The new password succeeds.
- Existing sessions for that user are revoked.

Production does not return the token in the response. Production reset delivery is verified by `server/tests/production-safety.integration.test.ts`.

### Login Rate Limiting

Run the automated auth tests:

```powershell
node --import tsx --test server/tests/auth.integration.test.ts
```

Expected:

- Five incorrect attempts return `401`.
- The next attempt returns `429`.
- The response includes a `Retry-After` header.

Do not repeatedly test this through your normal development login because the in-memory limit remains active until its time window expires or the API restarts.

## 5. Manual Complete User Workflow

Complete this once using a newly registered account.

1. Register.
2. Complete the study profile.
3. Define group requirements.
4. Generate matches.
5. Accept a match.
6. Open chat and send a message.
7. Accept the group goal or create a group.
8. Open scheduling and select a suggested slot.
9. Confirm the selected slot.
10. Open the session and mark attendance.
11. Complete the session and open accountability/progress.
12. Log out, log back in, and open the dashboard.

Expected:

- Matches are generated from backend profiles.
- Chat message appears after sending.
- Group members contain real backend users, not fake client names.
- The confirmed session uses the exact selected date and time.
- Marking attendance completes the session.
- Accountability and progress pages show backend-derived data.
- After logging back in, profile, accepted match, group, session history, and accountability state are restored.

The same flow is verified automatically by:

```powershell
npm.cmd run test:e2e
```

## 6. API Authentication And Authorization

### Unauthenticated Requests

With the API running, execute:

```powershell
try {
  Invoke-RestMethod http://localhost:3001/api/workflow
} catch {
  [int]$_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}
```

Expected:

```text
401
{"error":"Authentication required."}
```

Also verify removed endpoints:

```powershell
$paths = '/api/export/xlsx', '/api/import/xlsx', '/api/metrics'
foreach ($path in $paths) {
  try {
    Invoke-WebRequest "http://localhost:3001$path" -UseBasicParsing
  } catch {
    "$path -> $([int]$_.Exception.Response.StatusCode)"
  }
}
```

Expected:

```text
/api/export/xlsx -> 401
/api/import/xlsx -> 401
/api/metrics -> 401
```

After authentication, those removed routes return `404`. This is verified automatically by the authorization integration test.

### Membership And Ownership

The authorization integration test creates an owner, group member, and outsider, then proves:

| Action | Member/owner expected | Outsider expected |
|---|---:|---:|
| Accept another user's match | Owner: `200` | `404` |
| Read conversation | Member: `200` | `403` |
| Send chat message | Member: `201` | `403` |
| Generate group schedule | Member: `200` | `403` |
| Read group sessions | Member: `200` | `403` |
| Mark attendance | Member: `201` | `403` |
| Use removed payment endpoint | Authenticated users: `404` | `404` |

Run it directly:

```powershell
node --import tsx --test server/tests/authorization.integration.test.ts
```

Expected: both tests pass and `fail 0`.

## 7. Collaborative Database Verification

Run:

```powershell
npm.cmd run test:e2e
```

Expected database checks:

- Tables exist: `group_members`, `match_candidates`, `conversation_members`, `auth_sessions`.
- `group_members` has user and group foreign keys.
- Required membership indexes exist.
- `PRAGMA foreign_key_check` returns no violations.
- Client-supplied fake member names and fake study goals do not override backend group data.

Expected terminal result:

```text
collaborative schema has required membership tables, foreign keys, and indexes
pass 2
fail 0
```

## 8. Production Safety Verification

Run:

```powershell
node --import tsx --test server/tests/production-safety.integration.test.ts
```

Expected:

- Production starts with zero users until someone registers.
- Session cookie contains `Secure`.
- Removed `/api/payment/simulate` returns `404` for an authenticated user.
- Password-reset response does not expose `resetToken`.
- Configured reset-delivery webhook receives the email and reset URL.
- Test prints `pass 1` and `fail 0`.

For a real production deployment, configure:

```text
APP_URL
STUDYSYNC_DB_PATH
PASSWORD_RESET_DELIVERY_URL
PASSWORD_RESET_DELIVERY_TOKEN
```

## 9. PostgreSQL Staging, Migration, And Backup Verification

The application API currently remains SQLite-backed. These commands verify the PostgreSQL staging schema and operational migration path while the runtime persistence adapter is migrated.

With Docker available, start PostgreSQL and run every migration/schema/workflow check:

```powershell
docker compose --env-file .env.staging -f docker-compose.staging.yml up postgres db-migrate
```

Expected:

- PostgreSQL becomes healthy.
- Migrations apply once and safely skip when rerun.
- Schema check reports `postgres_schema_valid`.
- Transactional relationship check reports `postgres_workflow_valid`.

With PostgreSQL client tools installed, verify a real backup and restore against a disposable staging database:

```powershell
npm.cmd run db:pg:backup
npm.cmd run db:pg:restore -- backups\studysync-example.dump --confirm-restore
npm.cmd run db:pg:check
```

Expected: backup and restore commands exit successfully, then schema validation passes. Never run the restore command against production without a reviewed recovery plan.

## 10. Removed Feature Verification

Inspect these pages:

- Pricing/subscription
- Active session
- Progress insights
- Product overview

Expected:

- Subscription UI states that subscriptions are unavailable and cannot activate paid access.
- Active sessions contain attendance and coordination tools, with no audio/video call controls.
- Matching and guidance make no generative-AI claims and guidance is derived from saved activity.
- Removed `/api/payment/*` and `/api/ai/*` endpoints return `404` after authentication.
- No fake Google or phone authentication buttons appear.
- No hardcoded session date appears when no session exists.

## 11. Accessibility And Performance Verification

Run:

```powershell
npm.cmd run test:browser
npm.cmd run test:performance
```

Expected:

- All eight Chromium tests pass.
- Axe reports no WCAG A/AA violations on public and authenticated flows.
- Registration through completed attendance passes in a real browser.
- Back navigation restores the previous page at the top.
- JavaScript and CSS raw/gzip bundles remain below configured budgets.

## 12. GitHub Actions CI

Push a branch or open a pull request targeting `main`.

Expected GitHub Actions jobs:

```text
release-gates
postgres-migrations
browser-e2e
```

Expected steps:

```text
npm ci
npm run release:check
npm run db:pg:migrate
npm run db:pg:check
npm run db:pg:workflow-check
pg_dump and pg_restore verification
npm run test:browser
```

All three jobs must display a green check before release.

## Release Decision

Release only when:

- `npm.cmd run release:check` exits successfully.
- `npm.cmd run test:browser` exits successfully.
- The manual authentication checklist passes.
- The complete manual user workflow passes.
- Production environment variables are configured.
- GitHub Actions `release-gates`, `postgres-migrations`, and `browser-e2e` are green.
