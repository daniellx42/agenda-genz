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

  if (!session) {
    return (
      <main className="grid w-full gap-6">
        <p>Usuário não autenticado.</p>
      </main>
    );
  }

  if (!isAdminRole(session.user.role)) {
    return (
      <main className="grid w-full gap-6">
        <p>Acesso negado.</p>
      </main>
    );
  }

  redirect("/admin/utm");
}