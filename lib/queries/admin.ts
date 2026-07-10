import { createClient } from "@/lib/supabase/server";
import type { AnalyticsDay } from "@/lib/types";

export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalNotes: number;
  totalProjects: number;
  grossRevenue: number;
  todaysSales: number;
  monthlySales: number;
  pendingApprovals: number;
  pendingVerifications: number;
  openReports: number;
}

const PROJECT_SLUGS = ["mini-projects", "major-projects"];

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: projectCategories } = await supabase
    .from("categories")
    .select("id")
    .in("slug", PROJECT_SLUGS);
  const projectCategoryIds = (projectCategories ?? []).map((c) => c.id as string);

  const [
    users,
    sellers,
    notes,
    projects,
    paidOrders,
    todayOrders,
    monthOrders,
    pendingNotes,
    pendingVerifications,
    openReports,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("seller_wallet").select("seller_id", { count: "exact", head: true }),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    projectCategoryIds.length > 0
      ? supabase
          .from("notes")
          .select("id", { count: "exact", head: true })
          .in("category_id", projectCategoryIds)
      : Promise.resolve({ count: 0 }),
    supabase.from("orders").select("total").eq("status", "paid"),
    supabase
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("paid_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("paid_at", startOfMonth.toISOString()),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "pending"),
    supabase
      .from("seller_verification")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const sum = (rows: { total: number }[] | null | undefined) =>
    (rows ?? []).reduce((acc, row) => acc + Number(row.total), 0);

  return {
    totalUsers: users.count ?? 0,
    totalSellers: sellers.count ?? 0,
    totalNotes: notes.count ?? 0,
    totalProjects: ("count" in projects ? projects.count : 0) ?? 0,
    grossRevenue: sum(paidOrders.data),
    todaysSales: sum(todayOrders.data),
    monthlySales: sum(monthOrders.data),
    pendingApprovals: pendingNotes.count ?? 0,
    pendingVerifications: pendingVerifications.count ?? 0,
    openReports: openReports.count ?? 0,
  };
}

export async function getDailyAnalytics(days = 30): Promise<AnalyticsDay[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("analytics")
    .select("*")
    .gte("day", since.toISOString().slice(0, 10))
    .order("day", { ascending: true });

  return (data ?? []) as AnalyticsDay[];
}

export interface DistributionRow {
  label: string;
  value: number;
}

export async function getCategoryDistribution(): Promise<DistributionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("category:categories (name)")
    .limit(2000);

  return aggregateDistribution(
    (data ?? []).map((row) => (row.category as unknown as { name: string } | null)?.name)
  );
}

export async function getUniversityDistribution(): Promise<DistributionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("university:universities (name)")
    .limit(2000);

  return aggregateDistribution(
    (data ?? []).map((row) => (row.university as unknown as { name: string } | null)?.name)
  );
}

function aggregateDistribution(labels: (string | undefined)[]): DistributionRow[] {
  const counts = new Map<string, number>();
  for (const label of labels) {
    const key = label ?? "Unspecified";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}
