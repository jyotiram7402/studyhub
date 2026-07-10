"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPTED_THUMBNAIL_TYPES,
  MAX_THUMBNAIL_SIZE,
  STORAGE_BUCKETS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getThumbnailUrl } from "@/lib/storage";
import { formatBytes, getInitials } from "@/lib/utils";
import { updateProfileSchema } from "@/lib/validations/profile";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_THUMBNAIL_TYPES.includes(file.type)) {
      toast.error("Profile photo must be a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      toast.error(`Profile photo must be under ${formatBytes(MAX_THUMBNAIL_SIZE)}.`);
      return;
    }

    setUploadingAvatar(true);
    const supabase = createClient();
    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${profile.id}/avatar-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.thumbnails)
      .upload(path, file, { contentType: file.type });

    setUploadingAvatar(false);

    if (error) {
      toast.error("Could not upload photo", { description: error.message });
      return;
    }

    const publicUrl = getThumbnailUrl(path);
    if (publicUrl) setAvatarUrl(publicUrl);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = updateProfileSchema.safeParse({
      fullName: formData.get("fullName"),
      bio: formData.get("bio"),
      college: formData.get("college"),
      course: formData.get("course"),
      semester: formData.get("semester"),
      avatarUrl,
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message])
        )
      );
      return;
    }

    setSaving(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Could not save your profile. Please try again.");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="flex items-center gap-5">
        <Avatar className="h-20 w-20">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.full_name} />}
          <AvatarFallback className="text-lg">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={avatarInputRef}
            type="file"
            accept={ACCEPTED_THUMBNAIL_TYPES.join(",")}
            className="sr-only"
            onChange={handleAvatarChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
          >
            {uploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Change photo
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            PNG, JPG, or WEBP · up to {formatBytes(MAX_THUMBNAIL_SIZE)}
          </p>
        </div>
      </div>

      <FormField label="Full name" htmlFor="fullName" error={errors.fullName}>
        <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
      </FormField>

      <FormField
        label="Username"
        htmlFor="username"
        hint="Usernames cannot be changed"
      >
        <Input id="username" value={`@${profile.username}`} disabled />
      </FormField>

      <FormField
        label="Bio"
        htmlFor="bio"
        error={errors.bio}
        hint="Tell other students what you study and what you upload"
      >
        <Textarea id="bio" name="bio" rows={3} defaultValue={profile.bio ?? ""} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="College" htmlFor="college" error={errors.college}>
          <Input id="college" name="college" defaultValue={profile.college ?? ""} />
        </FormField>
        <FormField label="Course" htmlFor="course" error={errors.course}>
          <Input id="course" name="course" defaultValue={profile.course ?? ""} />
        </FormField>
        <FormField label="Semester" htmlFor="semester" error={errors.semester}>
          <Input id="semester" name="semester" defaultValue={profile.semester ?? ""} />
        </FormField>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || uploadingAvatar}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
