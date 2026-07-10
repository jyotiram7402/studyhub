import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchLogSchema } from "@/lib/validations/ai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => null);
  const parsed = searchLogSchema.safeParse(body);

  if (parsed.success) {
    await supabase.rpc("log_search", { search_query: parsed.data.q });
  }

  return NextResponse.json({ ok: true });
}
