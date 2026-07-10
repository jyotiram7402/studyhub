import { Award, Flame, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NoteWithRelations } from "@/lib/types";

const BEST_SELLER_MIN_SALES = 10;
const TOP_RATED_MIN_AVG = 4.5;
const TOP_RATED_MIN_COUNT = 3;
const RECENT_DAYS = 7;

export function getQualityBadges(note: NoteWithRelations) {
  const badges: { label: string; icon: typeof Award }[] = [];

  if (note.featured?.kind === "editors_choice") {
    badges.push({ label: "Editor's Choice", icon: Award });
  } else if (note.featured?.kind === "featured") {
    badges.push({ label: "Featured", icon: Sparkles });
  }
  if (note.sales_count >= BEST_SELLER_MIN_SALES) {
    badges.push({ label: "Best Seller", icon: Flame });
  }
  if (note.rating_avg >= TOP_RATED_MIN_AVG && note.rating_count >= TOP_RATED_MIN_COUNT) {
    badges.push({ label: "Top Rated", icon: Star });
  }
  const ageDays = (Date.now() - new Date(note.created_at).getTime()) / 86_400_000;
  if (badges.length === 0 && ageDays <= RECENT_DAYS) {
    badges.push({ label: "New", icon: Sparkles });
  }

  return badges;
}

export function QualityBadges({
  note,
  limit = 2,
}: {
  note: NoteWithRelations;
  limit?: number;
}) {
  const badges = getQualityBadges(note).slice(0, limit);
  if (badges.length === 0) return null;

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {badges.map((badge) => (
        <Badge
          key={badge.label}
          className="gap-1 bg-amber-100 text-amber-800 shadow-sm hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400"
        >
          <badge.icon className="h-3 w-3" />
          {badge.label}
        </Badge>
      ))}
    </span>
  );
}
