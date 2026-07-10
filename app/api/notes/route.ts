import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createNoteSchema } from "@/lib/validations/note";

async function resolveByName(
  supabase: SupabaseClient,
  table: "universities" | "courses" | "subjects",
  name: string | undefined
): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase
    .from(table)
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from(table)
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (error) {
    const { data: raced } = await supabase
      .from(table)
      .select("id")
      .ilike("name", trimmed)
      .maybeSingle();
    return raced?.id ?? null;
  }
  return created.id;
}

async function resolveTagIds(supabase: SupabaseClient, tags: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) continue;

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("name", normalized)
      .maybeSingle();

    if (existing) {
      ids.push(existing.id);
      continue;
    }

    const { data: created } = await supabase
      .from("tags")
      .insert({ name: normalized })
      .select("id")
      .single();

    if (created) ids.push(created.id);
  }
  return ids;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;

  if (!input.filePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
  if (input.thumbnailPath && !input.thumbnailPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid thumbnail path" }, { status: 400 });
  }

  const [universityId, courseId, subjectId] = await Promise.all([
    resolveByName(supabase, "universities", input.universityName),
    resolveByName(supabase, "courses", input.courseName),
    resolveByName(supabase, "subjects", input.subjectName),
  ]);

  const { data: note, error: insertError } = await supabase
    .from("notes")
    .insert({
      uploader_id: user.id,
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      university_id: universityId,
      course_id: courseId,
      subject_id: subjectId,
      college: input.college || null,
      board: input.board || null,
      semester: input.semester || null,
      department: input.department || null,
      language: input.language,
      price: input.price,
      discount_percent: input.discountPercent,
      version: input.version || null,
      edition: input.edition || null,
      visibility: input.visibility,
      file_path: input.filePath,
      file_name: input.fileName,
      file_size: input.fileSize,
      file_type: input.fileType,
      thumbnail_path: input.thumbnailPath || null,
      preview_pages: input.previewPages,
    })
    .select("id")
    .single();

  if (insertError || !note) {
    return NextResponse.json({ error: "Could not create note" }, { status: 500 });
  }

  if (input.tags.length > 0) {
    const tagIds = await resolveTagIds(supabase, input.tags);
    if (tagIds.length > 0) {
      await supabase
        .from("note_tags")
        .insert(tagIds.map((tagId) => ({ note_id: note.id, tag_id: tagId })));
    }
  }

  return NextResponse.json({ id: note.id }, { status: 201 });
}
