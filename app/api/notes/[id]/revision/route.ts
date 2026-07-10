import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiConfigured } from "@/lib/ai/gemini";
import { hasContentAccess } from "@/lib/ai/rag";
import { generateRevision } from "@/lib/ai/study-tools";
import { createClient } from "@/lib/supabase/server";
import { revisionRequestSchema } from "@/lib/validations/ai";

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
  const parsed = revisionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const revision = await generateRevision(supabase, id, parsed.data.mode);
    return NextResponse.json({ revision });
  } catch {
    return NextResponse.json({ error: "Could not generate revision notes" }, { status: 502 });
  }
}
