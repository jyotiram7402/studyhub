import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/notes/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { NOTE_SELECT } from "@/lib/queries/notes";
import { createClient } from "@/lib/supabase/server";
import type { NoteWithRelations } from "@/lib/types";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/bookmarks");

  const { data } = await supabase
    .from("bookmarks")
    .select(`created_at, note:notes (${NOTE_SELECT})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notes = (data ?? [])
    .map((row) => row.note as unknown as NoteWithRelations | null)
    .filter((note): note is NoteWithRelations => Boolean(note && note.status === "published"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {notes.length} saved {notes.length === 1 ? "resource" : "resources"} — buy or
          download them whenever you&apos;re ready
        </p>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Bookmark notes while browsing and they'll be waiting for you here when you need them."
          actionLabel="Browse notes"
          actionHref="/browse"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
