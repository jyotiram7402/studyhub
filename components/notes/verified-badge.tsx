import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center text-primary", className)}
      title="Verified seller"
    >
      <BadgeCheck className="h-4 w-4" />
      <span className="sr-only">Verified seller</span>
    </span>
  );
}
