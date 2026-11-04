import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/session";
export const instant = false;
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <AdminShell user={{ name: user.name, email: user.email }}>
      {children}
    </AdminShell>
  );
}
