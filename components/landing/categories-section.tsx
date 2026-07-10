import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  ClipboardList,
  FileQuestion,
  FileText,
  FlaskConical,
  FolderKanban,
  Layers,
  NotebookPen,
  Presentation,
  Wrench,
} from "lucide-react";
import type { Category } from "@/lib/types";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "handwritten-notes": NotebookPen,
  "classroom-notes": FileText,
  "question-papers": FileQuestion,
  assignments: ClipboardList,
  "practical-files": FlaskConical,
  "mini-projects": Wrench,
  "major-projects": FolderKanban,
  presentations: Presentation,
  "study-material": BookMarked,
  "lab-manuals": Layers,
};

export function CategoriesSection({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="border-y bg-muted/30">
      <div className="container py-20 md:py-24">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every kind of study material
            </h2>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              From last-minute handwritten notes to complete final-year projects.
            </p>
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? FileText;
            return (
              <Link
                key={category.id}
                href={`/browse?category=${category.id}`}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-medium leading-snug">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
