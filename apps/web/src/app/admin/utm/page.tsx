import UtmDashboard from "@/components/utm/utm-dashboard";
import { getDashboardData } from "@/lib/utm/service";

export default async function AdminUtmPage() {
  const dashboard = await getDashboardData({
    mode: "aggregate",
    rangeDays: 30,
  });

  return (
    <main className="grid w-full gap-6">
      <UtmDashboard initialData={dashboard} />
    </main>
  );
}
