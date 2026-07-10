import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      bio: input.bio || null,
      college: input.college || null,
      course: input.course || null,
      semester: input.semester || null,
      avatar_url: input.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
