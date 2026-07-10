import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  CalendarDays,
  FileText,
  Flag,
  FolderKanban,
  GraduationCap,
  Hourglass,
  ShieldQuestion,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
};

interface RecentPurchase {
  id: string;
  price_paid: number;
  created_at: string;
  note: { title: string } | null;
  buyer: { username: string } | null;
}

interface RecentUpload {
  id: string;
  title: string;
  moderation_status: string;
  created_at: string;
  uploader: { username: string } | null;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [stats, recentPurchases, recentUploads] = await Promise.all([
    getAdminDashboardStats(),
    supabase
      .from("purchases")
      .select(
        "id, price_paid, created_at, note:notes (title), buyer:profiles!purchases_buyer_id_fkey (username)"
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("notes")
      .select(
        "id, title, moderation_status, created_at, uploader:profiles!notes_uploader_id_fkey (username)"
      )
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const purchases = (recentPurchases.data ?? []) as unknown as RecentPurchase[];
  const uploads = (recentUploads.data ?? []) as unknown as RecentUpload[];

  const revenueCards = [
    { title: "Gross revenue", value: stats.grossRevenue, description: "All paid orders" },
    { title: "Today's sales", value: stats.todaysSales, description: "Since midnight" },
    { title: "Monthly sales", value: stats.monthlySales, description: "This calendar month" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketplace overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform health at a glance — revenue, content, and the moderation queue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {revenueCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <BadgeIndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatPrice(card.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Sellers" value={stats.totalSellers} icon={GraduationCap} />
        <StatCard title="Notes" value={stats.totalNotes} icon={FileText} />
        <StatCard title="Projects" value={stats.totalProjects} icon={FolderKanban} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/listings" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending approvals
              </CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              <p className="mt-1 text-xs text-muted-foreground">Listings awaiting review</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/sellers" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verification requests
              </CardTitle>
              <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
              <p className="mt-1 text-xs text-muted-foreground">Sellers awaiting a badge</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/reports" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open reports
              </CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.openReports}</p>
              <p className="mt-1 text-xs text-muted-foreground">Reported content to review</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold">Recent purchases</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Latest completed sales</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              All orders
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {purchases.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No purchases yet.</p>
          ) : (
            <ul className="divide-y">
              {purchases.map((purchase) => (
                <li key={purchase.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">
                      {purchase.note?.title ?? "Deleted note"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {purchase.buyer ? `@${purchase.buyer.username}` : "unknown"} ·{" "}
                      {timeAgo(purchase.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatPrice(purchase.price_paid)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold">Recent uploads</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Latest listings published</p>
            </div>
            <Link
              href="/admin/listings"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              All listings
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {uploads.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No uploads yet.</p>
          ) : (
            <ul className="divide-y">
              {uploads.map((upload) => (
                <li key={upload.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Link
                      href={`/notes/${upload.id}`}
                      className="line-clamp-1 text-sm font-medium hover:text-primary"
                    >
                      {upload.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {upload.uploader ? `@${upload.uploader.username}` : "unknown"} ·{" "}
                      {timeAgo(upload.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">
                    {upload.moderation_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
