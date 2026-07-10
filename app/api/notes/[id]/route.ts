import { NextResponse } from "next/server";
import { z } from "zod";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { updateNoteSchema } from "@/lib/validations/note";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: note } = await supabase
    .from("notes")
    .select("id, uploader_id")
    .eq("id", id)
    .maybeSingle();

  if (!note || note.uploader_id !== user.id) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const input = parsed.data;
  const { error } = await supabase
    .from("notes")
    .update({
      title: input.title,
      description: input.description,
      price: input.price,
      discount_percent: input.discountPercent,
      version: input.version || null,
      edition: input.edition || null,
      visibility: input.visibility,
      preview_pages: input.previewPages,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not update note" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: note } = await supabase
    .from("notes")
    .select("id, uploader_id, file_path, thumbnail_path")
    .eq("id", id)
    .maybeSingle();

  if (!note || note.uploader_id !== user.id) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase.from("notes").delete().eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: "Could not delete note" }, { status: 500 });
  }

  await supabase.storage.from(STORAGE_BUCKETS.noteFiles).remove([note.file_path]);
  if (note.thumbnail_path) {
    await supabase.storage.from(STORAGE_BUCKETS.thumbnails).remove([note.thumbnail_path]);
  }

  return NextResponse.json({ ok: true });
}
