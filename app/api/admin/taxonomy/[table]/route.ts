import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { taxonomyItemSchema } from "@/lib/validations/admin";

const MANAGED_TABLES = ["universities", "courses", "subjects", "categories", "tags"] as const;

const mutationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(160).optional(),
});

function resolveTable(table: string): (typeof MANAGED_TABLES)[number] | null {
  return (MANAGED_TABLES as readonly string[]).includes(table)
    ? (table as (typeof MANAGED_TABLES)[number])
    : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const target = resolveTable(table);
  if (!target) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = taxonomyItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const values: Record<string, unknown> = { name: parsed.data.name };
  if (target === "universities" && parsed.data.country) {
    values.country = parsed.data.country;
  }
  if (target === "categories") {
    values.slug = parsed.data.slug || slugify(parsed.data.name);
    values.description = parsed.data.description || null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from(target).insert(values).select("id").single();

  if (error) {
    return NextResponse.json(
      { error: error.code === "23505" ? "An entry with this name already exists" : "Could not create entry" },
      { status: 409 }
    );
  }

  await logAdminAction("taxonomy_created", target, data.id, { name: parsed.data.name });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const target = resolveTable(table);
  if (!target) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = mutationSchema.safeParse(body);

  if (!parsed.success || !parsed.data.name) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(target)
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: "Could not rename entry" }, { status: 500 });
  }

  await logAdminAction("taxonomy_renamed", target, parsed.data.id, { name: parsed.data.name });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const target = resolveTable(table);
  if (!target) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = mutationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from(target).delete().eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not delete — entries in use by existing notes cannot be removed" },
      { status: 409 }
    );
  }

  await logAdminAction("taxonomy_deleted", target, parsed.data.id);
  return NextResponse.json({ ok: true });
}
