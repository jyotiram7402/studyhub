import type { Metadata } from "next";
import { BarChart, DistributionBars } from "@/components/admin/bar-chart";
import {
  getCategoryDistribution,
  getDailyAnalytics,
  getUniversityDistribution,
} from "@/lib/queries/admin";
import { formatPrice } from "@/lib/utils";
import type { AnalyticsDay } from "@/lib/types";

export const metadata: Metadata = {
  title: "Platform analytics",
};

function fillDays(rows: AnalyticsDay[], days: number): AnalyticsDay[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const result: AnalyticsDay[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    result.push(
      byDay.get(key) ?? {
        id: key,
        day: key,
        new_users: 0,
        uploads_count: 0,
        downloads_count: 0,
        orders_count: 0,
        revenue: 0,
      }
    );
  }
  return result;
}

function chartLabel(day: string): string {
  return new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminAnalyticsPage() {
  const [daily, categories, universities] = await Promise.all([
    getDailyAnalytics(30),
    getCategoryDistribution(),
    getUniversityDistribution(),
  ]);

  const series = fillDays(daily, 30);

  const charts = [
    {
      title: "Revenue",
      description: "Paid order value per day",
      data: series.map((row) => ({ label: chartLabel(row.day), value: Number(row.revenue) })),
      format: (value: number) => formatPrice(value),
    },
    {
      title: "Orders",
      description: "Completed orders per day",
      data: series.map((row) => ({ label: chartLabel(row.day), value: row.orders_count })),
    },
    {
      title: "New users",
      description: "Account signups per day",
      data: series.map((row) => ({ label: chartLabel(row.day), value: row.new_users })),
    },
    {
      title: "Uploads",
      description: "Notes published per day",
      data: series.map((row) => ({ label: chartLabel(row.day), value: row.uploads_count })),
    },
    {
      title: "Downloads",
      description: "Files downloaded per day",
      data: series.map((row) => ({ label: chartLabel(row.day), value: row.downloads_count })),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily activity across the last 30 days, collected automatically from platform
          events.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {charts.map((chart) => (
          <section key={chart.title} className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">{chart.title}</h2>
            <p className="text-xs text-muted-foreground">{chart.description}</p>
            <BarChart className="mt-4" data={chart.data} formatValue={chart.format} />
          </section>
        ))}

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Category distribution</h2>
          <p className="text-xs text-muted-foreground">Listings per category</p>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No listings yet.</p>
          ) : (
            <DistributionBars className="mt-4" data={categories} />
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold">University distribution</h2>
          <p className="text-xs text-muted-foreground">Listings per university or board</p>
          {universities.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No listings yet.</p>
          ) : (
            <DistributionBars className="mt-4" data={universities} />
          )}
        </section>
      </div>
    </div>
  );
}
