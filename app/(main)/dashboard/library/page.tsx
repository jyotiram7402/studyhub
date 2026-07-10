import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Library } from "lucide-react";
import { DownloadButton } from "@/components/notes/download-button";
import { EmptyState } from "@/components/notes/empty-state";
import { FileTypeIcon } from "@/components/notes/file-type-icon";
import { NoteCard } from "@/components/notes/note-card";
import { Badge } from "@/components/ui/badge";
import { getLibrary, getRecentlyViewed } from "@/lib/queries/orders";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My library",
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/library");

  const [purchases, recentlyViewed] = await Promise.all([
    getLibrary(user.id),
    getRecentlyViewed(user.id),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you&apos;ve purchased — download again anytime.
        </p>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Your library is empty"
          description="Notes, papers, and projects you purchase will appear here with lifetime download access."
          actionLabel="Browse paid notes"
          actionHref="/browse?price=paid"
        />
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <FileTypeIcon
                fileType={purchase.note.file_type}
                className="hidden h-8 w-8 shrink-0 sm:block"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/notes/${purchase.note.id}`}
                  className="line-clamp-1 text-sm font-medium hover:text-primary"
                >
                  {purchase.note.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {purchase.note.category.name} · Purchased{" "}
                  {formatDate(purchase.created_at)} · {formatPrice(purchase.price_paid)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="uppercase">
                  {purchase.note.file_type}
                </Badge>
                <DownloadButton noteId={purchase.note.id} isSignedIn />
              </div>
            </div>
          ))}
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recently viewed
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {recentlyViewed.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
