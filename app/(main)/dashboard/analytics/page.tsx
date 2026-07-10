import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeIndianRupee, Download, Eye, Percent, ShoppingBag } from "lucide-react";
import { BarChart } from "@/components/admin/bar-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/notes/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCount, formatPrice } from "@/lib/utils";
import type { SalesReport } from "@/lib/types";

export const metadata: Metadata = {
  title: "Analytics",
};

interface AnalyticsNoteRow {
  id: string;
  title: string;
  views: number;
  downloads: number;
  sales_count: number;
  price: number;
  rating_avg: number;
}

function formatPeriod(period: string): string {
  return new Date(period).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default async function SellerAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/analytics");

  const [{ data: notesData }, { data: reportsData }, { data: wallet }] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, views, downloads, sales_count, price, rating_avg")
      .eq("uploader_id", user.id),
    supabase
      .from("sales_reports")
      .select("*")
      .eq("seller_id", user.id)
      .order("period", { ascending: true })
      .limit(12),
    supabase.from("seller_wallet").select("total_earned").eq("seller_id", user.id).maybeSingle(),
  ]);

  const notes = (notesData ?? []) as AnalyticsNoteRow[];
  const reports = (reportsData ?? []) as SalesReport[];

  const totalViews = notes.reduce((sum, note) => sum + Number(note.views), 0);
  const totalDownloads = notes.reduce((sum, note) => sum + Number(note.downloads), 0);
  const totalSales = notes.reduce((sum, note) => sum + Number(note.sales_count), 0);
  const revenue = Number(wallet?.total_earned ?? 0);
  const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

  const topProducts = [...notes]
    .sort((a, b) => b.sales_count - a.sales_count || b.downloads - a.downloads)
    .slice(0, 5);

  const lastReport = reports[reports.length - 1];
  const previousReport = reports[reports.length - 2];
  const monthlyGrowth =
    previousReport && Number(previousReport.revenue) > 0
      ? ((Number(lastReport?.revenue ?? 0) - Number(previousReport.revenue)) /
          Number(previousReport.revenue)) *
        100
      : null;

  if (notes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance across your uploads.
          </p>
        </div>
        <EmptyState
          icon={Eye}
          title="No data yet"
          description="Upload your first notes and analytics for views, downloads, sales, and revenue will build up here."
          actionLabel="Upload notes"
          actionHref="/upload"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How your {notes.length} {notes.length === 1 ? "upload performs" : "uploads perform"}{" "}
          across the marketplace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Views" value={totalViews} icon={Eye} />
        <StatCard title="Downloads" value={totalDownloads} icon={Download} />
        <StatCard title="Sales" value={totalSales} icon={ShoppingBag} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <BadgeIndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(revenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">After platform fee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Sales per view</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-semibold">Monthly revenue</h2>
              <p className="text-xs text-muted-foreground">Net earnings per month</p>
            </div>
            {monthlyGrowth !== null && (
              <span
                className={
                  monthlyGrowth >= 0
                    ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
                    : "text-sm font-medium text-destructive"
                }
              >
                {monthlyGrowth >= 0 ? "+" : ""}
                {monthlyGrowth.toFixed(0)}% vs last month
              </span>
            )}
          </div>
          {reports.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Revenue appears after your first sale.
            </p>
          ) : (
            <BarChart
              className="mt-4"
              data={reports.map((report) => ({
                label: formatPeriod(report.period),
                value: Number(report.revenue),
              }))}
              formatValue={(value) => formatPrice(value)}
            />
          )}
        </section>

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">Top products</h2>
            <p className="text-xs text-muted-foreground">By sales, then downloads</p>
          </div>
          <ul className="divide-y">
            {topProducts.map((note, index) => (
              <li key={note.id} className="flex items-center gap-3 p-4">
                <span className="w-5 shrink-0 text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/notes/${note.id}`}
                    className="line-clamp-1 text-sm font-medium hover:text-primary"
                  >
                    {note.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCount(note.views)} views · {formatCount(note.downloads)} downloads
                    · {Number(note.rating_avg).toFixed(1)} ★
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {note.sales_count} {note.sales_count === 1 ? "sale" : "sales"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
