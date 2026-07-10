import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { platformSettingsSchema } from "@/lib/validations/admin";

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = platformSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("platform_settings")
    .update({
      platform_name: input.platformName,
      logo_url: input.logoUrl || null,
      commission_percent: input.commissionPercent,
      max_upload_size_mb: input.maxUploadSizeMb,
      allowed_file_types: input.allowedFileTypes,
      maintenance_mode: input.maintenanceMode,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }

  await logAdminAction("settings_updated", "platform_settings", "1", {
    commission_percent: input.commissionPercent,
    maintenance_mode: input.maintenanceMode,
  });

  return NextResponse.json({ ok: true });
}
