import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai/gemini";
import {
  answerAboutNote,
  answerFromLibrary,
  hasContentAccess,
  type ChatTurn,
} from "@/lib/ai/rag";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { chatMessageSchema } from "@/lib/validations/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const limit = checkRateLimit(`ai-chat:${user.id}`, 15, 60_000);
  if (!limit.allowed) {
    return rateLimitResponse(limit);
  }
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI features are not enabled" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { message, noteId } = parsed.data;
  let sessionId = parsed.data.sessionId;

  if (noteId && !(await hasContentAccess(supabase, noteId))) {
    return NextResponse.json(
      { error: "Purchase this resource to chat with it" },
      { status: 403 }
    );
  }

  if (sessionId) {
    const { data: session } = await supabase
      .from("ai_chat_sessions")
      .select("id, note_id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
  } else {
    const { data: session, error } = await supabase
      .from("ai_chat_sessions")
      .insert({
        user_id: user.id,
        note_id: noteId ?? null,
        title: message.slice(0, 60),
      })
      .select("id")
      .single();
    if (error || !session) {
      return NextResponse.json({ error: "Could not start session" }, { status: 500 });
    }
    sessionId = session.id;
  }

  const { data: historyRows } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(12);

  const history = (historyRows ?? []) as ChatTurn[];

  await supabase.from("ai_messages").insert({
    session_id: sessionId,
    role: "user",
    content: message,
  });

  try {
    const result = noteId
      ? await answerAboutNote(supabase, noteId, message, history)
      : await answerFromLibrary(supabase, message, history);

    await supabase.from("ai_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: result.answer,
    });
    await supabase
      .from("ai_chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    return NextResponse.json({
      sessionId,
      answer: result.answer,
      sources: result.sources,
    });
  } catch {
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again." },
      { status: 502 }
    );
  }
}
