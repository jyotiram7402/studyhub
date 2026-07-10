import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkText, estimateReadingMinutes } from "@/lib/ai/chunking";
import { extractDocumentText } from "@/lib/ai/extraction";
import { embedBatch, embedText, generateJson, toVectorLiteral } from "@/lib/ai/gemini";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type { Note } from "@/lib/types";

const PLAGIARISM_THRESHOLD = 0.9;
const ANALYSIS_TEXT_LIMIT = 24000;

interface NoteAnalysis {
  short_summary: string;
  key_topics: string[];
  important_points: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  auto_tags: string[];
  quality_score: number;
  quality_factors: {
    completeness: number;
    formatting: number;
    readability: number;
    topic_coverage: number;
  };
  detected: {
    department: string | null;
    semester: string | null;
    course: string | null;
    technology: string | null;
    programming_language: string | null;
  };
}

function buildMetadataText(note: Note & { subjectName?: string | null }): string {
  return [
    note.title,
    note.description,
    note.semester,
    note.department,
    note.board,
    note.college,
    note.language,
  ]
    .filter(Boolean)
    .join("\n");
}

function analysisPrompt(title: string, text: string): string {
  return [
    `Analyse this study document titled "${title}".`,
    "Return a JSON object with exactly these fields:",
    `{
  "short_summary": "2-3 sentence summary for a student deciding whether to download",
  "key_topics": ["up to 8 topics covered"],
  "important_points": ["up to 6 concrete takeaways or highlights"],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "auto_tags": ["up to 8 lowercase search keywords"],
  "quality_score": 0-100 integer judging overall usefulness,
  "quality_factors": { "completeness": 0-100, "formatting": 0-100, "readability": 0-100, "topic_coverage": 0-100 },
  "detected": {
    "department": "e.g. Computer Engineering or null",
    "semester": "e.g. Semester 3 or null",
    "course": "e.g. BTech, Class 12, MBA or null",
    "technology": "main technology/framework or null",
    "programming_language": "main programming language or null"
  }
}`,
    "Document content:",
    "---",
    text.slice(0, ANALYSIS_TEXT_LIMIT),
    "---",
  ].join("\n");
}

export async function processNote(supabase: SupabaseClient, note: Note): Promise<void> {
  await supabase.from("notes").update({ ai_status: "processing" }).eq("id", note.id);

  try {
    const metadataText = buildMetadataText(note);

    const { data: file } = await supabase.storage
      .from(STORAGE_BUCKETS.noteFiles)
      .download(note.file_path);

    const extraction = file
      ? await extractDocumentText(await file.arrayBuffer(), note.file_type, metadataText)
      : { text: metadataText, method: "metadata_only" as const };

    const fullText = extraction.text || metadataText;

    // Chunk and embed document content for retrieval
    const chunks = chunkText(fullText);
    if (chunks.length > 0) {
      const chunkEmbeddings = await embedBatch(chunks);
      await supabase.from("document_chunks").delete().eq("note_id", note.id);
      const { error: chunkError } = await supabase.from("document_chunks").insert(
        chunks.map((content, index) => ({
          note_id: note.id,
          chunk_index: index,
          content,
          embedding: toVectorLiteral(chunkEmbeddings[index]),
        }))
      );
      if (chunkError) throw new Error(chunkError.message);
    }

    // Note-level embedding for semantic search and recommendations
    const noteEmbedding = await embedText(
      `${note.title}\n${note.description}\n${fullText.slice(0, 6000)}`
    );
    const { error: embeddingError } = await supabase.from("embeddings").upsert(
      {
        note_id: note.id,
        content: `${note.title}\n${note.description}`.slice(0, 2000),
        embedding: toVectorLiteral(noteEmbedding),
      },
      { onConflict: "note_id" }
    );
    if (embeddingError) throw new Error(embeddingError.message);

    // Structured analysis: summary, tags, difficulty, quality, categorisation
    const analysis = await generateJson<NoteAnalysis>(
      analysisPrompt(note.title, fullText)
    );
    const readingTime =
      extraction.method === "metadata_only" ? null : estimateReadingMinutes(fullText);
    const qualityScore = Math.max(0, Math.min(100, Math.round(analysis.quality_score)));

    const { error: summaryError } = await supabase.from("summaries").upsert(
      {
        note_id: note.id,
        short_summary: analysis.short_summary,
        key_topics: (analysis.key_topics ?? []).slice(0, 8),
        important_points: (analysis.important_points ?? []).slice(0, 6),
        difficulty: analysis.difficulty,
        reading_time_minutes: readingTime,
        quality_score: qualityScore,
        quality_factors: analysis.quality_factors,
        auto_tags: (analysis.auto_tags ?? []).slice(0, 8),
        detected: analysis.detected,
      },
      { onConflict: "note_id" }
    );
    if (summaryError) throw new Error(summaryError.message);

    // Duplicate detection against existing public listings
    let plagiarismScore = 0;
    let plagiarismNoteId: string | null = null;
    const { data: matches } = await supabase.rpc("match_notes", {
      query_embedding: toVectorLiteral(noteEmbedding),
      match_count: 5,
    });
    const closest = (matches ?? []).find(
      (match: { note_id: string; similarity: number }) => match.note_id !== note.id
    );
    if (closest && closest.similarity >= PLAGIARISM_THRESHOLD) {
      plagiarismScore = Math.round(closest.similarity * 100 * 100) / 100;
      plagiarismNoteId = closest.note_id;
      await supabase.rpc("create_notification", {
        target_user: note.uploader_id,
        notif_type: "ai_insight",
        notif_title: "Possible duplicate detected",
        notif_body: `Your upload "${note.title}" is ${plagiarismScore.toFixed(0)}% similar to an existing listing. Duplicates may be removed by moderators.`,
        notif_link: `/notes/${plagiarismNoteId}`,
      });
    }

    await supabase
      .from("notes")
      .update({
        ai_status: "completed",
        difficulty: analysis.difficulty,
        reading_time_minutes: readingTime,
        quality_score: qualityScore,
        plagiarism_score: plagiarismScore,
        plagiarism_note_id: plagiarismNoteId,
      })
      .eq("id", note.id);
  } catch (error) {
    await supabase.from("notes").update({ ai_status: "failed" }).eq("id", note.id);
    throw error;
  }
}
