import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createReviewSchema } from "@/lib/validations/review";

export async function POST(
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
  const parsed = createReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const values = {
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body || null,
  };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("note_id", id)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("reviews").update(values).eq("id", existing.id)
    : await supabase
        .from("reviews")
        .insert({ ...values, note_id: id, reviewer_id: user.id });

  if (error) {
    return NextResponse.json(
      { error: "You can only review notes you have purchased or downloaded" },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true }, { status: existing ? 200 : 201 });
}
