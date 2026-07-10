"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Award, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface FeatureActionsProps {
  noteId: string;
  featuredKind: "featured" | "editors_choice" | null;
}

export function FeatureActions({ noteId, featuredKind }: FeatureActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function apply(action: "feature" | "editors_choice" | "unfeature") {
    setPending(action);
    const response = await fetch(`/api/admin/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending(null);

    if (!response.ok) {
      toast.error("Could not update the listing.");
      return;
    }

    toast.success("Listing updated");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={pending !== null || featuredKind === "featured"}
        onClick={() => apply("feature")}
      >
        {pending === "feature" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        Feature
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending !== null || featuredKind === "editors_choice"}
        onClick={() => apply("editors_choice")}
      >
        {pending === "editors_choice" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Award className="h-3.5 w-3.5" />
        )}
        Editor&apos;s Choice
      </Button>
      {featuredKind && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending !== null}
          onClick={() => apply("unfeature")}
        >
          {pending === "unfeature" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Unfeature
        </Button>
      )}
    </div>
  );
}
