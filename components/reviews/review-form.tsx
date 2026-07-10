"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createReviewSchema } from "@/lib/validations/review";
import type { Review } from "@/lib/types";

interface ReviewFormProps {
  noteId: string;
  existingReview: Review | null;
}

export function ReviewForm({ noteId, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = createReviewSchema.safeParse({
      rating,
      title: formData.get("title"),
      body: formData.get("body"),
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
    const response = await fetch(`/api/notes/${noteId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Could not save your review.");
      return;
    }

    toast.success(existingReview ? "Review updated" : "Review published");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-5 shadow-sm"
      noValidate
    >
      <h3 className="text-sm font-semibold">
        {existingReview ? "Update your review" : "Write a review"}
      </h3>

      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Your rating</span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    value <= (hovered || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-xs text-destructive">{errors.rating}</p>}
        </div>

        <FormField label="Title (optional)" htmlFor="review-title" error={errors.title}>
          <Input
            id="review-title"
            name="title"
            placeholder="Sums up your experience"
            defaultValue={existingReview?.title ?? ""}
          />
        </FormField>

        <FormField label="Review (optional)" htmlFor="review-body" error={errors.body}>
          <Textarea
            id="review-body"
            name="body"
            rows={3}
            placeholder="Was it accurate, complete, and worth it?"
            defaultValue={existingReview?.body ?? ""}
          />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {existingReview ? "Update review" : "Publish review"}
          </Button>
        </div>
      </div>
    </form>
  );
}
