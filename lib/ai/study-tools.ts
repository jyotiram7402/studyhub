import type { SupabaseClient } from "@supabase/supabase-js";
import { generateFromPrompt, generateJson } from "@/lib/ai/gemini";

const CONTEXT_CHAR_LIMIT = 20000;

export type ExplainMode = "standard" | "beginner" | "examples" | "simple_english";
export type RevisionMode = "one_minute" | "five_minute" | "exam" | "night_before";

export type QuizQuestionType =
  | "mcq"
  | "short_answer"
  | "long_answer"
  | "true_false"
  | "fill_blank";

export interface QuizQuestion {
  type: QuizQuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface FlashcardDraft {
  question: string;
  answer: string;
}

export async function getNoteContext(
  supabase: SupabaseClient,
  noteId: string
): Promise<{ title: string; text: string }> {
  const [{ data: note }, { data: chunks }] = await Promise.all([
    supabase.from("notes").select("title, description").eq("id", noteId).maybeSingle(),
    supabase
      .from("document_chunks")
      .select("content")
      .eq("note_id", noteId)
      .order("chunk_index", { ascending: true })
      .limit(20),
  ]);

  const chunkText = (chunks ?? []).map((chunk) => chunk.content).join("\n");
  const text = (chunkText || `${note?.title ?? ""}\n${note?.description ?? ""}`).slice(
    0,
    CONTEXT_CHAR_LIMIT
  );

  return { title: note?.title ?? "this document", text };
}

const EXPLAIN_INSTRUCTIONS: Record<ExplainMode, string> = {
  standard:
    "Explain the material clearly for a university student. Cover the core ideas, how they connect, and why they matter.",
  beginner:
    "Explain the material for a complete beginner with no prior knowledge. Use everyday analogies, define every term, and build up slowly.",
  examples:
    "Explain the material through concrete worked examples. For each key concept, give at least one practical example or solved problem.",
  simple_english:
    "Explain the material in very simple English with short sentences, suitable for someone whose first language is not English. Avoid jargon.",
};

export async function explainNote(
  supabase: SupabaseClient,
  noteId: string,
  mode: ExplainMode
): Promise<string> {
  const context = await getNoteContext(supabase, noteId);
  return generateFromPrompt(
    [
      EXPLAIN_INSTRUCTIONS[mode],
      "Base the explanation only on this study material. Use plain text with simple headings and lists.",
      `Material from "${context.title}":`,
      "---",
      context.text,
      "---",
    ].join("\n"),
    { temperature: 0.4 }
  );
}

export async function generateQuiz(
  supabase: SupabaseClient,
  noteId: string,
  types: QuizQuestionType[],
  count: number
): Promise<QuizQuestion[]> {
  const context = await getNoteContext(supabase, noteId);

  const questions = await generateJson<QuizQuestion[]>(
    [
      `Create ${count} exam-style quiz questions from this study material.`,
      `Use only these question types: ${types.join(", ")}.`,
      "Distribute questions across the requested types and across the material's topics.",
      "Return a JSON array where each item is:",
      `{ "type": "mcq" | "short_answer" | "long_answer" | "true_false" | "fill_blank",
  "question": "the question (use ___ for fill_blank gaps)",
  "options": ["only for mcq — exactly 4 options"],
  "answer": "the correct answer",
  "explanation": "one-line explanation" }`,
      `Material from "${context.title}":`,
      "---",
      context.text,
      "---",
    ].join("\n")
  );

  return questions.filter((question) => question.question && question.answer).slice(0, 25);
}

export async function generateFlashcards(
  supabase: SupabaseClient,
  noteId: string,
  count: number
): Promise<FlashcardDraft[]> {
  const context = await getNoteContext(supabase, noteId);

  const cards = await generateJson<FlashcardDraft[]>(
    [
      `Create ${count} spaced-repetition flashcards from this study material.`,
      "Each card tests one atomic fact or concept. Questions are short; answers are precise (1-3 sentences).",
      'Return a JSON array of { "question": "...", "answer": "..." }.',
      `Material from "${context.title}":`,
      "---",
      context.text,
      "---",
    ].join("\n")
  );

  return cards.filter((card) => card.question && card.answer).slice(0, 30);
}

const REVISION_INSTRUCTIONS: Record<RevisionMode, string> = {
  one_minute:
    "Write a 1-minute revision: the 5-7 most critical facts as ultra-short bullet points a student can scan while walking into the exam hall.",
  five_minute:
    "Write a 5-minute revision: a compact outline of every major topic with the key formula, definition, or rule for each.",
  exam:
    "Write complete exam revision notes: every topic with definitions, key points, likely exam questions, and common mistakes to avoid.",
  night_before:
    "Write night-before-exam notes: prioritised by what is most likely to be asked, with memory hooks and the minimum needed to pass confidently.",
};

export async function generateRevision(
  supabase: SupabaseClient,
  noteId: string,
  mode: RevisionMode
): Promise<string> {
  const context = await getNoteContext(supabase, noteId);
  return generateFromPrompt(
    [
      REVISION_INSTRUCTIONS[mode],
      "Base it only on this study material. Plain text, simple headings, tight bullets.",
      `Material from "${context.title}":`,
      "---",
      context.text,
      "---",
    ].join("\n"),
    { temperature: 0.3 }
  );
}
