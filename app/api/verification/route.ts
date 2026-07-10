import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestVerificationSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestVerificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("seller_verification")
    .select("id, status")
    .eq("seller_id", user.id)
    .maybeSingle();

  if (existing?.status === "pending") {
    return NextResponse.json(
      { error: "Your verification request is already under review" },
      { status: 409 }
    );
  }
  if (existing?.status === "approved") {
    return NextResponse.json({ error: "You are already verified" }, { status: 409 });
  }

  const { error } = existing
    ? await supabase
        .from("seller_verification")
        .update({
          status: "pending",
          message: parsed.data.message,
          review_note: null,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq("id", existing.id)
    : await supabase
        .from("seller_verification")
        .insert({ seller_id: user.id, message: parsed.data.message });

  if (error) {
    return NextResponse.json({ error: "Could not submit request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
