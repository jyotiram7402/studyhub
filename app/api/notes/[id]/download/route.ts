import { NextResponse } from "next/server";
import { z } from "zod";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 300;

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

  const { data: note } = await supabase
    .from("notes")
    .select("id, file_path, file_name, status, uploader_id, price")
    .eq("id", id)
    .maybeSingle();

  if (!note || (note.status !== "published" && note.uploader_id !== user.id)) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const isOwner = note.uploader_id === user.id;
  let purchaseId: string | null = null;

  if (Number(note.price) > 0 && !isOwner) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("note_id", id)
      .maybeSingle();

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase this resource to download it" },
        { status: 403 }
      );
    }
    purchaseId = purchase.id;
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKETS.noteFiles)
    .createSignedUrl(note.file_path, SIGNED_URL_TTL_SECONDS, {
      download: note.file_name,
    });

  if (signError || !signed) {
    return NextResponse.json({ error: "Could not prepare download" }, { status: 500 });
  }

  await supabase.rpc("record_download", {
    target_note_id: id,
    target_purchase_id: purchaseId,
  });

  return NextResponse.json({ url: signed.signedUrl });
}
