import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const moderationSchema = z.object({
  action: z.enum(["approve", "hide", "remove", "restore", "feature", "editors_choice", "unfeature"]),
});

const MODERATION_STATUS: Record<string, string> = {
  approve: "approved",
  restore: "approved",
  hide: "hidden",
  remove: "removed",
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = moderationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { action } = parsed.data;

  if (action in MODERATION_STATUS) {
    const { error } = await supabase
      .from("notes")
      .update({ moderation_status: MODERATION_STATUS[action] })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Could not update listing" }, { status: 500 });
    }
  } else if (action === "feature" || action === "editors_choice") {
    const kind = action === "feature" ? "featured" : "editors_choice";
    const { error } = await supabase
      .from("featured_products")
      .upsert({ note_id: id, kind, featured_by: admin.id }, { onConflict: "note_id" });

    if (error) {
      return NextResponse.json({ error: "Could not feature listing" }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("featured_products").delete().eq("note_id", id);
    if (error) {
      return NextResponse.json({ error: "Could not unfeature listing" }, { status: 500 });
    }
  }

  await logAdminAction(`note_${action}`, "note", id);
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

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("id, title, uploader_id")
    .eq("id", id)
    .maybeSingle();

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not delete listing" }, { status: 500 });
  }

  await logAdminAction("note_deleted", "note", id, {
    title: note.title,
    uploader_id: note.uploader_id,
  });

  return NextResponse.json({ ok: true });
}
