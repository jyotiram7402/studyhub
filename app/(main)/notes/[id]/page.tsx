import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bookmark,
  Building2,
  Calendar,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Languages,
  Layers,
} from "lucide-react";
import { BookmarkButton } from "@/components/notes/bookmark-button";
import { BuyButton } from "@/components/notes/buy-button";
import { DownloadButton } from "@/components/notes/download-button";
import { FileTypeIcon } from "@/components/notes/file-type-icon";
import { NoteCard } from "@/components/notes/note-card";
import { PriceTag } from "@/components/notes/price-tag";
import { QualityBadges } from "@/components/notes/quality-badges";
import { RatingStars } from "@/components/notes/rating-stars";
import { ReportButton } from "@/components/notes/report-button";
import { ShareButton } from "@/components/notes/share-button";
import { VerifiedBadge } from "@/components/notes/verified-badge";
import { ViewTracker } from "@/components/notes/view-tracker";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { AiSummaryCard } from "@/components/ai/ai-summary-card";
import { StudyToolsPanel } from "@/components/ai/study-tools-panel";
import { isAiConfigured } from "@/lib/ai/gemini";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getNoteById, getNoteTags, getRelatedNotes } from "@/lib/queries/notes";
import { getThumbnailUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { finalPrice, formatBytes, formatCount, formatDate, getInitials } from "@/lib/utils";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: NotePageProps): Promise<Metadata> {
  const { id } = await props.params;
  const note = await getNoteById(id).catch(() => null);
  if (!note) return { title: "Note not found" };

  const description = note.description.slice(0, 160);
  const thumbnailUrl = getThumbnailUrl(note.thumbnail_path);

  return {
    title: note.title,
    description,
    alternates: { canonical: `/notes/${note.id}` },
    openGraph: {
      type: "article",
      title: note.title,
      description,
      url: `/notes/${note.id}`,
      ...(thumbnailUrl ? { images: [{ url: thumbnailUrl, alt: note.title }] } : {}),
    },
    twitter: {
      card: thumbnailUrl ? "summary_large_image" : "summary",
      title: note.title,
      description,
    },
  };
}

export default async function NotePage(props: NotePageProps) {
  const { id } = await props.params;
  const note = await getNoteById(id).catch(() => null);

  if (!note || note.status !== "published") {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tags, relatedNotes, bookmark, purchase] = await Promise.all([
    getNoteTags(note.id),
    getRelatedNotes(note),
    user
      ? supabase
          .from("bookmarks")
          .select("note_id")
          .eq("user_id", user.id)
          .eq("note_id", note.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("purchases")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("note_id", note.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isOwner = user?.id === note.uploader_id;
  const hasAccess = note.price <= 0 || isOwner || Boolean(purchase.data);

  const thumbnailUrl = getThumbnailUrl(note.thumbnail_path);

  const details = [
    { icon: Building2, label: "University / Board", value: note.university?.name ?? note.board },
    { icon: GraduationCap, label: "Course", value: note.course?.name },
    { icon: Layers, label: "Semester", value: note.semester },
    { icon: FileText, label: "Subject", value: note.subject?.name },
    { icon: Building2, label: "College", value: note.college },
    { icon: Layers, label: "Department", value: note.department },
    { icon: Languages, label: "Language", value: note.language },
    { icon: FileText, label: "Version", value: note.version },
    { icon: FileText, label: "Edition", value: note.edition },
  ].filter((detail) => Boolean(detail.value));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: note.title,
        description: note.description.slice(0, 300),
        ...(thumbnailUrl ? { image: thumbnailUrl } : {}),
        brand: { "@type": "Organization", name: "StudyHub" },
        ...(note.rating_count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(note.rating_avg).toFixed(1),
                reviewCount: note.rating_count,
              },
            }
          : {}),
        offers: {
          "@type": "Offer",
          price: finalPrice(note.price, note.discount_percent).toFixed(2),
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: "Browse", item: "/browse" },
          {
            "@type": "ListItem",
            position: 3,
            name: note.category.name,
            item: `/browse?category=${note.category_id}`,
          },
          { "@type": "ListItem", position: 4, name: note.title },
        ],
      },
    ],
  };

  return (
    <div className="container py-8 md:py-10">
      <ViewTracker noteId={note.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/browse" className="hover:text-foreground">
              Browse
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/browse?category=${note.category_id}`} className="hover:text-foreground">
              {note.category.name}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="line-clamp-1 max-w-[16rem] text-foreground">
            {note.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl border bg-muted/50">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={note.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <FileTypeIcon fileType={note.file_type} className="h-16 w-16" />
                <p className="text-sm">No preview image for this upload</p>
              </div>
            )}
          </div>

          {note.preview_pages > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {note.preview_pages} preview {note.preview_pages === 1 ? "page" : "pages"}{" "}
              included in the download.
            </p>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold">About this resource</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {note.description}
            </p>
          </div>

          <AiSummaryCard noteId={note.id} />

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/browse?q=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="font-normal">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <Badge variant="secondary" className="uppercase">
                {note.file_type} · {formatBytes(note.file_size)}
              </Badge>
              <PriceTag price={note.price} discountPercent={note.discount_percent} size="lg" />
            </div>
            <h1 className="mt-4 text-xl font-bold leading-snug tracking-tight">
              {note.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{note.category.name}</p>
            <RatingStars className="mt-2" rating={note.rating_avg} count={note.rating_count} />
            <div className="mt-3">
              <QualityBadges note={note} limit={3} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {formatCount(note.views)} views
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                {formatCount(note.downloads)} downloads
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bookmark className="h-4 w-4" />
                {formatCount(note.bookmarks_count)} saved
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {hasAccess ? (
                  <DownloadButton noteId={note.id} isSignedIn={Boolean(user)} />
                ) : (
                  <BuyButton noteId={note.id} isSignedIn={Boolean(user)} />
                )}
                <div className="flex gap-2">
                  <BookmarkButton
                    noteId={note.id}
                    initialBookmarked={Boolean(bookmark.data)}
                    isSignedIn={Boolean(user)}
                  />
                  <ShareButton title={note.title} path={`/notes/${note.id}`} />
                </div>
              </div>
              {purchase.data && (
                <p className="text-xs text-muted-foreground">
                  You own this resource — download it anytime from your library.
                </p>
              )}
              {note.price > 0 && !hasAccess && (
                <p className="text-xs text-muted-foreground">
                  Instant download access after payment. Test mode — no real money moves.
                </p>
              )}
            </div>

            <Separator className="my-6" />

            <Link
              href={`/profile/${note.uploader.username}`}
              className="group flex items-center gap-3"
            >
              <Avatar>
                {note.uploader.avatar_url && (
                  <AvatarImage src={note.uploader.avatar_url} alt={note.uploader.full_name} />
                )}
                <AvatarFallback>{getInitials(note.uploader.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium group-hover:text-primary">
                  {note.uploader.full_name}
                  {note.uploader.is_verified && <VerifiedBadge />}
                </p>
                <p className="text-xs text-muted-foreground">@{note.uploader.username}</p>
              </div>
            </Link>

            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Uploaded {formatDate(note.created_at)}
            </p>

            <div className="mt-4">
              <ReportButton noteId={note.id} isSignedIn={Boolean(user)} />
            </div>
          </div>

          {details.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-sm font-semibold">Details</h2>
              <dl className="mt-4 space-y-3">
                {details.map((detail) => (
                  <div key={detail.label} className="flex items-start gap-3 text-sm">
                    <detail.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <dt className="text-xs text-muted-foreground">{detail.label}</dt>
                      <dd className="font-medium">{detail.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </aside>
      </div>

      {user && hasAccess && isAiConfigured() && <StudyToolsPanel noteId={note.id} />}

      <ReviewsSection noteId={note.id} userId={user?.id} />

      {relatedNotes.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight">Related notes</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedNotes.map((relatedNote) => (
              <NoteCard key={relatedNote.id} note={relatedNote} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
