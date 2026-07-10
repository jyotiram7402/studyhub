import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Star } from "lucide-react";
import { AdminSearch } from "@/components/admin/admin-search";
import { ReviewDeleteButton } from "@/components/admin/review-delete-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reviews",
};

type AdminReviewRow = Review & {
  note: { id: string; title: string } | null;
  reviewer: { username: string; full_name: string } | null;
};

export default async function AdminReviewsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const supabase = await createClient();

  let request = supabase
    .from("reviews")
    .select(
      "*, note:notes (id, title), reviewer:profiles!reviews_reviewer_id_fkey (username, full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    const term = q.replace(/[,()%]/g, "");
    request = request.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  }

  const { data } = await request;
  const reviews = (data ?? []) as unknown as AdminReviewRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest reviews across the marketplace. Deleting a review recalculates the
            note&apos;s rating.
          </p>
        </div>
        <Suspense>
          <AdminSearch placeholder="Search review text..." />
        </Suspense>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No reviews {q ? "match your search" : "yet"}.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 text-sm font-medium">
                      {review.rating}
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    {review.note && (
                      <Link
                        href={`/notes/${review.note.id}`}
                        className="line-clamp-1 text-sm hover:text-primary"
                      >
                        {review.note.title}
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    By {review.reviewer ? `@${review.reviewer.username}` : "unknown"} ·{" "}
                    {formatDate(review.created_at)} · {review.helpful_count} helpful votes
                  </p>
                  {(review.title || review.body) && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {review.title && <span className="font-medium">{review.title} — </span>}
                      {review.body}
                    </p>
                  )}
                </div>
                <ReviewDeleteButton reviewId={review.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
