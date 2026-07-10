import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.string().trim().min(2).max(80);

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  const limit = checkRateLimit(`suggest:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return rateLimitResponse(limit);
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(searchParams.get("q") ?? "");

  if (!parsed.success) {
    return NextResponse.json({ suggestions: [] });
  }

  const term = parsed.data.replace(/[,()%]/g, "");
  const supabase = await createClient();

  const [notes, subjects] = await Promise.all([
    supabase
      .from("notes")
      .select("title")
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "approved")
      .ilike("title", `%${term}%`)
      .order("downloads", { ascending: false })
      .limit(5),
    supabase.from("subjects").select("name").ilike("name", `%${term}%`).limit(3),
  ]);

  const suggestions = [
    ...(subjects.data ?? []).map((row) => row.name as string),
    ...(notes.data ?? []).map((row) => row.title as string),
  ].slice(0, 7);

  return NextResponse.json(
    { suggestions },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } }
  );
}
