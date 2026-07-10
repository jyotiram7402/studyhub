"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { FileTypeIcon } from "@/components/notes/file-type-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_THUMBNAIL_TYPES,
  LANGUAGES,
  MAX_FILE_SIZE,
  MAX_THUMBNAIL_SIZE,
  NOTE_VISIBILITY_OPTIONS,
  SEMESTERS,
  STORAGE_BUCKETS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { formatBytes } from "@/lib/utils";
import { noteMetadataSchema } from "@/lib/validations/note";
import type { Category, Course, Subject, University } from "@/lib/types";

interface UploadFormProps {
  userId: string;
  categories: Category[];
  universities: University[];
  courses: Course[];
  subjects: Subject[];
}

export function UploadForm({
  userId,
  categories,
  universities,
  courses,
  subjects,
}: UploadFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_FILE_TYPES[selected.type]) {
      toast.error("Unsupported file type", {
        description: "Upload a PDF, DOC/DOCX, PPT/PPTX, ZIP, or image file.",
      });
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File is too large", {
        description: `The maximum file size is ${formatBytes(MAX_FILE_SIZE)}.`,
      });
      event.target.value = "";
      return;
    }
    setFile(selected);
  }

  function handleThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_THUMBNAIL_TYPES.includes(selected.type)) {
      toast.error("Thumbnail must be a PNG, JPG, or WEBP image.");
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_THUMBNAIL_SIZE) {
      toast.error("Thumbnail is too large", {
        description: `The maximum thumbnail size is ${formatBytes(MAX_THUMBNAIL_SIZE)}.`,
      });
      event.target.value = "";
      return;
    }
    setThumbnail(selected);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const tagsValue = String(formData.get("tags") ?? "");
    const parsed = noteMetadataSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId"),
      universityName: formData.get("universityName"),
      courseName: formData.get("courseName"),
      subjectName: formData.get("subjectName"),
      college: formData.get("college"),
      board: formData.get("board"),
      semester: formData.get("semester"),
      department: formData.get("department"),
      language: formData.get("language"),
      price: formData.get("price") || 0,
      discountPercent: formData.get("discountPercent") || 0,
      version: formData.get("version"),
      edition: formData.get("edition"),
      visibility: formData.get("visibility"),
      previewPages: formData.get("previewPages") || 0,
      tags: tagsValue
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message])
        )
      );
      toast.error("Fix the highlighted fields and try again.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const fileType = ACCEPTED_FILE_TYPES[file.type];
    const filePath = `${userId}/${crypto.randomUUID()}.${fileType}`;

    try {
      const { error: fileError } = await supabase.storage
        .from(STORAGE_BUCKETS.noteFiles)
        .upload(filePath, file, { contentType: file.type });

      if (fileError) {
        toast.error("File upload failed", { description: fileError.message });
        return;
      }

      let thumbnailPath = "";
      if (thumbnail) {
        const thumbnailExtension = ACCEPTED_FILE_TYPES[thumbnail.type];
        thumbnailPath = `${userId}/${crypto.randomUUID()}.${thumbnailExtension}`;
        const { error: thumbnailError } = await supabase.storage
          .from(STORAGE_BUCKETS.thumbnails)
          .upload(thumbnailPath, thumbnail, { contentType: thumbnail.type });

        if (thumbnailError) {
          toast.error("Thumbnail upload failed", { description: thumbnailError.message });
          return;
        }
      }

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          filePath,
          fileName: file.name,
          fileSize: file.size,
          fileType,
          thumbnailPath,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "Could not publish your notes. Please try again.");
        return;
      }

      const { id } = await response.json();

      fetch(`/api/notes/${id}/process`, { method: "POST" }).catch(() => {});

      toast.success("Notes published", {
        description: "AI is indexing your upload for search, summaries, and study tools.",
      });
      router.push(`/notes/${id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Files</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The main file students will download, plus an optional cover image.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={Object.keys(ACCEPTED_FILE_TYPES).join(",")}
              className="sr-only"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                <FileTypeIcon
                  fileType={ACCEPTED_FILE_TYPES[file.type]}
                  className="h-8 w-8 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <FileUp className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Choose a file</span>
                <span className="text-xs text-muted-foreground">
                  PDF, DOC, PPT, ZIP, or image · up to {formatBytes(MAX_FILE_SIZE)}
                </span>
              </button>
            )}
          </div>

          <div>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept={ACCEPTED_THUMBNAIL_TYPES.join(",")}
              className="sr-only"
              onChange={handleThumbnailChange}
            />
            {thumbnail ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                <ImagePlus className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{thumbnail.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(thumbnail.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove thumbnail"
                  onClick={() => {
                    setThumbnail(null);
                    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Add a thumbnail (optional)</span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, or WEBP · up to {formatBytes(MAX_THUMBNAIL_SIZE)}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Basics</h2>
        <div className="mt-5 space-y-4">
          <FormField label="Title" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              name="title"
              placeholder="DBMS Unit 1-5 handwritten notes with diagrams"
              required
            />
          </FormField>
          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description}
            hint="What does it cover? Which units, topics, or exam is it useful for?"
          >
            <Textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Complete handwritten notes covering all five units..."
              required
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category" htmlFor="categoryId" error={errors.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue="" required>
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Language" htmlFor="language" error={errors.language}>
              <Select id="language" name="language" defaultValue="English">
                {LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Course details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in whatever applies — these power search and filters.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormField label="Subject" htmlFor="subjectName" error={errors.subjectName}>
            <Input
              id="subjectName"
              name="subjectName"
              list="subject-options"
              placeholder="Database Management Systems"
              required
            />
            <datalist id="subject-options">
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Course" htmlFor="courseName" error={errors.courseName}>
            <Input
              id="courseName"
              name="courseName"
              list="course-options"
              placeholder="BTech"
            />
            <datalist id="course-options">
              {courses.map((course) => (
                <option key={course.id} value={course.name} />
              ))}
            </datalist>
          </FormField>
          <FormField
            label="University"
            htmlFor="universityName"
            error={errors.universityName}
          >
            <Input
              id="universityName"
              name="universityName"
              list="university-options"
              placeholder="University of Mumbai"
            />
            <datalist id="university-options">
              {universities.map((university) => (
                <option key={university.id} value={university.name} />
              ))}
            </datalist>
          </FormField>
          <FormField label="College" htmlFor="college" error={errors.college}>
            <Input id="college" name="college" placeholder="Your college name" />
          </FormField>
          <FormField label="Board" htmlFor="board" error={errors.board}>
            <Input id="board" name="board" placeholder="CBSE, State Board..." />
          </FormField>
          <FormField label="Semester" htmlFor="semester" error={errors.semester}>
            <Select id="semester" name="semester" defaultValue="">
              <option value="">Not applicable</option>
              {SEMESTERS.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Department" htmlFor="department" error={errors.department}>
            <Input
              id="department"
              name="department"
              placeholder="Computer Engineering"
            />
          </FormField>
          <FormField
            label="Tags"
            htmlFor="tags"
            error={errors.tags}
            hint="Comma separated, up to 8"
          >
            <Input id="tags" name="tags" placeholder="exam-prep, unit-wise, solved" />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Pricing & visibility</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a price to sell this resource, or leave it at 0 to share it for free.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Price (₹)"
            htmlFor="price"
            error={errors.price}
            hint="0 makes it free to download"
          >
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={0}
            />
          </FormField>
          <FormField
            label="Discount (%)"
            htmlFor="discountPercent"
            error={errors.discountPercent}
            hint="Optional launch discount, up to 90%"
          >
            <Input
              id="discountPercent"
              name="discountPercent"
              type="number"
              min={0}
              max={90}
              defaultValue={0}
            />
          </FormField>
          <FormField
            label="Version"
            htmlFor="version"
            error={errors.version}
            hint="e.g. v2, 2026 syllabus"
          >
            <Input id="version" name="version" placeholder="v1" />
          </FormField>
          <FormField
            label="Edition"
            htmlFor="edition"
            error={errors.edition}
            hint="e.g. 3rd edition, Revised"
          >
            <Input id="edition" name="edition" placeholder="First edition" />
          </FormField>
          <FormField
            label="Preview pages"
            htmlFor="previewPages"
            error={errors.previewPages}
            hint="How many pages buyers can preview before purchasing"
          >
            <Input
              id="previewPages"
              name="previewPages"
              type="number"
              min={0}
              max={20}
              defaultValue={0}
            />
          </FormField>
          <FormField label="Visibility" htmlFor="visibility" error={errors.visibility}>
            <Select id="visibility" name="visibility" defaultValue="public">
              {NOTE_VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Publishing..." : "Publish notes"}
        </Button>
      </div>
    </form>
  );
}
