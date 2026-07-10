"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Clock, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requestVerificationSchema } from "@/lib/validations/admin";
import type { SellerVerification } from "@/lib/types";

interface VerificationCardProps {
  verification: SellerVerification | null;
  isVerified: boolean;
}

export function VerificationCard({ verification, isVerified }: VerificationCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const parsed = requestVerificationSchema.safeParse({
      message: formData.get("message"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(body?.error ?? "Could not submit your request.");
      return;
    }

    toast.success("Verification request submitted");
    setOpen(false);
    router.refresh();
  }

  if (isVerified) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">You are a verified seller</p>
          <p className="text-xs text-muted-foreground">
            The verified badge shows on your profile, uploads, and reviews.
          </p>
        </div>
      </div>
    );
  }

  if (verification?.status === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Clock className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Verification under review</p>
          <p className="text-xs text-muted-foreground">
            Our team is reviewing your request. You&apos;ll get a notification either way.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Become a verified seller</p>
            <p className="text-xs text-muted-foreground">
              Verified sellers get a badge that builds buyer trust and stands out in
              search results.
            </p>
          </div>
        </div>
        {!open && (
          <Button size="sm" onClick={() => setOpen(true)}>
            Request verification
          </Button>
        )}
      </div>

      {verification?.status === "rejected" && !open && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          Your previous request was declined
          {verification.review_note ? `: ${verification.review_note}` : "."} You can apply
          again.
        </p>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          <Textarea
            name="message"
            rows={3}
            placeholder="Tell us about yourself — your course, what you upload, and why students trust your material."
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit request
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
