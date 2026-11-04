import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
loadEnvConfig(process.cwd(), true);
async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  try { await getDatabase().query(readFileSync("database/course-schema.sql", "utf8")); console.log("Course schema is ready (RLS enabled)."); }
  finally { await closeDatabase(); }
}
void main().catch(() => { console.error("Course migration failed. Check database access and the patient migration."); process.exitCode = 1; });
