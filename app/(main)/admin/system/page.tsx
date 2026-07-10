import type { Metadata } from "next";
import {
  Bot,
  Database,
  FileText,
  HardDrive,
  MessageSquareText,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { MaintenanceActions } from "@/components/admin/maintenance-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = {
  title: "System health",
};

const FREE_TIER_STORAGE_BYTES = 1024 * 1024 * 1024;

export default async function AdminSystemPage() {
  const supabase = await createClient();

  const [
    storage,
    users,
    notes,
    processedNotes,
    failedNotes,
    chunks,
    aiMessages,
    summaries,
    staleOrders,
    topSearches,
  ] = await Promise.all([
    supabase.rpc("get_storage_usage"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("ai_status", "completed"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("ai_status", "failed"),
    supabase.from("document_chunks").select("id", { count: "exact", head: true }),
    supabase.from("ai_messages").select("id", { count: "exact", head: true }),
    supabase.from("summaries").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.rpc("get_popular_searches", { entry_count: 10 }),
  ]);

  const usage = (storage.data?.[0] ?? { file_count: 0, total_bytes: 0 }) as {
    file_count: number;
    total_bytes: number;
  };
  const storagePercent = Math.min(
    (Number(usage.total_bytes) / FREE_TIER_STORAGE_BYTES) * 100,
    100
  );
  const searches = (topSearches.data ?? []) as { query: string; search_count: number }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free-tier resource usage, AI pipeline status, and maintenance tooling.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage used
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBytes(Number(usage.total_bytes))}</p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(storagePercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Storage usage against free tier"
            >
              <div
                className={
                  storagePercent > 80
                    ? "h-full rounded-full bg-destructive"
                    : "h-full rounded-full bg-primary"
                }
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {storagePercent.toFixed(1)}% of the 1 GB free tier · {usage.file_count} files
            </p>
          </CardContent>
        </Card>
        <StatCard title="Registered users" value={users.count ?? 0} icon={Users} />
        <StatCard title="Total uploads" value={notes.count ?? 0} icon={FileText} />
        <StatCard title="Pending orders" value={staleOrders.count ?? 0} icon={Database} />
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold">
          <Bot className="h-4 w-4 text-muted-foreground" />
          AI pipeline
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Notes indexed"
            value={processedNotes.count ?? 0}
            icon={Sparkles}
            description={`${failedNotes.count ?? 0} failed`}
          />
          <StatCard title="Vector chunks" value={chunks.count ?? 0} icon={Database} />
          <StatCard title="AI summaries" value={summaries.count ?? 0} icon={FileText} />
          <StatCard
            title="Chat messages"
            value={aiMessages.count ?? 0}
            icon={MessageSquareText}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <Search className="h-4 w-4 text-muted-foreground" />
            Search analytics
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Most frequent queries in the last 30 days
          </p>
          {searches.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No search data yet.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {searches.map((row) => (
                <li
                  key={row.query}
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                >
                  <span className="line-clamp-1">{row.query}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {row.search_count}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Maintenance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cancel checkouts abandoned for over a week and remove storage files whose
            listings were deleted.
          </p>
          <div className="mt-4">
            <MaintenanceActions />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Database backups: Supabase's free tier keeps daily automatic backups with
            7-day retention. Export a manual SQL dump from the dashboard before running
            migrations.
          </p>
        </section>
      </div>
    </div>
  );
}
