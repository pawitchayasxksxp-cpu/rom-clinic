import { loadEnvConfig } from "@next/env";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { getMigrations } from "better-auth/db/migration";

loadEnvConfig(process.cwd(), true);

async function main() {
  const { createAuth, AUTH_TABLES } = await import("../src/lib/auth");
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  try {
    const auth = createAuth({ allowSignUp: true });
    const migrations = await getMigrations(auth.options);
    const sql = await migrations.compileMigrations();
    const securitySql = AUTH_TABLES.map(
      (table) => `
      ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
      REVOKE ALL ON TABLE "${table}" FROM PUBLIC;
      DO $$ BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON TABLE "${table}" FROM anon; END IF;
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON TABLE "${table}" FROM authenticated; END IF;
      END $$;
    `,
    ).join("\n");
    if (sql.trim() && !existsSync("database/auth-schema.sql")) {
      mkdirSync("database", { recursive: true });
      writeFileSync(
        "database/auth-schema.sql",
        `-- Initial auth schema. Apply with npm run db:migrate.\nBEGIN;\n${sql}\n${securitySql}\nCOMMIT;\n`,
      );
    }
    const db = getDatabase();
    const client = await db.connect();
    try {
      // New auth tables and their access restrictions become visible together.
      await client.query("BEGIN");
      if (sql.trim()) await client.query(sql);
      await client.query(securitySql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    console.log("Admin authentication schema is ready (RLS enabled).");
    if (process.argv.includes("--migrate-only")) return;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 8)
      throw new Error("Missing admin setup credentials.");
    const existing = await db.query<{ role: string }>(
      'SELECT role FROM "rom_auth_user" WHERE email = $1',
      [email],
    );
    if (existing.rowCount) {
      if (existing.rows[0].role !== "admin")
        throw new Error("Existing account is not an admin.");
      console.log("Admin already exists; its password was preserved.");
      return;
    }
    const result = await createAuth({ allowSignUp: true }).api.signUpEmail({
      body: { email, password, name: "ผู้ดูแลระบบ" },
    });
    await db.query('UPDATE "rom_auth_user" SET role = $1 WHERE id = $2', [
      "admin",
      result.user.id,
    ]);
    console.log(
      "Admin created. Credentials are in local .env (ADMIN_EMAIL / ADMIN_PASSWORD).",
    );
  } finally {
    await closeDatabase();
  }
}

void main().catch(() => {
  console.error(
    "Admin setup failed. Check DB access and ADMIN_EMAIL / ADMIN_PASSWORD / BETTER_AUTH_SECRET.",
  );
  process.exitCode = 1;
});
