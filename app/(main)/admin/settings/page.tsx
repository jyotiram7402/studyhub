import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { PlatformSettings } from "@/lib/types";

export const metadata: Metadata = {
  title: "Platform settings",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const settings = data as PlatformSettings;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Branding, commission, upload limits, and maintenance mode. Commission changes
          apply to new sales only.
        </p>
      </div>
      <Separator />
      <SettingsForm settings={settings} />
    </div>
  );
}
