import Image from "next/image";
import Link from "next/link";
import { Bookmark, Download, Eye } from "lucide-react";
import { FileTypeIcon } from "@/components/notes/file-type-icon";
import { QualityBadges } from "@/components/notes/quality-badges";
import { Badge } from "@/components/ui/badge";
import { getThumbnailUrl } from "@/lib/storage";
import { finalPrice, formatCount, formatPrice, timeAgo } from "@/lib/utils";
import type { NoteWithRelations } from "@/lib/types";

export function NoteCard({ note }: { note: NoteWithRelations }) {
  const thumbnailUrl = getThumbnailUrl(note.thumbnail_path);

  return (
    <Link
      href={`/notes/${note.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b bg-muted/50">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={note.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <FileTypeIcon fileType={note.file_type} className="h-12 w-12 opacity-80" />
        )}
        <span className="absolute left-3 top-3">
          <Badge variant="secondary" className="uppercase shadow-sm">
            {note.file_type}
          </Badge>
        </span>
        <span className="absolute bottom-3 left-3">
          <QualityBadges note={note} limit={1} />
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1.5">
          {note.discount_percent > 0 && note.price > 0 && (
            <Badge variant="success" className="shadow-sm">
              -{note.discount_percent}%
            </Badge>
          )}
          {note.price > 0 ? (
            <Badge className="shadow-sm">
              {formatPrice(finalPrice(note.price, note.discount_percent))}
            </Badge>
          ) : (
            <Badge variant="success" className="shadow-sm">
              Free
            </Badge>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-medium leading-snug group-hover:text-primary">
          {note.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {[note.subject?.name, note.course?.name, note.semester]
            .filter(Boolean)
            .join(" · ") || note.category.name}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span className="line-clamp-1">
            {note.uploader.full_name} · {timeAgo(note.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(note.views)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {formatCount(note.downloads)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5" />
            {formatCount(note.bookmarks_count)}
          </span>
        </div>
      </div>
    </Link>
  );
}
