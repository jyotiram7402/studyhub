import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText, toVectorLiteral } from "@/lib/ai/gemini";

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SIGNAL_NOTE_LIMIT = 10;
const RECOMMENDATION_COUNT = 8;

interface EmbeddingRow {
  note_id: string;
  embedding: string;
}

function parseVector(value: string): number[] {
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map(Number);
}

function averageVectors(vectors: number[][]): number[] {
  const length = vectors[0].length;
  const sum = new Array<number>(length).fill(0);
  for (const vector of vectors) {
    for (let i = 0; i < length; i++) sum[i] += vector[i];
  }
  return sum.map((value) => value / vectors.length);
}

async function collectSignalNoteIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const [purchases, bookmarks, viewed] = await Promise.all([
    supabase
      .from("purchases")
      .select("note_id")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })
      .limit(SIGNAL_NOTE_LIMIT),
    supabase
      .from("bookmarks")
      .select("note_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(SIGNAL_NOTE_LIMIT),
    supabase
      .from("recently_viewed")
      .select("note_id")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(SIGNAL_NOTE_LIMIT),
  ]);

  const ids = new Set<string>();
  for (const rows of [purchases.data, bookmarks.data, viewed.data]) {
    for (const row of rows ?? []) ids.add(row.note_id as string);
  }
  return ids;
}

async function recentSearchQueries(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("activity_logs")
    .select("metadata")
    .eq("user_id", userId)
    .eq("action", "search")
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? [])
    .map((row) => (row.metadata as { q?: string } | null)?.q)
    .filter((q): q is string => Boolean(q));
}

export async function refreshRecommendations(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: latest } = await supabase
    .from("recommendations")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && Date.now() - new Date(latest.created_at).getTime() < REFRESH_INTERVAL_MS) {
    return;
  }

  const signalIds = await collectSignalNoteIds(supabase, userId);
  const searches = await recentSearchQueries(supabase, userId);

  const vectors: number[][] = [];

  if (signalIds.size > 0) {
    const { data: embeddingRows } = await supabase
      .from("embeddings")
      .select("note_id, embedding")
      .in("note_id", Array.from(signalIds));
    for (const row of (embeddingRows ?? []) as EmbeddingRow[]) {
      vectors.push(parseVector(row.embedding));
    }
  }

  if (searches.length > 0) {
    vectors.push(await embedText(searches.join("\n")));
  }

  if (vectors.length === 0) return;

  const profileVector = averageVectors(vectors);
  const { data: matches } = await supabase.rpc("match_notes", {
    query_embedding: toVectorLiteral(profileVector),
    match_count: RECOMMENDATION_COUNT + signalIds.size + 5,
  });

  const { data: ownNotes } = await supabase
    .from("notes")
    .select("id")
    .eq("uploader_id", userId);
  const excluded = new Set([...signalIds, ...(ownNotes ?? []).map((n) => n.id as string)]);

  const picks = ((matches ?? []) as { note_id: string; similarity: number }[])
    .filter((match) => !excluded.has(match.note_id))
    .slice(0, RECOMMENDATION_COUNT);

  if (picks.length === 0) return;

  await supabase.from("recommendations").delete().eq("user_id", userId);
  await supabase.from("recommendations").insert(
    picks.map((pick) => ({
      user_id: userId,
      note_id: pick.note_id,
      score: Math.round(pick.similarity * 100000) / 100000,
      reason: "Similar to your purchases, bookmarks, and recent activity",
    }))
  );
}
