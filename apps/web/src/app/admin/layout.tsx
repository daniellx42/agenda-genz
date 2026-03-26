import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminSession();

  return <AdminShell userName={session.user.name}>{children}</AdminShell>;
}
