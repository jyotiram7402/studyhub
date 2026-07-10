"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this review? The note's rating will be recalculated.")) {
      return;
    }

    setDeleting(true);
    const response = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    setDeleting(false);

    if (!response.ok) {
      toast.error("Could not delete review.");
      return;
    }

    toast.success("Review deleted");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="text-muted-foreground hover:text-destructive"
    >
      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Delete
    </Button>
  );
}
