# StudySync

StudySync is a full-stack study coordination application with compatibility-based partner matching, group setup, scheduling, attendance, accountability, progress analytics, and data-derived guidance.

## Prerequisites

- Node.js 24 or newer, because the API uses Node's built-in SQLite module.
- npm

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the frontend and SQLite-backed Express API together:

```powershell
npm run dev
```

Open `http://localhost:3000`. The API runs at `http://localhost:3001` and Vite proxies `/api` requests to it.

For separate terminals, use `npm run server` and `npm run client`.

## Data And Production Behavior

- SQLite database: `server/data/studysync.db`
- PostgreSQL staging foundation: versioned migrations in `server/postgres/migrations`, staging Compose configuration, and backup/restore commands
- Users and matching candidates: registered accounts with completed profiles only
- Authentication: expiring, revocable, server-side sessions in secure HttpOnly cookies
- Passwords: Argon2id hashes
- Collaborative data: user-ID membership tables with foreign keys and transactions
- Frontend workflow state: restored from the authenticated backend workflow endpoint
- Matching and guidance: deterministic, data-derived workflows with no generative-AI claims
- Payments and subscriptions: unavailable until a production billing and refund workflow is connected; simulated payment APIs were removed
- Live audio/video: not offered; session pages provide attendance and coordination only
- Password reset: tokens are returned only outside production; production requires `APP_URL` and `PASSWORD_RESET_DELIVERY_URL`
- Demo accounts and dummy groups: not seeded; known legacy seed accounts are removed by migration

The current API runtime remains SQLite-backed while the persistence adapter is migrated. PostgreSQL staging migrations are independently verified in CI; do not point the current API process at `DATABASE_URL` and assume it has switched databases.

## PostgreSQL Staging Operations

Create `.env.staging` from `.env.staging.example`, set a strong password, then run migrations:

```powershell
docker compose --env-file .env.staging -f docker-compose.staging.yml up postgres db-migrate
```

With PostgreSQL client tools installed:

```powershell
npm run db:pg:migrate
npm run db:pg:check
npm run db:pg:workflow-check
npm run db:pg:backup
npm run db:pg:restore -- backups\studysync-example.dump --confirm-restore
```

Restores intentionally require the `--confirm-restore` flag.

## Verification

```powershell
npm run lint
npm run test
npm run test:browser
npm run test:a11y
npm run test:performance
npm run release:check
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for the complete manual and automated release checklist, including expected outputs.
