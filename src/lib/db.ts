import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { getConnectionUrl } from "./env";

const globalForDatabase = globalThis as typeof globalThis & {
  clinicDatabasePool?: Pool;
};

export function getDatabase(): Pool {
  if (!globalForDatabase.clinicDatabasePool) {
    const connectionUrl = getConnectionUrl("DATABASE_URL");

    // Keep certificate validation under our control; pg URL SSL options override it.
    for (const option of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
      if (connectionUrl.searchParams.has(option)) {
        throw new Error(
          `Remove ${option} from DATABASE_URL; use DATABASE_SSL_CA_PATH for a custom CA.`,
        );
      }
    }

    const caPath =
      process.env.DATABASE_SSL_CA_PATH?.trim() ||
      (connectionUrl.hostname.endsWith(".pooler.supabase.com")
        ? join(process.cwd(), "certs", "supabase-ca.crt")
        : undefined);
    const pool = new Pool({
      connectionString: connectionUrl.toString(),
      ssl: {
        rejectUnauthorized: true,
        ...(caPath ? { ca: readFileSync(caPath, "utf8") } : {}),
      },
      max: 1,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 5_000,
      query_timeout: 10_000,
      statement_timeout: 10_000,
      allowExitOnIdle: true,
      application_name: "rom-clinic",
    });

    // Idle client failures must not crash the application or log credentials.
    pool.on("error", () =>
      console.error("An idle PostgreSQL connection failed."),
    );
    if (process.env.VERCEL === "1") {
      attachDatabasePool(pool);
    }
    globalForDatabase.clinicDatabasePool = pool;
  }

  return globalForDatabase.clinicDatabasePool;
}

export async function closeDatabase(): Promise<void> {
  const pool = globalForDatabase.clinicDatabasePool;
  globalForDatabase.clinicDatabasePool = undefined;
  await pool?.end();
}
