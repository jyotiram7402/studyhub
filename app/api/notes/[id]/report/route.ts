import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createReportSchema } from "@/lib/validations/review";

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

  const limit = checkRateLimit(`reports:${user.id}`, 5, 60_000);
  if (!limit.allowed) {
    return rateLimitResponse(limit);
  }

  const body = await request.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: openReport } = await supabase
    .from("reports")
    .select("id")
    .eq("note_id", id)
    .eq("reporter_id", user.id)
    .eq("status", "open")
    .maybeSingle();

  if (openReport) {
    return NextResponse.json(
      { error: "You already have an open report for this note" },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("reports").insert({
    note_id: id,
    reporter_id: user.id,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
