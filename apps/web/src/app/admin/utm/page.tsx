import UtmDashboard from "@/components/utm/utm-dashboard";
import { authClient } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/roles";
import { getDashboardData } from "@/lib/utm/service";
import { headers } from "next/headers";

export default async function AdminUtmPage() {
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

  const dashboard = await getDashboardData({
    mode: "aggregate",
    rangeDays: 30,
  });

  return (
    <main className="grid w-full gap-6">
      <UtmDashboard initialData={dashboard} userName={session.user.name} />
    </main>
  );
}
