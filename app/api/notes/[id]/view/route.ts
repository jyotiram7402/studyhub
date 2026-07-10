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

  await Promise.all([
    supabase.rpc("increment_note_views", { target_note_id: id }),
    user ? supabase.rpc("track_recently_viewed", { target_note_id: id }) : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
