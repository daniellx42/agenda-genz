import { authClient } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session) redirect("/");

  if (!isAdminRole(session.user.role)) redirect("/");

  redirect("/admin/utm");
}