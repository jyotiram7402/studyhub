import { embedText, isAiConfigured, toVectorLiteral } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { NOTES_PAGE_SIZE } from "@/lib/constants";
import type {
  Category,
  Course,
  NoteFilters,
  NoteWithRelations,
  Subject,
  University,
} from "@/lib/types";

export const NOTE_SELECT = `
  *,
  uploader:profiles!notes_uploader_id_fkey (id, username, full_name, avatar_url, is_verified),
  category:categories (id, name, slug),
  university:universities (id, name),
  course:courses (id, name),
  subject:subjects (id, name),
  featured:featured_products (kind)
` as const;

async function semanticNoteIds(query: string): Promise<string[]> {
  const supabase = await createClient();
  const embedding = await embedText(query);
  const { data, error } = await supabase.rpc("match_notes", {
    query_embedding: toVectorLiteral(embedding),
    match_count: 40,
  });
  if (error) throw error;
  return ((data ?? []) as { note_id: string }[]).map((row) => row.note_id);
}

export async function getNotes(filters: NoteFilters): Promise<{
  notes: NoteWithRelations[];
  count: number;
  page: number;
  totalPages: number;
}> {
  const supabase = await createClient();
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * NOTES_PAGE_SIZE;

  // Natural-language search goes through vector similarity first and falls
  // back to full-text search when embeddings are unavailable.
  let semanticIds: string[] | null = null;
  if (filters.q && isAiConfigured()) {
    try {
      const ids = await semanticNoteIds(filters.q);
      semanticIds = ids.length > 0 ? ids : null;
    } catch {
      semanticIds = null;
    }
  }

  let query = supabase
    .from("notes")
    .select(NOTE_SELECT, { count: "exact" })
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("moderation_status", "approved");

  if (semanticIds) {
    query = query.in("id", semanticIds);
  } else if (filters.q) {
    query = query.textSearch("search_vector", filters.q, {
      type: "websearch",
      config: "simple",
    });
  }
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.university) query = query.eq("university_id", filters.university);
  if (filters.course) query = query.eq("course_id", filters.course);
  if (filters.subject) query = query.eq("subject_id", filters.subject);
  if (filters.semester) query = query.eq("semester", filters.semester);
  if (filters.department) query = query.ilike("department", `%${filters.department}%`);
  if (filters.language) query = query.eq("language", filters.language);
  if (filters.fileType) query = query.eq("file_type", filters.fileType);
  if (filters.price === "free") query = query.eq("price", 0);
  if (filters.price === "paid") query = query.gt("price", 0);
  if (filters.minPrice !== undefined && !Number.isNaN(filters.minPrice)) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined && !Number.isNaN(filters.maxPrice)) {
    query = query.lte("price", filters.maxPrice);
  }

  switch (filters.sort) {
    case "popular":
      query = query.order("downloads", { ascending: false });
      break;
    case "views":
      query = query.order("views", { ascending: false });
      break;
    case "bestseller":
      query = query.order("sales_count", { ascending: false });
      break;
    case "rating":
      query = query
        .order("rating_avg", { ascending: false })
        .order("rating_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (semanticIds) {
    const { data, error } = await query;
    if (error) throw error;

    let notes = (data ?? []) as unknown as NoteWithRelations[];
    if (!filters.sort || filters.sort === "newest") {
      const rank = new Map(semanticIds.map((id, index) => [id, index]));
      notes = [...notes].sort(
        (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)
      );
    }

    const total = notes.length;
    return {
      notes: notes.slice(from, from + NOTES_PAGE_SIZE),
      count: total,
      page,
      totalPages: Math.max(Math.ceil(total / NOTES_PAGE_SIZE), 1),
    };
  }

  const { data, count, error } = await query.range(from, from + NOTES_PAGE_SIZE - 1);
  if (error) throw error;

  const total = count ?? 0;
  return {
    notes: (data ?? []) as unknown as NoteWithRelations[],
    count: total,
    page,
    totalPages: Math.max(Math.ceil(total / NOTES_PAGE_SIZE), 1),
  };
}

export async function getNoteById(id: string): Promise<NoteWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as NoteWithRelations | null;
}

export async function getRelatedNotes(
  note: NoteWithRelations,
  limit = 4
): Promise<NoteWithRelations[]> {
  // Prefer embedding similarity; fall back to category/subject matching when
  // the note hasn't been processed yet.
  if (isAiConfigured()) {
    try {
      const supabase = await createClient();
      const { data: matches } = await supabase.rpc("match_related_notes", {
        source_note_id: note.id,
        match_count: limit,
      });
      const ids = ((matches ?? []) as { note_id: string }[]).map((row) => row.note_id);
      if (ids.length > 0) {
        const { data } = await supabase.from("notes").select(NOTE_SELECT).in("id", ids);
        const rows = (data ?? []) as unknown as NoteWithRelations[];
        const rank = new Map(ids.map((id, index) => [id, index]));
        return [...rows].sort(
          (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)
        );
      }
    } catch {
      // fall through to keyword-based matching
    }
  }

  const supabase = await createClient();

  let query = supabase
    .from("notes")
    .select(NOTE_SELECT)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("moderation_status", "approved")
    .neq("id", note.id)
    .limit(limit);

  if (note.subject_id) {
    query = query.or(`subject_id.eq.${note.subject_id},category_id.eq.${note.category_id}`);
  } else {
    query = query.eq("category_id", note.category_id);
  }

  const { data, error } = await query.order("downloads", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as NoteWithRelations[];
}

export async function getNoteTags(noteId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("note_tags")
    .select("tag:tags (name)")
    .eq("note_id", noteId);

  if (error) throw error;
  return (data ?? [])
    .map((row) => (row.tag as unknown as { name: string } | null)?.name)
    .filter((name): name is string => Boolean(name));
}

export async function getFilterOptions(): Promise<{
  categories: Category[];
  universities: University[];
  courses: Course[];
  subjects: Subject[];
}> {
  const supabase = await createClient();

  const [categories, universities, courses, subjects] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("universities").select("*").order("name"),
    supabase.from("courses").select("*").order("name"),
    supabase.from("subjects").select("*").order("name"),
  ]);

  return {
    categories: categories.data ?? [],
    universities: universities.data ?? [],
    courses: courses.data ?? [],
    subjects: subjects.data ?? [],
  };
}

export async function getBookmarkedNoteIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookmarks")
    .select("note_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((row) => row.note_id as string));
}
