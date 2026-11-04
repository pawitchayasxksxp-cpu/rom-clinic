# ROM Clinic

Next.js application using TypeScript, App Router, Tailwind CSS, and ESLint.

Repository skill: [rom-clinic-integrations](.agents/skills/rom-clinic-integrations/SKILL.md)
documents the workflow for environment setup, connection checks, and Vercel preparation.

## Requirements

Node.js 24.x and npm (matching the Vercel runtime).

## Development

```sh
npm ci
npm run check:connections
npm run setup:admin
npm run dev
```

Open http://localhost:3000/login. The root page redirects to login or the dashboard.

## Admin login and application shell

The application follows `BRD/brd.md` with Thai desktop/tablet/mobile layouts:

| Route | Current behavior |
| --- | --- |
| `/login` | Working admin email/password login |
| `/dashboard` | Overview shell, department cards, and queue/statistics placeholders |
| `/registration` | Searchable, paginated patient directory backed by PostgreSQL |
| `/registration/new` | Hospital-style patient registration with validation and persistence |
| `/queues` | Queue management scaffold; calling/completing/cancelling is pending |
| `/history` | Daily history scaffold |
| `/display` | Waiting room display scaffold, currently admin-only |
| `/settings` | Admin account details and working password change |

Queue CRUD, numbering, urgent/FIFO sorting, statistics, daily rollover, and live
display updates are future work. Placeholders use `—` rather than invented data.
Patient records are stored in `rom_patient`; queue tables and numbering remain future work.

Run `npm run db:migrate:patients` once before using the directory in each environment.
This additive migration creates the patient table with RLS and revokes public API
access. The application checks admin authorization when listing or saving patients.
Forms validate required fields, dates, phone, department, HN, and postal codes on the
server. New records receive a unique HN; an existing HN cannot be registered twice.
Repeated submission of the same form is idempotent. Registration does not issue a queue number.

Authentication uses Better Auth with PostgreSQL-backed sessions, password hashing,
HTTP-only cookies, and a database rate limiter (5 login attempts/minute per IP).
Public sign-up is disabled. Each private page uses `requireAdmin()` and verifies
the current user's database role. Future data services, actions, and API endpoints
must perform their own authorization checks through `src/lib/session.ts`.
Sessions expire after 8 hours; logout revokes the session in the database. Cookies
are Secure in production. Password changes require the current password and revoke
other sessions. There is no email recovery service in this phase.

Set `BETTER_AUTH_SECRET` (a random secret of at least 32 characters),
`BETTER_AUTH_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 12 characters) in
the root `.env` before running `npm run setup:admin`. The local checkout already
has generated credentials in `.env`; read `ADMIN_EMAIL` / `ADMIN_PASSWORD` there.
Never commit these values. The setup command creates only the prefixed
`rom_auth_*` tables, applies RLS and revokes Supabase public API role access, then
creates the initial admin. Rerunning preserves an existing admin's password.
After changing a password through Settings, the bootstrap password in `.env`
does not change the database password or reset the account.

Run `npm run db:migrate` to apply auth schema changes without creating an admin.
`database/auth-schema.sql` records the initial schema; the script derives updates
from the installed auth configuration and applies them together with RLS in a
transaction. Run setup/migrations as an explicit maintenance step, never as part
of a request or Vercel build. The current Supabase database is already initialized.

## Environment and integrations

Create a root `.env` using `.env.example`, then set `DATABASE_URL` and
`CLOUDINARY_URL`. The local `.env` contains real credentials and is ignored by Git;
only the placeholder template is committed. These variables must stay server-only.
Deployment environments must supply the same variables through their secrets settings.

- `src/lib/env.ts`: connection URL validation without logging credentials.
- `src/lib/db.ts`: reusable PostgreSQL pool for the Supabase session pooler over TLS.
  The Supabase CA is bundled and certificates are verified; set
  `DATABASE_SSL_CA_PATH` only if a custom CA override is required.
  Keep SSL query parameters out of `DATABASE_URL`.
  Each instance opens at most one connection; Vercel's `attachDatabasePool`
  manages idle connections before Fluid Compute suspends an instance.
- `src/lib/cloudinary.ts`: configured SDK and `uploadFile(Buffer)` helper.
  Uploads use authenticated delivery under `CLOUDINARY_FOLDER` (default `rom-clinic`).
  Store the returned `public_id`, `resource_type`, and `type` with your file metadata;
  authorize access and generate signed delivery URLs on the server when needed.
- `scripts/check-connections.ts`: loads Next.js environment files and runs
  `SELECT 1` and a Cloudinary authenticated ping. It does not create database tables
  or upload files and exits unsuccessfully if either connection fails.

Use these modules only from Node.js Server Components, Route Handlers, or server
services. They are protected by `server-only`; do not import them into client code.
Database calls should use parameters, for example:

```ts
import { getDatabase } from "@/lib/db";

const result = await getDatabase().query("SELECT $1::text AS value", ["example"]);
```

Before exposing an upload endpoint, add authentication, authorization, and file
size/type validation. The storage helper itself is internal server code.

Integration references: [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables),
[node-postgres TLS](https://node-postgres.com/features/ssl), and
[Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration).

## Vercel deployment

Import the repository as a Next.js project, with the repository root as Root
Directory. Use `npm ci` for installation and `npm run build` for the build;
leave Output Directory at its framework default. `package.json` pins Node.js
24.x. `vercel.json` selects Tokyo (`hnd1`) to match the supplied Supabase endpoint.

Set the following in Vercel Project Settings → Environment Variables:

| Variable | Value | Required |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string from local `.env` | Yes |
| `CLOUDINARY_URL` | Cloudinary connection string from local `.env` | Yes |
| `BETTER_AUTH_SECRET` | Same random secret as local `.env` for this environment | Yes |
| `BETTER_AUTH_URL` | Exact app origin, e.g. `https://your-clinic.vercel.app` | Yes |
| `CLOUDINARY_FOLDER` | `rom-clinic` | Optional |
| `DATABASE_SSL_CA_PATH` | Leave unset to use the bundled Supabase CA | Optional |

Select Production and any Preview/Development environments that should have
access, then redeploy after changing variables. Use separate database/storage
credentials for Preview if it must not access production data. Do not add
`NEXT_PUBLIC_` to credential names. Vercel does not receive the ignored local `.env`.
`ADMIN_EMAIL` and `ADMIN_PASSWORD` are only for the local setup command and are
not required by the deployed login service. Use the database account created by
setup. Keep `BETTER_AUTH_SECRET` stable across deployments. For a custom domain,
update `BETTER_AUTH_URL` to that exact origin. Preview environments need their
own matching URL; when unset on Vercel the code can use its injected deployment
hostname. Never copy `http://localhost:3000` into a deployed environment.

The current session-pooler URL on port 5432 has been tested. For higher serverless
traffic, Supabase also provides transaction pooling on port 6543; obtain that
exact URL from Supabase's Connect dialog before switching. Queries here use no
named prepared statements. Build does not require a live database connection.

`next.config.ts` includes the public `certs/supabase-ca.crt` in server function
traces. This certificate was downloaded over HTTPS from
`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`;
it expires on 26 April 2031. Replace it if Supabase rotates the authority.
Database/storage code requires the Node.js runtime; do not use Edge Runtime.

Local validation before deploying:

```sh
npm run check:connections
npm run lint
npm run typecheck
npm run build
```

Patient registration checks (Chrome installed, local `npm run dev` running on port 3000):

```sh
npm run test:patients
```

This validates inputs and exercises registration, persistence, search, duplicate HN
rejection, automatic HN generation, and mobile layout with synthetic records. It
removes only the records created by that run. The configured bootstrap admin
credentials must match the current database password.

Browser regression tests (Chrome installed locally):

```sh
npm run test:e2e
```

These tests use the configured database/admin and launch a local server on port
3131. They exercise login, route protection, cookie forgery/replay, logout,
navigation, mobile layout, signup restrictions, CSRF protection, and rate limiting.
Use a separate configured test database when running against shared environments.
Traces and videos are disabled; screenshots are taken only before credential entry
or after login, and test output is ignored by Git.

Authentication reference: [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next).

See [Vercel connection pooling](https://vercel.com/kb/guide/connection-pooling-with-functions)
and [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Checks and production

```sh
npm run lint
npm run build
npm start
```
