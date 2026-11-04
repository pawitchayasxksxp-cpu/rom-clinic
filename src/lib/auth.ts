import "server-only";
import { betterAuth } from "better-auth";
import { getDatabase } from "./db";

export const AUTH_TABLES = [
  "rom_auth_user",
  "rom_auth_session",
  "rom_auth_account",
  "rom_auth_verification",
  "rom_auth_rate_limit",
] as const;

// Only the local setup script enables sign-up; HTTP handlers always leave it off.
export function createAuth({ allowSignUp = false } = {}) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error(
      "Set a random BETTER_AUTH_SECRET of at least 32 characters.",
    );
  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL;
  const baseURL =
    process.env.BETTER_AUTH_URL ||
    (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  return betterAuth({
    appName: "ROM Clinic",
    baseURL,
    secret,
    database: getDatabase(),
    trustedOrigins: [
      baseURL,
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ],
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      modelName: "rom_auth_user",
      additionalFields: {
        role: { type: "string", defaultValue: "user", input: false },
      },
    },
    session: {
      modelName: "rom_auth_session",
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
    },
    account: { modelName: "rom_auth_account" },
    verification: { modelName: "rom_auth_verification" },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rom_auth_rate_limit",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/change-password": { window: 60, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: "rom-clinic",
      useSecureCookies: process.env.NODE_ENV === "production",
      ipAddress: {
        ipAddressHeaders:
          process.env.VERCEL === "1"
            ? ["x-vercel-forwarded-for"]
            : ["x-forwarded-for", "x-real-ip"],
      },
    },
    logger: { disabled: true },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
