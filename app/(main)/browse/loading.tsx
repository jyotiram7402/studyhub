import { NoteGridSkeleton } from "@/components/notes/note-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <div className="container py-8 md:py-10">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-32" />
      <div className="mt-6 flex gap-8">
        <div className="hidden w-60 shrink-0 lg:block">
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex justify-end">
            <Skeleton className="h-9 w-44" />
          </div>
          <NoteGridSkeleton count={9} />
        </div>
      </div>
    </div>
  );
}
