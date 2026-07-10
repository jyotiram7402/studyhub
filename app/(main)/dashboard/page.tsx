import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bookmark, Download, Eye, FileText, Sparkles, Upload } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/notes/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { Button } from "@/components/ui/button";
import { isAiConfigured } from "@/lib/ai/gemini";
import { refreshRecommendations } from "@/lib/ai/recommendations";
import { NOTE_SELECT } from "@/lib/queries/notes";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import type { NoteWithRelations } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/dashboard");

  const supabase = await createClient();

  const [{ data: uploads }, { count: bookmarkCount }] = await Promise.all([
    supabase
      .from("notes")
      .select(NOTE_SELECT)
      .eq("uploader_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookmarks")
      .select("note_id", { count: "exact", head: true })
      .eq("user_id", profile.id),
  ]);

  const notes = (uploads ?? []) as unknown as NoteWithRelations[];
  const totalViews = notes.reduce((sum, note) => sum + note.views, 0);
  const totalDownloads = notes.reduce((sum, note) => sum + note.downloads, 0);
  const recentNotes = notes.slice(0, 4);

  let recommendedNotes: NoteWithRelations[] = [];
  if (isAiConfigured()) {
    try {
      await refreshRecommendations(supabase, profile.id);
      const { data: recommendationRows } = await supabase
        .from("recommendations")
        .select(`score, note:notes (${NOTE_SELECT})`)
        .eq("user_id", profile.id)
        .order("score", { ascending: false })
        .limit(4);
      recommendedNotes = (recommendationRows ?? [])
        .map((row) => row.note as unknown as NoteWithRelations | null)
        .filter((note): note is NoteWithRelations => Boolean(note));
    } catch {
      recommendedNotes = [];
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s how your study material is doing.
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Upload className="h-4 w-4" />
            Upload notes
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Uploads" value={notes.length} icon={FileText} />
        <StatCard title="Total views" value={totalViews} icon={Eye} />
        <StatCard title="Total downloads" value={totalDownloads} icon={Download} />
        <StatCard title="Bookmarked by you" value={bookmarkCount ?? 0} icon={Bookmark} />
      </div>

      {recommendedNotes.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Recommended for you</h2>
            <span className="text-xs text-muted-foreground">
              Based on your purchases, bookmarks, and searches
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {recommendedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent uploads</h2>
          {notes.length > 0 && (
            <Link
              href="/dashboard/uploads"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {recentNotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No uploads yet"
            description="Share your first notes and they'll show up here along with their views and downloads."
            actionLabel="Upload your first notes"
            actionHref="/upload"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {recentNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
