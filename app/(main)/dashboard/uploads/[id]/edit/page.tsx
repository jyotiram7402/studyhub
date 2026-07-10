import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditNoteForm } from "@/components/notes/edit-note-form";
import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/types";

export const metadata: Metadata = {
  title: "Edit product",
};

export default async function EditNotePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/uploads");

  const { data } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  const note = data as Note | null;

  if (!note || note.uploader_id !== user.id) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the listing, pricing, and visibility of &ldquo;{note.title}&rdquo;.
        </p>
      </div>
      <EditNoteForm note={note} />
    </div>
  );
}
