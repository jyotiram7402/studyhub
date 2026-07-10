import type { Metadata } from "next";
import Link from "next/link";
import { Medal, Trophy } from "lucide-react";
import { VerifiedBadge } from "@/components/notes/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getLevel } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/server";
import { formatCount, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top StudyHub contributors ranked by points earned from uploads, sales, and reviews.",
  alternates: { canonical: "/leaderboard" },
};

interface LeaderboardRow {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  points: number;
  upload_count: number;
  sales_count: number;
}

const RANK_STYLES = [
  "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400",
];

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_leaderboard", { entry_count: 20 });
  const entries = (data ?? []) as LeaderboardRow[];

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Trophy className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Top contributors</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Points are earned by uploading material (+10), making sales (+25), buying
          (+5), and reviewing (+5).
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          The leaderboard fills up as students start contributing.
        </p>
      ) : (
        <ol className="mt-10 space-y-3">
          {entries.map((entry, index) => {
            const level = getLevel(Number(entry.points));
            return (
              <li key={entry.user_id}>
                <Link
                  href={`/profile/${entry.username}`}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      RANK_STYLES[index] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < 3 ? <Medal className="h-4 w-4" /> : index + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    {entry.avatar_url && (
                      <AvatarImage src={entry.avatar_url} alt={entry.full_name} />
                    )}
                    <AvatarFallback>{getInitials(entry.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-sm font-medium">
                      {entry.full_name}
                      {entry.is_verified && <VerifiedBadge />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.upload_count} uploads · {formatCount(Number(entry.sales_count))}{" "}
                      sales
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{formatCount(Number(entry.points))} pts</p>
                    <Badge variant="secondary" className="mt-1 font-normal">
                      Lv {level.level} · {level.name}
                    </Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
