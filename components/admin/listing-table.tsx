import Link from "next/link";
import { FeatureActions } from "@/components/admin/feature-actions";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { finalPrice, formatDate, formatPrice } from "@/lib/utils";

interface AdminListingRow {
  id: string;
  title: string;
  price: number;
  discount_percent: number;
  moderation_status: string;
  visibility: string;
  sales_count: number;
  rating_avg: number;
  created_at: string;
  uploader: { username: string; full_name: string } | null;
  featured: { kind: "featured" | "editors_choice" } | null;
}

const statusVariant: Record<string, "success" | "secondary" | "outline" | "destructive"> = {
  approved: "success",
  pending: "secondary",
  hidden: "outline",
  removed: "destructive",
};

interface ListingTableProps {
  query?: string;
  projectsOnly?: boolean;
}

export async function ListingTable({ query, projectsOnly }: ListingTableProps) {
  const supabase = await createClient();

  let request = supabase
    .from("notes")
    .select(
      `id, title, price, discount_percent, moderation_status, visibility, sales_count,
       rating_avg, created_at,
       uploader:profiles!notes_uploader_id_fkey (username, full_name),
       featured:featured_products (kind)`
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (projectsOnly) {
    const { data: projectCategories } = await supabase
      .from("categories")
      .select("id")
      .in("slug", ["mini-projects", "major-projects"]);
    const ids = (projectCategories ?? []).map((c) => c.id as string);
    if (ids.length > 0) {
      request = request.in("category_id", ids);
    }
  }
  if (query) {
    request = request.ilike("title", `%${query}%`);
  }

  const { data } = await request;
  const listings = (data ?? []) as unknown as AdminListingRow[];

  if (listings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {query ? `No listings match “${query}”.` : "No listings yet."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/notes/${listing.id}`}
                className="line-clamp-1 text-sm font-medium hover:text-primary"
              >
                {listing.title}
              </Link>
              <Badge
                variant={statusVariant[listing.moderation_status] ?? "secondary"}
                className="capitalize"
              >
                {listing.moderation_status}
              </Badge>
              {listing.visibility === "private" && <Badge variant="outline">Private</Badge>}
              {listing.featured && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400">
                  {listing.featured.kind === "editors_choice" ? "Editor's Choice" : "Featured"}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {listing.uploader ? `@${listing.uploader.username}` : "Unknown seller"} ·{" "}
              {formatDate(listing.created_at)} ·{" "}
              {listing.price > 0
                ? formatPrice(finalPrice(listing.price, listing.discount_percent))
                : "Free"}{" "}
              · {listing.sales_count} sales · {Number(listing.rating_avg).toFixed(1)} ★
            </p>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <ModerationActions
              noteId={listing.id}
              moderationStatus={listing.moderation_status}
            />
            <FeatureActions noteId={listing.id} featuredKind={listing.featured?.kind ?? null} />
          </div>
        </div>
      ))}
    </div>
  );
}
