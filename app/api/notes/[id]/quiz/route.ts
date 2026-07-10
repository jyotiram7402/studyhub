import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiConfigured } from "@/lib/ai/gemini";
import { hasContentAccess } from "@/lib/ai/rag";
import { generateQuiz } from "@/lib/ai/study-tools";
import { createClient } from "@/lib/supabase/server";
import { quizRequestSchema } from "@/lib/validations/ai";

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
  const parsed = quizRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const questions = await generateQuiz(supabase, id, parsed.data.types, parsed.data.count);
    if (questions.length === 0) {
      return NextResponse.json({ error: "Could not generate a quiz from this material" }, { status: 502 });
    }

    const { data: note } = await supabase
      .from("notes")
      .select("title")
      .eq("id", id)
      .maybeSingle();

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        note_id: id,
        title: `Quiz — ${note?.title ?? "study material"}`.slice(0, 120),
        questions,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: "Could not save the quiz" }, { status: 500 });
    }

    return NextResponse.json({ quizId: quiz.id, questions });
  } catch {
    return NextResponse.json({ error: "Could not generate a quiz" }, { status: 502 });
  }
}
