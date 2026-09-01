import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import MetricsDashboard from "@/components/admin/MetricsDashboard";
import { getMetricsDashboard, type Period, PERIOD_DAYS } from "@/lib/social/metrics-dashboard";

export const dynamic = "force-dynamic";

function parsePeriod(value: string | undefined): Period {
  if (value === "7d" || value === "30d" || value === "90d") return value;
  return "30d";
}

export default async function AdminRedesMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  const period = parsePeriod(params.period);

  const data = await getMetricsDashboard(period);

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <MetricsDashboard data={data} />
    </AdminSiteLayout>
  );
}