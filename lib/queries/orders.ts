import { createClient } from "@/lib/supabase/server";
import { NOTE_SELECT } from "@/lib/queries/notes";
import type {
  NoteWithRelations,
  Order,
  OrderItem,
  OrderWithItems,
  Payment,
  PurchaseWithNote,
} from "@/lib/types";

export async function getOrderForBuyer(
  orderId: string,
  buyerId: string
): Promise<(OrderWithItems & { payments: Payment[] }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items (*), payments (*)")
    .eq("id", orderId)
    .eq("buyer_id", buyerId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as (OrderWithItems & { payments: Payment[] }) | null;
}

export async function getBuyerOrders(
  buyerId: string
): Promise<(Order & { items: OrderItem[] })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items (*)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as (Order & { items: OrderItem[] })[];
}

export async function getLibrary(buyerId: string): Promise<PurchaseWithNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(`*, note:notes (${NOTE_SELECT})`)
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).filter(
    (row) => Boolean(row.note)
  ) as unknown as PurchaseWithNote[];
}

export async function getPurchasedNoteIds(buyerId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("note_id")
    .eq("buyer_id", buyerId);

  return new Set((data ?? []).map((row) => row.note_id as string));
}

export async function getRecentlyViewed(
  userId: string,
  limit = 4
): Promise<NoteWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recently_viewed")
    .select(`viewed_at, note:notes (${NOTE_SELECT})`)
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .map((row) => row.note as unknown as NoteWithRelations | null)
    .filter((note): note is NoteWithRelations => Boolean(note));
}
