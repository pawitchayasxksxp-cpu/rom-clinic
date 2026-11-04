import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

function safeErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    for (const key of ["code", "http_code"] as const) {
      const value = (error as Record<string, unknown>)[key];
      if (typeof value === "number" || (typeof value === "string" && /^[A-Z0-9_]+$/.test(value))) {
        return String(value);
      }
    }
  }
  return "CHECK_CONFIGURATION_OR_NETWORK";
}

async function main() {
  // Each check runs even if the other service is unavailable.
  const results = await Promise.allSettled([
    (async () => {
      const { getDatabase, closeDatabase } = await import("../src/lib/db");
      try {
        const result = await getDatabase().query<{ ok: number }>("SELECT 1 AS ok");
        if (result.rows[0]?.ok !== 1) throw new Error("Unexpected PostgreSQL response.");
      } finally {
        await closeDatabase();
      }
    })(),
    (async () => {
      const { getCloudinary } = await import("../src/lib/cloudinary");
      const result = await getCloudinary().api.ping({ timeout: 10_000 });
      if (result.status !== "ok") throw new Error("Unexpected Cloudinary response.");
    })(),
  ]);

  results.forEach((result, index) => {
    const service = ["PostgreSQL", "Cloudinary"][index];
    if (result.status === "fulfilled") {
      console.log(`[OK] ${service} connected.`);
    } else {
      // SDK errors can contain URLs or request data; print only a safe code.
      console.error(`[FAIL] ${service}: ${safeErrorCode(result.reason)}`);
      process.exitCode = 1;
    }
  });
}

void main().catch(() => {
  console.error("Connection checks could not run. Check the environment configuration.");
  process.exitCode = 1;
});
