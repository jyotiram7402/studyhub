import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotesPaginationProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

function buildHref(searchParams: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "page") params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/browse?${query}` : "/browse";
}

export function NotesPagination({ page, totalPages, searchParams }: NotesPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={buildHref(searchParams, page - 1)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          page <= 1 && "pointer-events-none opacity-50"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Link>
      {pages.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={buildHref(searchParams, pageNumber)}
          aria-current={pageNumber === page ? "page" : undefined}
          className={cn(
            buttonVariants({
              variant: pageNumber === page ? "default" : "outline",
              size: "icon",
            })
          )}
        >
          {pageNumber}
        </Link>
      ))}
      <Link
        href={buildHref(searchParams, page + 1)}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          page >= totalPages && "pointer-events-none opacity-50"
        )}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Link>
    </nav>
  );
}
