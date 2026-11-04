import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
loadEnvConfig(process.cwd(), true);
async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  try { await getDatabase().query(readFileSync("database/body-chart-schema.sql", "utf8")); console.log("Body chart schema is ready (RLS enabled)."); }
  finally { await closeDatabase(); }
}
void main().catch(() => { console.error("Body chart migration failed. Check database access and the patient migration."); process.exitCode = 1; });
