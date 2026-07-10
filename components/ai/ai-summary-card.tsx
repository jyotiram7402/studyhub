import { BookOpenCheck, Clock, Gauge, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { NoteSummary } from "@/lib/types";

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner friendly",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export async function AiSummaryCard({ noteId }: { noteId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("summaries")
    .select("*")
    .eq("note_id", noteId)
    .maybeSingle();

  const summary = data as NoteSummary | null;
  if (!summary) return null;

  return (
    <section className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">AI summary</h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {summary.short_summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {summary.difficulty && (
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-4 w-4" />
            {DIFFICULTY_LABELS[summary.difficulty]}
          </span>
        )}
        {summary.reading_time_minutes && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            ~{summary.reading_time_minutes} min read
          </span>
        )}
        {summary.quality_score !== null && (
          <span className="inline-flex items-center gap-1.5">
            <BookOpenCheck className="h-4 w-4" />
            Quality score {summary.quality_score}/100
          </span>
        )}
      </div>

      {summary.key_topics.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Topics covered
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {summary.key_topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="font-normal">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {summary.important_points.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Key points
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {summary.important_points.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
