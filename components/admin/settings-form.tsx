"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ACCEPTED_FILE_EXTENSIONS } from "@/lib/constants";
import { platformSettingsSchema } from "@/lib/validations/admin";
import type { PlatformSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allowedTypes, setAllowedTypes] = useState<string[]>(settings.allowed_file_types);

  function toggleType(type: string) {
    setAllowedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = platformSettingsSchema.safeParse({
      platformName: formData.get("platformName"),
      logoUrl: formData.get("logoUrl"),
      commissionPercent: formData.get("commissionPercent"),
      maxUploadSizeMb: formData.get("maxUploadSizeMb"),
      allowedFileTypes: allowedTypes,
      maintenanceMode: formData.get("maintenanceMode") === "true",
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message])
        )
      );
      toast.error("Fix the highlighted fields and try again.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Could not save settings.");
      return;
    }

    toast.success("Platform settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Platform name" htmlFor="platformName" error={errors.platformName}>
          <Input
            id="platformName"
            name="platformName"
            defaultValue={settings.platform_name}
            required
          />
        </FormField>
        <FormField
          label="Logo URL"
          htmlFor="logoUrl"
          error={errors.logoUrl}
          hint="Optional — a hosted image used in emails and branding"
        >
          <Input id="logoUrl" name="logoUrl" defaultValue={settings.logo_url ?? ""} />
        </FormField>
        <FormField
          label="Commission (%)"
          htmlFor="commissionPercent"
          error={errors.commissionPercent}
          hint="Platform fee taken from each sale before crediting sellers"
        >
          <Input
            id="commissionPercent"
            name="commissionPercent"
            type="number"
            min={0}
            max={50}
            step={0.5}
            defaultValue={settings.commission_percent}
          />
        </FormField>
        <FormField
          label="Max upload size (MB)"
          htmlFor="maxUploadSizeMb"
          error={errors.maxUploadSizeMb}
          hint="Storage bucket limit is 50 MB on the free tier"
        >
          <Input
            id="maxUploadSizeMb"
            name="maxUploadSizeMb"
            type="number"
            min={1}
            max={50}
            defaultValue={settings.max_upload_size_mb}
          />
        </FormField>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Allowed file types</p>
        {errors.allowedFileTypes && (
          <p className="text-xs text-destructive">{errors.allowedFileTypes}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {ACCEPTED_FILE_EXTENSIONS.map((type) => (
            <label
              key={type}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={allowedTypes.includes(type)}
                onChange={() => toggleType(type)}
                className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
              />
              <span className="uppercase">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <FormField
        label="Maintenance mode"
        htmlFor="maintenanceMode"
        hint="Shows a site-wide banner warning users about downtime"
      >
        <Select
          id="maintenanceMode"
          name="maintenanceMode"
          defaultValue={settings.maintenance_mode ? "true" : "false"}
          className="max-w-xs"
        >
          <option value="false">Off — platform fully available</option>
          <option value="true">On — show maintenance banner</option>
        </Select>
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
