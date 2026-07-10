import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { userActionSchema } from "@/lib/validations/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  if (admin.id === id) {
    return NextResponse.json({ error: "You cannot change your own status" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = userActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const status = parsed.data.action === "suspend" ? "suspended" : "active";
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not update user" }, { status: 500 });
  }

  await logAdminAction(`user_${parsed.data.action}d`, "user", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = await createClient();
  await logAdminAction("user_deleted", "user", id);

  const { error } = await supabase.rpc("admin_delete_user", { target_user_id: id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
