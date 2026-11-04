import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

export const getAdminSession = cache(async () => {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  });
  return session?.user.role === "admin" ? session : null;
});

// Call in each page and future data services/actions, not only in the layout.
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return session.user;
}
