import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { verificationReviewSchema } from "@/lib/validations/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = verificationReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: verification } = await supabase
    .from("seller_verification")
    .select("id, seller_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!verification) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (verification.status !== "pending") {
    return NextResponse.json({ error: "Request already reviewed" }, { status: 409 });
  }

  const approved = parsed.data.action === "approve";

  const { error } = await supabase
    .from("seller_verification")
    .update({
      status: approved ? "approved" : "rejected",
      review_note: parsed.data.reviewNote || null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not update request" }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_verified: approved })
    .eq("id", verification.seller_id);

  if (profileError) {
    return NextResponse.json({ error: "Could not update seller profile" }, { status: 500 });
  }

  await supabase.rpc("create_notification", {
    target_user: verification.seller_id,
    notif_type: "verification_updated",
    notif_title: approved ? "You are now a verified seller" : "Verification request declined",
    notif_body: approved
      ? "The verified badge now shows on your profile and uploads."
      : parsed.data.reviewNote || "You can update your profile and request again.",
    notif_link: "/dashboard/seller",
  });

  await logAdminAction(`verification_${parsed.data.action}d`, "seller", verification.seller_id);
  return NextResponse.json({ ok: true });
}
