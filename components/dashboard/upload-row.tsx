"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Eye, EyeOff, Loader2, Pencil, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FileTypeIcon } from "@/components/notes/file-type-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { finalPrice, formatCount, formatDate, formatPrice } from "@/lib/utils";
import type { NoteWithRelations } from "@/lib/types";

export function UploadRow({ note }: { note: NoteWithRelations }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${note.title}"? This removes the file permanently and cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!response.ok) {
      toast.error("Could not delete this upload. Please try again.");
      return;
    }

    toast.success("Upload deleted");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <FileTypeIcon fileType={note.file_type} className="h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/notes/${note.id}`}
          className="line-clamp-1 text-sm font-medium hover:text-primary"
        >
          {note.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            {note.category.name} · {formatDate(note.created_at)}
          </span>
          {note.visibility === "private" && (
            <span className="inline-flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              Private
            </span>
          )}
          {note.moderation_status !== "approved" && (
            <Badge variant="outline" className="capitalize">
              {note.moderation_status}
            </Badge>
          )}
          {note.plagiarism_score >= 90 && (
            <Badge variant="destructive">
              {Math.round(note.plagiarism_score)}% similar to another upload
            </Badge>
          )}
          {(note.ai_status === "pending" || note.ai_status === "processing") && (
            <Badge variant="outline">AI indexing…</Badge>
          )}
        </p>
      </div>
      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {formatCount(note.views)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Download className="h-3.5 w-3.5" />
          {formatCount(note.downloads)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ShoppingBag className="h-3.5 w-3.5" />
          {formatCount(note.sales_count)}
        </span>
        {note.price > 0 ? (
          <Badge variant="outline">
            {formatPrice(finalPrice(note.price, note.discount_percent))}
          </Badge>
        ) : (
          <Badge variant="success">Free</Badge>
        )}
      </div>
      <Button variant="ghost" size="icon" aria-label={`Edit ${note.title}`} asChild>
        <Link href={`/dashboard/uploads/${note.id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${note.title}`}
        className="text-muted-foreground hover:text-destructive"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
