import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("id, reviewer_id, note_id")
    .eq("id", id)
    .maybeSingle();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  if (review.reviewer_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not delete review" }, { status: 500 });
  }

  if (isAdmin && review.reviewer_id !== user.id) {
    await logAdminAction("review_deleted", "review", id, { note_id: review.note_id });
  }

  return NextResponse.json({ ok: true });
}
