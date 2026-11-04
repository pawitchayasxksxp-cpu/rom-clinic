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
| `/dashboard` | Today’s calendar booking statistics and confirmed appointments waiting for service, with department counts |
| `/registration` | Live search while typing, paginated patient directory backed by PostgreSQL |
| `/registration/[id]` | Protected patient details with an edit action, including contact, health data, and vital signs |
| `/registration/[id]/edit` | Prefilled patient edit form; saves to the same record and retains the HN |
| `/registration/new` | Hospital-style patient registration with validation and persistence |
| `/calendar` | Full-width month calendar with booking cards in each day, expandable details, department filter, and booking form |
| `/dispensing` | Patient-linked dispensing entry, live medication label preview, and 20 recent records |
| `/dispensing/[id]` | Saved medication label with print and reprint support |
| `/queues` | Queue management scaffold; calling/completing/cancelling is pending |
| `/history` | Daily treatment, dispensing, certificate and Body Chart activity |
| `/display` | Waiting room display scaffold, currently admin-only |
| `/settings` | Admin account details, password change, protected admin creation, and admin directory |

Run `npm run db:migrate:dispensing` after the patient migration to enable medication
labels. Staff supply all medication and instruction text. Labels persist with a
patient name/HN snapshot and creator; printing uses a 100 mm wide label with
automatic height. Select the printer/paper in the browser print dialog. This feature
does not prescribe medication or manage inventory.

Administrators can add another admin through Settings. Passwords use Better Auth
hashing; user and credential records are inserted atomically. Only authenticated
admins can create accounts. Public signup remains disabled.

Run `npm run db:migrate:bookings` after the patient migration to enable booking
storage in each environment. Calendar times use Asia/Bangkok. Bookings reference
registered patients selected from a searchable patient picker and prevent duplicate appointments for a patient at the
same time. Only administrators can view or create bookings. Booking registration
does not create a queue entry; status management and online self-booking are future work.

Dashboard waiting rows and statistics come from today’s calendar bookings in
Asia/Bangkok; cancelled/completed appointments are excluded from waiting. It
refreshes every 30 seconds while visible and on window focus. Creating a booking
invalidates both calendar and dashboard data.

Queue CRUD, numbering, urgent/FIFO sorting, and live display updates are future work. Placeholders use `—` rather than invented data.
Patient records are stored in `rom_patient`; queue tables and numbering remain future work.

Run `npm run db:migrate:patients` once before using the directory in each environment.
This additive migration creates the patient table with RLS and revokes public API
access. The application checks admin authorization when listing or saving patients.
Forms validate required fields, dates, phone, department, vital signs, and postal codes on the
server. New records receive an automatic HN (`HN-000001`, `HN-000002`, …) from a
database sequence, independently of patient row IDs. Reapply `npm run db:migrate:patients`
when upgrading to enable this default. Existing HNs are preserved. The server ignores
client-supplied HNs. Blood pressure (systolic/diastolic, mmHg) and pulse (beats/minute)
are optional registration measurements stored with the patient and shown in the directory.
Service category (Walk-in or course purchase) is chosen during registration and can
be updated directly from the directory; patient details reflect the saved category.
Directory search runs automatically while typing (300 ms debounce). The booking
form uses an authenticated patient lookup with name/HN/phone search and explicit
selection; raw HN entry is no longer needed.
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
`BETTER_AUTH_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 8 characters) in
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

## Service departments

Current services: general medicine (`GN`), musculoskeletal massage (`MS`),
sports massage and rehabilitation (`SP`), and Thai traditional medicine (`TM`).
After updating existing environments, rerun both `npm run db:migrate:patients`
and `npm run db:migrate:bookings` to accept the new codes. Historical dental,
emergency, and pediatric records retain their original labels.

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
npm run test:patient-edit
```

This validates inputs and exercises registration, persistence, search, automatic HN sequencing,
vital-sign persistence, and mobile layout with synthetic records. It
removes only the records created by that run. The configured bootstrap admin
credentials must match the current database password.

Calendar checks use the same local server/admin setup and clean up their synthetic
patient and booking records:

```sh
npm run test:calendar
```

Medication label and admin creation checks (same local server setup):

```sh
npm run test:dispensing-admin
npm run test:dashboard
```

The test creates synthetic patient/admin records, verifies label printing and new
admin login, and removes only those records. Print screenshots contain synthetic
data only and are saved in the ignored `test-results` directory.

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

## Clinical records, Body Chart, courses and Master Data

Run these explicit migrations after the existing patient/dispensing/auth migrations:

```sh
npm run db:migrate:clinical
npm run db:migrate:courses
npm run db:migrate:body-chart
npm run db:migrate:professional
npm run db:migrate:master-data
```

Patient rows provide certificate and Body Chart links. Clinical history combines
per-visit records, dispensing, certificates and Body Charts with pagination.
Certificates retain the patient identity at creation and provide a blank signature
line for the examining professional; the application does not sign them.
Body Chart uses the supplied four-view reference image, with numbered points and
notes stored per patient. Both document views support printing/PDF.

Master Data has course, admin and medicine tabs, with editing, deletion and optional
JPG/PNG/WebP photos (5 MB maximum). Uploaded photos use authenticated Cloudinary
delivery. Course/medicine deletion removes them from current choices while
retaining prior references. Admin removal revokes access and sessions while
retaining clinical audit references. The active account and final admin cannot
be removed. Medicine stock is maintained in Master Data; dispensing does not
automatically deduct inventory in this version.

Professional profiles include a name, profession, license number and optional
issue/expiry dates. These are stored profile data, not license verification.
Password minimum is 8 characters, with visibility toggles on password fields.
Other choices expose a required notes field; notes persist in patient details and
medication labels. New patient forms show the current/next HN without reserving it.

Every authenticated page has PDF, Excel and print controls. PDF uses the browser
print dialog (choose Save as PDF); Excel exports persisted, authorized data and
never includes passwords, password hashes, sessions or connection secrets.
Exports cap reports at 10,000 rows and request a narrower filter above that limit.
The dispensing page can save a label and immediately open the print dialog.

Supplied clinic logo: `public/clinic-logo.jpg`. Body reference: `public/body-chart.png`.

## Uploads and exports

Apply `npm run db:migrate:master-data` after courses/professional/auth migrations.
Master Data has course/admin/medicine tabs; images are optional and restricted
to actual JPG/PNG/WebP files up to 5 MB. Existing photos remain when no replacement
is selected. Admin editing supports optional password reset (8+ characters),
and email/password changes revoke the affected account's sessions.

Excel export is generated server-side with ExcelJS using explicit column lists.
Each route maps to its saved data; individual patient export includes separate
patient, treatment, dispensing, certificate and Body Chart sheets.

Run `npm run test:clinic-workflows` with the local dev server available on port
3000. The integration test uses synthetic records and a generated small image,
checks real authenticated uploads, downloads and reads Excel, prints PDFs, and
removes only its own records and uploaded assets. Test artifacts are ignored.

Dispensing selects active medicines from Master Data and copies their name, form,
and unit into the saved label. Apply `npm run db:migrate:dispensing-stock` after
the dispensing and Master Data migrations. Existing labels remain readable and
do not affect inventory. New saves deduct stock atomically; retries of the same
record do not deduct again. Reprinting does not change stock.
Body Chart records have an edit button that updates the existing chart.

Additional checks: `node --conditions=react-server --import tsx scripts/test-dispensing-stock.ts`
and `node --conditions=react-server --import tsx scripts/test-body-chart-edit.ts`
(the latter requires the local server on port 3000).

Apply `npm run db:migrate:patient-delete` before deploying patient deletion.
Deletion removes patients from active lists, pickers and appointments while retaining
clinical records and stock movements. The original HN remains reserved.
Repeat visits have fresh vital-sign fields in the treatment form and retain each
measurement in dated treatment history. Registration measurements remain separate.
Check both flows with `node --conditions=react-server --import tsx scripts/test-patient-delete-vitals.ts`.

## Billing and purchased courses

Apply `npm run db:migrate:billing` after the existing patient, clinical, course,
Master Data and dispensing-stock migrations. It adds session counts/optional
validity to course definitions and private payment, purchased-course and usage tables.
Existing course selections do not create historical sales or prepaid balances.

Use **ชำระเงิน** or the patient's **ชำระเงิน / ซื้อคอร์ส** button. Add service
charges, courses and unbilled dispensing records. Payment supports cash/change,
verified bank transfer, fixed amount discounts with a reason, immutable receipt
snapshots, printing/PDF and Excel. Daily totals use Bangkok receipt dates.
Dispensing prices are snapshotted on new labels; older labels use the current
medicine price until their first payment is saved. Paying never deducts stock again.

Paid courses keep their purchased name, price, session count and optional expiry,
independent of later Master Data edits. Choose a purchased course while recording
a treatment to use one session atomically, or link an existing untreated course
usage from the patient's course panel. A treatment can use at most one course
session. Retries are idempotent; expired/exhausted courses cannot be used.

Run `node --import tsx --test tests/unit/*.test.ts` and, with the local server on
port 3000, `node --conditions=react-server --import tsx scripts/test-billing.ts`.
The integration test uses and removes only synthetic fixtures; it checks actual
payment/receipt/Excel/print flows and concurrent usage from separate processes.
Receipt numbers may have gaps; they are never reset by tests.
