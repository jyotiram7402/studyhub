import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid flashcard id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: card } = await supabase
    .from("flashcards")
    .select("review_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("flashcards")
    .update({
      review_count: card.review_count + 1,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not record review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
