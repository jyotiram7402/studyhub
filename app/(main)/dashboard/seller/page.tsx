import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeIndianRupee,
  CircleCheck,
  CircleDashed,
  Download,
  FileText,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { VerificationCard } from "@/components/dashboard/verification-card";
import { EmptyState } from "@/components/notes/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerStats } from "@/lib/queries/seller";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";
import type { SellerVerification } from "@/lib/types";

export const metadata: Metadata = {
  title: "Seller dashboard",
};

function formatPeriod(period: string): string {
  return new Date(period).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function SellerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/seller");

  const stats = await getSellerStats(user.id);

  const [{ data: verification }, { data: profile }] = await Promise.all([
    supabase.from("seller_verification").select("*").eq("seller_id", user.id).maybeSingle(),
    supabase.from("profiles").select("is_verified").eq("id", user.id).maybeSingle(),
  ]);

  const recentPaidSales = stats.recentSales
    .filter((sale) => sale.order?.status === "paid")
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seller dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your sales, earnings, and buyer activity in one place.
          </p>
        </div>
        <Link
          href="/dashboard/seller/sales"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all sales
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <VerificationCard
        verification={(verification as SellerVerification | null) ?? null}
        isVerified={Boolean(profile?.is_verified)}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total revenue
            </CardTitle>
            <BadgeIndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(stats.wallet?.total_earned ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wallet balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.wallet?.balance ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payouts arrive in a future release
            </p>
          </CardContent>
        </Card>
        <StatCard
          title="Sales"
          value={stats.wallet?.total_sales ?? 0}
          icon={ShoppingBag}
        />
        <StatCard title="Products" value={stats.productCount} icon={FileText} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total downloads" value={stats.totalDownloads} icon={Download} />
        <StatCard
          title="Pending orders"
          value={stats.pendingOrders}
          icon={CircleDashed}
          description="Awaiting buyer payment"
        />
        <StatCard
          title="Completed orders"
          value={stats.completedOrders}
          icon={CircleCheck}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">Recent purchases</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Latest completed sales of your uploads
            </p>
          </div>
          {recentPaidSales.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No sales yet. Set a price on your uploads to start selling.
            </p>
          ) : (
            <ul className="divide-y">
              {recentPaidSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">{sale.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {sale.order?.buyer
                        ? `Bought by ${sale.order.buyer.full_name}`
                        : "Buyer"}{" "}
                      · {formatDate(sale.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatPrice(sale.final_price)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">Monthly earnings</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sales, revenue, and downloads by month
            </p>
          </div>
          {stats.monthlyReports.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Reports appear after your first sale or download.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-4 font-medium">Month</th>
                    <th className="p-4 font-medium">Sales</th>
                    <th className="p-4 font-medium">Downloads</th>
                    <th className="p-4 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.monthlyReports.map((report) => (
                    <tr key={report.id}>
                      <td className="p-4">{formatPeriod(report.period)}</td>
                      <td className="p-4">{report.sales_count}</td>
                      <td className="p-4">{report.downloads_count}</td>
                      <td className="p-4 text-right font-medium">
                        {formatPrice(report.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {stats.productCount === 0 && (
        <EmptyState
          icon={FileText}
          title="Start selling your notes"
          description="Upload your study material, set a price, and earn every time a student buys it."
          actionLabel="Upload notes"
          actionHref="/upload"
        />
      )}
    </div>
  );
}
