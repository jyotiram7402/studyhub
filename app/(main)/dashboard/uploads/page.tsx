import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { UploadRow } from "@/components/dashboard/upload-row";
import { EmptyState } from "@/components/notes/empty-state";
import { NOTE_SELECT } from "@/lib/queries/notes";
import { createClient } from "@/lib/supabase/server";
import type { NoteWithRelations } from "@/lib/types";

export const metadata: Metadata = {
  title: "My uploads",
};

export default async function UploadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/uploads");

  const { data } = await supabase
    .from("notes")
    .select(NOTE_SELECT)
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false });

  const notes = (data ?? []) as unknown as NoteWithRelations[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My uploads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {notes.length} {notes.length === 1 ? "upload" : "uploads"} published
        </p>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing uploaded yet"
          description="Notes, papers, and projects you publish will be listed here so you can track and manage them."
          actionLabel="Upload notes"
          actionHref="/upload"
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <UploadRow key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
