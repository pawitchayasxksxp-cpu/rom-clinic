-- Initial auth schema. Apply with npm run db:migrate.
BEGIN;
create table "rom_auth_user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null, "role" text not null);

create table "rom_auth_session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "rom_auth_user" ("id") on delete cascade);

create table "rom_auth_account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "rom_auth_user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "rom_auth_verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table "rom_auth_rate_limit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null);

create index "rom_auth_session_userId_idx" on "rom_auth_session" ("userId");

create index "rom_auth_account_userId_idx" on "rom_auth_account" ("userId");

create index "rom_auth_verification_identifier_idx" on "rom_auth_verification" ("identifier");

-- Authentication data is available only through the server database connection.
DO $$
DECLARE auth_table text; api_role text;
BEGIN
  FOREACH auth_table IN ARRAY ARRAY['rom_auth_user', 'rom_auth_session', 'rom_auth_account', 'rom_auth_verification', 'rom_auth_rate_limit'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', auth_table);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC', auth_table);
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', auth_table, api_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
