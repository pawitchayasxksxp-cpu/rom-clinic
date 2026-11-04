import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
loadEnvConfig(process.cwd(), true);
async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  try { await getDatabase().query(readFileSync("database/professional-schema.sql", "utf8")); console.log("Professional profile schema is ready (RLS enabled)."); }
  finally { await closeDatabase(); }
}
void main().catch(() => { console.error("Professional profile migration failed. Check database access and auth setup."); process.exitCode = 1; });
