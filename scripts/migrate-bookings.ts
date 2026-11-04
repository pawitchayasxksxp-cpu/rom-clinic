import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";

loadEnvConfig(process.cwd(), true);

async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  try {
    await getDatabase().query(readFileSync("database/booking-schema.sql", "utf8"));
    console.log("Booking schema is ready (RLS enabled).");
  } finally {
    await closeDatabase();
  }
}
void main().catch(() => {
  console.error("Booking migration failed. Check database access and apply the patient migration first.");
  process.exitCode = 1;
});
