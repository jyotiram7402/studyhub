import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reportReviewSchema } from "@/lib/validations/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select("id, note_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (report.status !== "open") {
    return NextResponse.json({ error: "Report is already closed" }, { status: 409 });
  }

  const { action, contentAction, resolutionNote } = parsed.data;

  if (action === "resolve" && contentAction !== "none") {
    const moderationStatus = contentAction === "hide" ? "hidden" : "removed";
    const { error: noteError } = await supabase
      .from("notes")
      .update({ moderation_status: moderationStatus })
      .eq("id", report.note_id);

    if (noteError) {
      return NextResponse.json({ error: "Could not update the reported note" }, { status: 500 });
    }
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: action === "resolve" ? "resolved" : "dismissed",
      action_taken: action === "resolve" ? contentAction : "none",
      resolution_note: resolutionNote || null,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not update report" }, { status: 500 });
  }

  await logAdminAction(`report_${action}d`, "report", id, {
    note_id: report.note_id,
    content_action: contentAction,
  });

  return NextResponse.json({ ok: true });
}
