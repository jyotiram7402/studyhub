import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, requireAdmin } from "@/lib/auth";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const maintenanceSchema = z.object({
  task: z.enum(["cancel_stale_orders", "cleanup_orphaned_files"]),
});

async function cleanupOrphanedFiles(): Promise<number> {
  const supabase = await createClient();

  const { data: notes } = await supabase.from("notes").select("file_path");
  const referenced = new Set((notes ?? []).map((note) => note.file_path as string));

  const { data: folders } = await supabase.storage
    .from(STORAGE_BUCKETS.noteFiles)
    .list("", { limit: 500 });

  const orphans: string[] = [];
  for (const folder of folders ?? []) {
    if (!folder.name || folder.id) continue;
    const { data: files } = await supabase.storage
      .from(STORAGE_BUCKETS.noteFiles)
      .list(folder.name, { limit: 1000 });
    for (const file of files ?? []) {
      const path = `${folder.name}/${file.name}`;
      if (!referenced.has(path)) orphans.push(path);
    }
  }

  if (orphans.length > 0) {
    await supabase.storage.from(STORAGE_BUCKETS.noteFiles).remove(orphans.slice(0, 200));
  }
  return Math.min(orphans.length, 200);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = maintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();

  if (parsed.data.task === "cancel_stale_orders") {
    const { data, error } = await supabase.rpc("cancel_stale_orders");
    if (error) {
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
    await logAdminAction("stale_orders_cancelled", "orders", "batch", { count: data });
    return NextResponse.json({ affected: data ?? 0 });
  }

  try {
    const removed = await cleanupOrphanedFiles();
    await logAdminAction("orphaned_files_removed", "storage", "note-files", {
      count: removed,
    });
    return NextResponse.json({ affected: removed });
  } catch {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
