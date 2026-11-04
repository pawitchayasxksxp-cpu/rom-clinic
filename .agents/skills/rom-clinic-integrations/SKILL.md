---
name: rom-clinic-integrations
description: Configure and troubleshoot ROM Clinic's PostgreSQL and Cloudinary connections, check local environment setup, and prepare its existing Next.js app for Vercel. Use for this repository's database/storage integration work and deployment configuration.
---

# ROM Clinic integrations

Work from the repository root, regardless of its current drive or checkout path.
Read `README.md`, `.env.example`, and the relevant implementation before changing
configuration. For business requirements, consult `BRD/brd.md` only when needed.

## Existing structure

- `src/lib/env.ts`: validates credential-bearing connection URLs without including
  their values in error messages.
- `src/lib/db.ts`: lazy shared `pg` pool, TLS certificate verification, one
  connection per instance, and Vercel `attachDatabasePool` integration.
- `src/lib/cloudinary.ts`: `getCloudinary()` and `uploadFile(Buffer)`; uploads use
  authenticated delivery, automatic resource type detection, and no overwrite.
- `scripts/check-connections.ts`: loads Next.js env files and independently checks
  PostgreSQL with `SELECT 1` and Cloudinary with an authenticated Admin API ping.
- `certs/supabase-ca.crt`: public Supabase root CA. `next.config.ts` includes it in
  server function traces.
- `.nvmrc` and `package.json`: Node.js 24. `vercel.json`: Next.js, Tokyo (`hnd1`).

Reuse these modules. Keep credential-bearing database/storage code server-only
and on the Node.js runtime. Use parameterized SQL; release checked-out clients
in `finally`. Do not close the shared pool after each web request.

## Environment

The root `.env` holds local credentials and is ignored by Git. `.env.example`
contains placeholders and can be committed. Preserve an existing `.env`; update
only the requested variables. Do not print its contents, log SDK configuration,
or copy actual credentials into code, documentation, skills, or commit messages.

Required: `DATABASE_URL` and `CLOUDINARY_URL`.

Admin authentication also requires `BETTER_AUTH_SECRET` (random, 32+ characters)
and a matching `BETTER_AUTH_URL`. On Vercel use the deployed origin, never the
local development URL. Keep the secret stable across deployments.

`ADMIN_EMAIL` / `ADMIN_PASSWORD` are local bootstrap values used only by
`npm run setup:admin`. Existing admin passwords are preserved on rerun; the
running application authenticates against PostgreSQL, not these env values.
`npm run db:migrate` applies auth migrations without seeding. Neither command
belongs in the build or request path. Auth tables are prefixed `rom_auth_*`,
with RLS enabled and public/Supabase API roles denied access.

`src/lib/auth.ts` configures Better Auth; public signup is disabled.
`src/lib/session.ts` exports `requireAdmin()`: call it in every private page
and future protected action/data service. Do not rely solely on layout checks
or cookie presence. Keep DB session validation and database-backed rate limiting.
The registration/queue/history/display pages are currently scaffolds; do not
present their placeholders as persisted business data or completed BRD features.

Optional:

- `CLOUDINARY_FOLDER`: defaults to `rom-clinic`.
- `DATABASE_SSL_CA_PATH`: custom certificate path. Leave unset for the bundled
  Supabase pooler CA.

Keep credentials free of the `NEXT_PUBLIC_` prefix. Environment values on Vercel
must be configured separately; the local ignored `.env` does not deploy.

## Connection workflow

Install dependencies with `npm ci` when needed, then run:

```sh
npm run check:connections
```

Both service checks must report `[OK]` to claim that both connections passed.
A previous successful check is not evidence that a new environment works.
The checker does not create tables, modify records, or upload files. A Cloudinary
ping establishes authentication/connectivity; it does not test an actual upload.
Run an upload smoke test only when relevant to the request, using synthetic data
and cleaning up only the asset created by that test.

For PostgreSQL TLS failures, inspect CA configuration and certificate validity;
do not disable certificate verification. Keep `sslmode`, `sslcert`, `sslkey`, and
`sslrootcert` out of the URL because the current helper explicitly manages TLS.
Use the supplied session-pooler URL on port 5432 unless a change is requested.
If switching to transaction pooling, obtain the exact connection string from
Supabase and account for its session-state/prepared-statement limitations.

For connection failures, report the affected service and safe error code. Inspect
environment presence, certificate configuration, network reachability, or service
credentials as appropriate; avoid exposing full SDK errors containing secrets.

## Vercel preparation

Use the README's deployment instructions. Preserve the bundled certificate and
file tracing configuration; custom local absolute CA paths will not exist on
Vercel. Keep secrets out of `vercel.json`. The user currently handles deployment;
configuration work alone does not authorize publishing or changing remote secrets.

After code/configuration changes, run the relevant checks:

```sh
npm run lint
npm run typecheck
npm run build
```

Check `git diff --check` and confirm `.env` remains ignored with
`git check-ignore .env`. Report local connection/build results separately from
verification of an actual Vercel deployment. Do not create business tables or
apply migrations solely to check connectivity.
