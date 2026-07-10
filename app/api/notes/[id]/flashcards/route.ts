import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiConfigured } from "@/lib/ai/gemini";
import { hasContentAccess } from "@/lib/ai/rag";
import { generateFlashcards } from "@/lib/ai/study-tools";
import { createClient } from "@/lib/supabase/server";
import { flashcardRequestSchema } from "@/lib/validations/ai";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI features are not enabled" }, { status: 503 });
  }
  if (!(await hasContentAccess(supabase, id))) {
    return NextResponse.json({ error: "Purchase this resource to use AI tools" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = flashcardRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const cards = await generateFlashcards(supabase, id, parsed.data.count);
    if (cards.length === 0) {
      return NextResponse.json(
        { error: "Could not generate flashcards from this material" },
        { status: 502 }
      );
    }

    const { error } = await supabase.from("flashcards").insert(
      cards.map((card) => ({
        user_id: user.id,
        note_id: id,
        question: card.question,
        answer: card.answer,
      }))
    );

    if (error) {
      return NextResponse.json({ error: "Could not save flashcards" }, { status: 500 });
    }

    return NextResponse.json({ count: cards.length, cards });
  } catch {
    return NextResponse.json({ error: "Could not generate flashcards" }, { status: 502 });
  }
}
