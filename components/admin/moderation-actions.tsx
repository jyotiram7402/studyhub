"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ModerationActionsProps {
  noteId: string;
  moderationStatus: string;
}

export function ModerationActions({ noteId, moderationStatus }: ModerationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function moderate(action: "approve" | "hide" | "remove") {
    if (
      action === "remove" &&
      !window.confirm("Remove this listing from the marketplace? The seller keeps the file, but buyers can no longer see it.")
    ) {
      return;
    }

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

    toast.success(`Listing ${action === "approve" ? "approved" : action === "hide" ? "hidden" : "removed"}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={pending !== null || moderationStatus === "approved"}
        onClick={() => moderate("approve")}
      >
        {pending === "approve" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending !== null || moderationStatus === "hidden"}
        onClick={() => moderate("hide")}
      >
        {pending === "hide" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
        Hide
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={pending !== null || moderationStatus === "removed"}
        onClick={() => moderate("remove")}
      >
        {pending === "remove" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Remove
      </Button>
    </div>
  );
}
