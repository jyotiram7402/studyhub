"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  noteId: string;
  initialBookmarked: boolean;
  isSignedIn: boolean;
}

export function BookmarkButton({
  noteId,
  initialBookmarked,
  isSignedIn,
}: BookmarkButtonProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    if (!isSignedIn) {
      router.push(`/login?redirect=/notes/${noteId}`);
      return;
    }

    const next = !bookmarked;
    setBookmarked(next);

    const response = await fetch(`/api/notes/${noteId}/bookmark`, {
      method: "POST",
    });

    if (!response.ok) {
      setBookmarked(!next);
      toast.error("Could not update bookmark. Please try again.");
      return;
    }

    if (!next) {
      toast("Removed from wishlist", {
        action: {
          label: "Undo",
          onClick: () => {
            setBookmarked(true);
            fetch(`/api/notes/${noteId}/bookmark`, { method: "POST" })
              .then(() => startTransition(() => router.refresh()))
              .catch(() => setBookmarked(false));
          },
        },
      });
    }

    startTransition(() => router.refresh());
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={bookmarked}
    >
      <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current text-primary")} />
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
