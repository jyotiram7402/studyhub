import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/notes/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { NoteFilters } from "@/components/notes/note-filters";
import { NotesPagination } from "@/components/notes/notes-pagination";
import { SortSelect } from "@/components/notes/sort-select";
import { getFilterOptions, getNotes } from "@/lib/queries/notes";
import type { NoteFilters as NoteFiltersType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Browse notes",
  description:
    "Search and filter study notes, question papers, assignments, and projects by university, course, semester, and subject.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BrowsePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const options = await getFilterOptions();

  const rawCategory = firstValue(searchParams.category);
  const category = rawCategory
    ? options.categories.find((c) => c.id === rawCategory || c.slug === rawCategory)?.id
    : undefined;

  const filters: NoteFiltersType = {
    q: firstValue(searchParams.q),
    category,
    university: firstValue(searchParams.university),
    course: firstValue(searchParams.course),
    subject: firstValue(searchParams.subject),
    semester: firstValue(searchParams.semester),
    department: firstValue(searchParams.department),
    language: firstValue(searchParams.language),
    fileType: firstValue(searchParams.fileType),
    price: firstValue(searchParams.price) as NoteFiltersType["price"],
    minPrice: firstValue(searchParams.minPrice)
      ? Number(firstValue(searchParams.minPrice))
      : undefined,
    maxPrice: firstValue(searchParams.maxPrice)
      ? Number(firstValue(searchParams.maxPrice))
      : undefined,
    sort: (firstValue(searchParams.sort) as NoteFiltersType["sort"]) ?? "newest",
    page: Number(firstValue(searchParams.page)) || 1,
  };

  const { notes, count, page, totalPages } = await getNotes(filters);

  const plainParams: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, firstValue(value)])
  );

  return (
    <div className="container py-8 md:py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {filters.q ? `Results for “${filters.q}”` : "Browse notes"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {count} {count === 1 ? "resource" : "resources"} found
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        <Suspense>
          <NoteFilters
            categories={options.categories}
            universities={options.universities}
            courses={options.courses}
            subjects={options.subjects}
          />
        </Suspense>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-end gap-3">
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>

          {notes.length === 0 ? (
            <EmptyState
              title="No notes match your search"
              description="Try removing a filter or searching with a broader term. New material is uploaded every day."
              actionLabel="Clear search"
              actionHref="/browse"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
              <div className="mt-10">
                <NotesPagination
                  page={page}
                  totalPages={totalPages}
                  searchParams={plainParams}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
