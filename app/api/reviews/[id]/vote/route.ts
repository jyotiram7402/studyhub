import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  const { data: existing } = await supabase
    .from("review_votes")
    .select("review_id")
    .eq("review_id", id)
    .eq("voter_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("review_votes")
      .delete()
      .eq("review_id", id)
      .eq("voter_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Could not update vote" }, { status: 500 });
    }
    return NextResponse.json({ voted: false });
  }

  const { error } = await supabase
    .from("review_votes")
    .insert({ review_id: id, voter_id: user.id });

  if (error) {
    return NextResponse.json({ error: "Could not record vote" }, { status: 500 });
  }
  return NextResponse.json({ voted: true });
}
