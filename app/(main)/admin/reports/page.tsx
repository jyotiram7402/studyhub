import type { Metadata } from "next";
import Link from "next/link";
import { ReportActions } from "@/components/admin/report-actions";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { ContentReport } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reports",
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  wrong_content: "Wrong content",
  duplicate: "Duplicate",
  copyright: "Copyright",
  abusive: "Abusive",
  broken_file: "Broken file",
  other: "Other",
};

type ReportRow = ContentReport & {
  note: { id: string; title: string } | null;
  reporter: { username: string } | null;
};

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("*, note:notes (id, title), reporter:profiles!reports_reporter_id_fkey (username)")
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = (data ?? []) as unknown as ReportRow[];
  const open = reports.filter((report) => report.status === "open");
  const closed = reports.filter((report) => report.status !== "open");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {open.length} open {open.length === 1 ? "report" : "reports"} awaiting review.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Open
        </h2>
        {open.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No open reports — the queue is clear.
          </p>
        ) : (
          open.map((report) => (
            <div key={report.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </Badge>
                    {report.note ? (
                      <Link
                        href={`/notes/${report.note.id}`}
                        className="line-clamp-1 text-sm font-medium hover:text-primary"
                      >
                        {report.note.title}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">Deleted note</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reported by {report.reporter ? `@${report.reporter.username}` : "unknown"} ·{" "}
                    {formatDate(report.created_at)}
                  </p>
                  {report.details && (
                    <p className="mt-2 text-sm text-muted-foreground">{report.details}</p>
                  )}
                </div>
                <ReportActions reportId={report.id} />
              </div>
            </div>
          ))
        )}
      </section>

      {closed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recently closed
          </h2>
          {closed.slice(0, 20).map((report) => (
            <div
              key={report.id}
              className="flex flex-col justify-between gap-2 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge variant={report.status === "resolved" ? "success" : "outline"}>
                  {report.status}
                </Badge>
                <Badge variant="secondary">
                  {REASON_LABELS[report.reason] ?? report.reason}
                </Badge>
                <span className="line-clamp-1 text-sm">
                  {report.note?.title ?? "Deleted note"}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {report.action_taken && report.action_taken !== "none"
                  ? `Action: ${report.action_taken} · `
                  : ""}
                {report.resolved_at ? formatDate(report.resolved_at) : ""}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
