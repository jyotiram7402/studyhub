import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  count: number;
  className?: string;
}

export function RatingStars({ rating, count, className }: RatingStarsProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-3.5 w-3.5",
              index < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            )}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">
        {count > 0 ? `${rating.toFixed(1)} (${count})` : "No ratings yet"}
      </span>
    </span>
  );
}
