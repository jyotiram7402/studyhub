"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HelpfulButtonProps {
  reviewId: string;
  helpfulCount: number;
  initialVoted: boolean;
  isSignedIn: boolean;
}

export function HelpfulButton({
  reviewId,
  helpfulCount,
  initialVoted,
  isSignedIn,
}: HelpfulButtonProps) {
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(helpfulCount);

  async function handleClick() {
    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    const nextVoted = !voted;
    setVoted(nextVoted);
    setCount((current) => current + (nextVoted ? 1 : -1));

    const response = await fetch(`/api/reviews/${reviewId}/vote`, { method: "POST" });
    if (!response.ok) {
      setVoted(!nextVoted);
      setCount((current) => current + (nextVoted ? -1 : 1));
      toast.error("Could not record your vote.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-pressed={voted}
      className={cn("h-7 gap-1.5 px-2 text-xs", voted && "text-primary")}
    >
      <ThumbsUp className={cn("h-3.5 w-3.5", voted && "fill-current")} />
      Helpful{count > 0 ? ` (${count})` : ""}
    </Button>
  );
}
