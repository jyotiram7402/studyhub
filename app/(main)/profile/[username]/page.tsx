import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Building2,
  Calendar,
  Download,
  FileText,
  GraduationCap,
  Layers,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/notes/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { VerifiedBadge } from "@/components/notes/verified-badge";
import { getAchievements, getLevel, getNextLevel } from "@/lib/gamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NOTE_SELECT } from "@/lib/queries/notes";
import { getProfileByUsername } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import { formatDate, getInitials } from "@/lib/utils";
import type { NoteWithRelations } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: ProfilePageProps): Promise<Metadata> {
  const { username } = await props.params;
  const profile = await getProfileByUsername(username).catch(() => null);
  if (!profile) return { title: "Profile not found" };
  return {
    title: `${profile.full_name} (@${profile.username})`,
    description: profile.bio ?? `Study material shared by ${profile.full_name} on StudyHub.`,
  };
}

export default async function ProfilePage(props: ProfilePageProps) {
  const { username } = await props.params;
  const profile = await getProfileByUsername(username).catch(() => null);

  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const uploadsQuery = supabase
    .from("notes")
    .select(NOTE_SELECT)
    .eq("uploader_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const bookmarksQuery = isOwner
    ? supabase
        .from("bookmarks")
        .select(`created_at, note:notes (${NOTE_SELECT})`)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: null });

  const [{ data: uploadsData }, bookmarksResult] = await Promise.all([
    uploadsQuery,
    bookmarksQuery,
  ]);

  const uploads = (uploadsData ?? []) as unknown as NoteWithRelations[];
  const bookmarks = (bookmarksResult.data ?? [])
    .map((row) => row.note as unknown as NoteWithRelations | null)
    .filter((note): note is NoteWithRelations => Boolean(note && note.status === "published"));

  const facts = [
    { icon: Building2, value: profile.college },
    { icon: GraduationCap, value: profile.course },
    { icon: Layers, value: profile.semester },
    { icon: Calendar, value: `Joined ${formatDate(profile.created_at)}` },
  ].filter((fact) => Boolean(fact.value));

  const totalSales = uploads.reduce((sum, note) => sum + Number(note.sales_count), 0);
  const totalDownloads = uploads.reduce((sum, note) => sum + Number(note.downloads), 0);
  const totalReviews = uploads.reduce((sum, note) => sum + Number(note.rating_count), 0);
  const weightedRating =
    totalReviews > 0
      ? uploads.reduce(
          (sum, note) => sum + Number(note.rating_avg) * Number(note.rating_count),
          0
        ) / totalReviews
      : 0;

  const level = getLevel(Number(profile.points));
  const nextLevel = getNextLevel(Number(profile.points));
  const achievements = getAchievements({
    uploadCount: uploads.length,
    salesCount: totalSales,
    downloadCount: totalDownloads,
    reviewCount: totalReviews,
    ratingAvg: weightedRating,
    isVerified: profile.is_verified,
    points: Number(profile.points),
  });
  const earnedAchievements = achievements.filter((achievement) => achievement.earned);

  return (
    <div className="container py-8 md:py-10">
      <section className="flex flex-col items-start gap-6 rounded-xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center md:p-8">
        <Avatar className="h-20 w-20 md:h-24 md:w-24">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
          )}
          <AvatarFallback className="text-xl">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            {profile.full_name}
            {profile.is_verified && <VerifiedBadge className="[&>svg]:h-5 [&>svg]:w-5" />}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
          )}
          {facts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {facts.map((fact, index) => (
                <span key={index} className="inline-flex items-center gap-1.5">
                  <fact.icon className="h-4 w-4" />
                  {fact.value}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <ShoppingBag className="h-3.5 w-3.5" />
              {totalSales} {totalSales === 1 ? "sale" : "sales"}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <Download className="h-3.5 w-3.5" />
              {totalDownloads} downloads
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Followers coming soon
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
              <Star className="h-3.5 w-3.5" />
              Reviews coming soon
            </Badge>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">
              Level {level.level} — {level.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {Number(profile.points).toLocaleString()} contribution points
              {nextLevel
                ? ` · ${(nextLevel.minPoints - Number(profile.points)).toLocaleString()} to ${nextLevel.name}`
                : " · Highest level reached"}
            </p>
          </div>
          {nextLevel && (
            <div
              className="h-2 w-full max-w-56 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(
                ((Number(profile.points) - level.minPoints) /
                  (nextLevel.minPoints - level.minPoints)) *
                  100
              )}
              aria-label="Progress to next level"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(
                    ((Number(profile.points) - level.minPoints) /
                      (nextLevel.minPoints - level.minPoints)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {earnedAchievements.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {earnedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="rounded-lg border bg-muted/30 p-3"
                title={achievement.description}
              >
                <achievement.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-medium">{achievement.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">
          Uploads <span className="text-muted-foreground">({uploads.length})</span>
        </h2>
        {uploads.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={FileText}
              title={isOwner ? "You haven't uploaded anything yet" : "No uploads yet"}
              description={
                isOwner
                  ? "Publish your first notes and they'll appear on your public profile."
                  : `${profile.full_name} hasn't shared any study material yet.`
              }
              actionLabel={isOwner ? "Upload notes" : undefined}
              actionHref={isOwner ? "/upload" : undefined}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {uploads.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>

      {isOwner && (
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">
            Your bookmarks{" "}
            <span className="text-muted-foreground">({bookmarks.length})</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only you can see this section.
          </p>
          {bookmarks.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No bookmarks yet"
                description="Save notes while browsing and they'll show up here."
                actionLabel="Browse notes"
                actionHref="/browse"
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bookmarks.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
