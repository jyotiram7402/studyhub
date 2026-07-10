import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const [popular, trending] = await Promise.all([
    supabase.rpc("get_popular_searches", { entry_count: 6 }),
    supabase.rpc("get_trending_searches", { entry_count: 6 }),
  ]);

  return NextResponse.json(
    {
      popular: ((popular.data ?? []) as { query: string }[]).map((row) => row.query),
      trending: ((trending.data ?? []) as { query: string }[]).map((row) => row.query),
    },
    { headers: { "Cache-Control": "public, max-age=120, s-maxage=300" } }
  );
}
