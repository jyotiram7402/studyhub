import { Star } from "lucide-react";
import { HelpfulButton } from "@/components/reviews/helpful-button";
import { ReviewForm } from "@/components/reviews/review-form";
import { RatingStars } from "@/components/notes/rating-stars";
import { VerifiedBadge } from "@/components/notes/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getNoteRating,
  getNoteReviews,
  getReviewEligibility,
  getVotedReviewIds,
} from "@/lib/queries/reviews";
import { getInitials, timeAgo } from "@/lib/utils";

interface ReviewsSectionProps {
  noteId: string;
  userId: string | undefined;
}

export async function ReviewsSection({ noteId, userId }: ReviewsSectionProps) {
  const [reviews, rating, eligibility] = await Promise.all([
    getNoteReviews(noteId),
    getNoteRating(noteId),
    getReviewEligibility(noteId, userId),
  ]);

  const votedIds = await getVotedReviewIds(
    userId,
    reviews.map((review) => review.id)
  );

  const stars = rating
    ? [rating.star_5, rating.star_4, rating.star_3, rating.star_2, rating.star_1]
    : [0, 0, 0, 0, 0];
  const total = rating?.count ?? 0;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold tracking-tight">
        Reviews {total > 0 && <span className="text-muted-foreground">({total})</span>}
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {rating ? rating.average.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">out of 5</span>
            </div>
            <RatingStars className="mt-2" rating={rating?.average ?? 0} count={total} />
            <div className="mt-4 space-y-1.5">
              {stars.map((count, index) => {
                const starValue = 5 - index;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={starValue} className="flex items-center gap-2 text-xs">
                    <span className="flex w-8 items-center gap-0.5 text-muted-foreground">
                      {starValue}
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {eligibility.canReview ? (
            <ReviewForm noteId={noteId} existingReview={eligibility.existingReview} />
          ) : (
            !userId && (
              <p className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                Purchase or download this resource to leave a review.
              </p>
            )
          )}
        </div>

        <div>
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
              <p className="text-sm font-medium">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to tell other students whether this helped you.
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {review.reviewer.avatar_url && (
                          <AvatarImage
                            src={review.reviewer.avatar_url}
                            alt={review.reviewer.full_name}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(review.reviewer.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="flex items-center gap-1 text-sm font-medium">
                          {review.reviewer.full_name}
                          {review.reviewer.is_verified && <VerifiedBadge />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(review.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0" aria-label={`${review.rating} stars`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={
                            index < review.rating
                              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                              : "h-3.5 w-3.5 text-muted-foreground/40"
                          }
                        />
                      ))}
                    </span>
                  </div>

                  {review.title && <p className="mt-3 text-sm font-medium">{review.title}</p>}
                  {review.body && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {review.body}
                    </p>
                  )}

                  <div className="mt-3">
                    <HelpfulButton
                      reviewId={review.id}
                      helpfulCount={review.helpful_count}
                      initialVoted={votedIds.has(review.id)}
                      isSignedIn={Boolean(userId)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
