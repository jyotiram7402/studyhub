import { createClient } from "@/lib/supabase/server";
import type { Rating, ReviewWithReviewer } from "@/lib/types";

const REVIEW_SELECT = `
  *,
  reviewer:profiles!reviews_reviewer_id_fkey (id, username, full_name, avatar_url, is_verified)
` as const;

export async function getNoteReviews(noteId: string): Promise<ReviewWithReviewer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("note_id", noteId)
    .order("helpful_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ReviewWithReviewer[];
}

export async function getNoteRating(noteId: string): Promise<Rating | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("note_id", noteId)
    .maybeSingle();

  return data as Rating | null;
}

export async function getReviewEligibility(
  noteId: string,
  userId: string | undefined
): Promise<{ canReview: boolean; existingReview: ReviewWithReviewer | null }> {
  if (!userId) return { canReview: false, existingReview: null };

  const supabase = await createClient();

  const [note, purchase, download, existing] = await Promise.all([
    supabase.from("notes").select("uploader_id").eq("id", noteId).maybeSingle(),
    supabase
      .from("purchases")
      .select("id")
      .eq("buyer_id", userId)
      .eq("note_id", noteId)
      .maybeSingle(),
    supabase
      .from("downloads")
      .select("id")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("note_id", noteId)
      .eq("reviewer_id", userId)
      .maybeSingle(),
  ]);

  const isUploader = note.data?.uploader_id === userId;
  const hasAccess = Boolean(purchase.data || download.data);

  return {
    canReview: !isUploader && hasAccess,
    existingReview: (existing.data as unknown as ReviewWithReviewer) ?? null,
  };
}

export async function getVotedReviewIds(
  userId: string | undefined,
  reviewIds: string[]
): Promise<Set<string>> {
  if (!userId || reviewIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("review_votes")
    .select("review_id")
    .eq("voter_id", userId)
    .in("review_id", reviewIds);

  return new Set((data ?? []).map((row) => row.review_id as string));
}
