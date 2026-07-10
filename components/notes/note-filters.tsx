"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ACCEPTED_FILE_EXTENSIONS, LANGUAGES, SEMESTERS } from "@/lib/constants";
import type { Category, Course, Subject, University } from "@/lib/types";

interface NoteFiltersProps {
  categories: Category[];
  universities: University[];
  courses: Course[];
  subjects: Subject[];
}

const FILTER_KEYS = [
  "category",
  "university",
  "course",
  "subject",
  "semester",
  "language",
  "fileType",
  "price",
  "minPrice",
  "maxPrice",
] as const;

function FilterControls({ categories, universities, courses, subjects }: NoteFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((key) => params.delete(key));
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const hasActiveFilters = FILTER_KEYS.some((key) => searchParams.has(key));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="filter-category">Category</Label>
        <Select
          id="filter-category"
          value={searchParams.get("category") ?? ""}
          onChange={(event) => setParam("category", event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-university">University / Board</Label>
        <Select
          id="filter-university"
          value={searchParams.get("university") ?? ""}
          onChange={(event) => setParam("university", event.target.value)}
        >
          <option value="">All universities</option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
              {university.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-course">Course</Label>
        <Select
          id="filter-course"
          value={searchParams.get("course") ?? ""}
          onChange={(event) => setParam("course", event.target.value)}
        >
          <option value="">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-subject">Subject</Label>
        <Select
          id="filter-subject"
          value={searchParams.get("subject") ?? ""}
          onChange={(event) => setParam("subject", event.target.value)}
        >
          <option value="">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-semester">Semester</Label>
        <Select
          id="filter-semester"
          value={searchParams.get("semester") ?? ""}
          onChange={(event) => setParam("semester", event.target.value)}
        >
          <option value="">Any semester</option>
          {SEMESTERS.map((semester) => (
            <option key={semester} value={semester}>
              {semester}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-language">Language</Label>
        <Select
          id="filter-language"
          value={searchParams.get("language") ?? ""}
          onChange={(event) => setParam("language", event.target.value)}
        >
          <option value="">Any language</option>
          {LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-file-type">File type</Label>
        <Select
          id="filter-file-type"
          value={searchParams.get("fileType") ?? ""}
          onChange={(event) => setParam("fileType", event.target.value)}
        >
          <option value="">Any type</option>
          {ACCEPTED_FILE_EXTENSIONS.map((extension) => (
            <option key={extension} value={extension}>
              {extension.toUpperCase()}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-price">Price</Label>
        <Select
          id="filter-price"
          value={searchParams.get("price") ?? ""}
          onChange={(event) => setParam("price", event.target.value)}
        >
          <option value="">Free & paid</option>
          <option value="free">Free only</option>
          <option value="paid">Paid only</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-min-price">Price range (₹)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="filter-min-price"
            key={`min-${searchParams.get("minPrice") ?? ""}`}
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(event) => setParam("minPrice", event.target.value)}
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            key={`max-${searchParams.get("maxPrice") ?? ""}`}
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(event) => setParam("maxPrice", event.target.value)}
            aria-label="Maximum price"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );
}

export function NoteFilters(props: NoteFiltersProps) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Filters</h2>
          <FilterControls {...props} />
        </div>
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterControls {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
