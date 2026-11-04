import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
loadEnvConfig(process.cwd(), true);
async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  try { await getDatabase().query(readFileSync("database/patient-delete-schema.sql", "utf8")); console.log("Patient deletion schema is ready (RLS enabled)."); }
  finally { await closeDatabase(); }
}
void main().catch(() => { console.error("Patient deletion migration failed. Check database access and prior migrations."); process.exitCode = 1; });
