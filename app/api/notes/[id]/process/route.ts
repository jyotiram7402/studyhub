import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiConfigured } from "@/lib/ai/gemini";
import { processNote } from "@/lib/ai/processing";
import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/types";

export const maxDuration = 60;

export async function POST(
  _request: Request,
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

  const { data } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  const note = data as Note | null;

  if (!note || note.uploader_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!note || profile?.role !== "admin") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
  }

  if (!isAiConfigured()) {
    await supabase.from("notes").update({ ai_status: "skipped" }).eq("id", id);
    return NextResponse.json({ status: "skipped" });
  }

  if (note.ai_status === "processing") {
    return NextResponse.json({ status: "processing" });
  }

  try {
    await processNote(supabase, note);
    return NextResponse.json({ status: "completed" });
  } catch {
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
}
