import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("note_id")
    .eq("user_id", user.id)
    .eq("note_id", id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("note_id", id);

    if (error) {
      return NextResponse.json({ error: "Could not remove bookmark" }, { status: 500 });
    }
    return NextResponse.json({ bookmarked: false });
  }

  const { error } = await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, note_id: id });

  if (error) {
    return NextResponse.json({ error: "Could not add bookmark" }, { status: 500 });
  }
  return NextResponse.json({ bookmarked: true });
}
