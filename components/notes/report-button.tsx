"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReportSchema } from "@/lib/validations/review";

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "wrong_content", label: "Wrong or mislabelled content" },
  { value: "duplicate", label: "Duplicate of another upload" },
  { value: "copyright", label: "Copyright issue" },
  { value: "abusive", label: "Abusive or inappropriate" },
  { value: "broken_file", label: "Broken or corrupted file" },
  { value: "other", label: "Something else" },
];

interface ReportButtonProps {
  noteId: string;
  isSignedIn: boolean;
}

export function ReportButton({ noteId, isSignedIn }: ReportButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const parsed = createReportSchema.safeParse({
      reason: formData.get("reason"),
      details: formData.get("details"),
    });

    if (!parsed.success) {
      toast.error("Pick a reason for the report.");
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/notes/${noteId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(body?.error ?? "Could not submit report.");
      return;
    }

    toast.success("Report submitted", {
      description: "Our moderators will review it shortly. Thank you.",
    });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!isSignedIn) {
            router.push(`/login?redirect=/notes/${noteId}`);
            return;
          }
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
      >
        <Flag className="h-3.5 w-3.5" />
        Report this content
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
    >
      <p className="text-sm font-medium">Report this content</p>
      <div className="space-y-2">
        <Label htmlFor="report-reason">Reason</Label>
        <Select id="report-reason" name="reason" defaultValue="spam">
          {REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="report-details">Details (optional)</Label>
        <Textarea
          id="report-details"
          name="details"
          rows={3}
          placeholder="Anything that helps our moderators understand the issue"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="destructive" disabled={submitting}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Submit report
        </Button>
      </div>
    </form>
  );
}
