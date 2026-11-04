import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";

loadEnvConfig(process.cwd(), true);

async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  try {
    await getDatabase().query(readFileSync("database/patient-schema.sql", "utf8"));
    console.log("Patient schema is ready (RLS enabled).");
  } finally {
    await closeDatabase();
  }
}
void main().catch(() => {
  console.error("Patient migration failed. Check database access and configuration.");
  process.exitCode = 1;
});
