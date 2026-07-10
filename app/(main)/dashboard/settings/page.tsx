import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { Separator } from "@/components/ui/separator";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/dashboard/settings");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your public profile and account details.
        </p>
      </div>
      <Separator />
      <SettingsForm profile={profile} />
    </div>
  );
}
