import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
export const instant = false;
export default async function Home() {
  redirect((await getAdminSession()) ? "/dashboard" : "/login");
}
