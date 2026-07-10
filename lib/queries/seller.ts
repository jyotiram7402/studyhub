import { createClient } from "@/lib/supabase/server";
import type { SalesReport, SellerWallet, Transaction } from "@/lib/types";

export interface SellerSaleRow {
  id: string;
  title: string;
  final_price: number;
  created_at: string;
  note_id: string;
  order: {
    order_number: string;
    status: string;
    buyer: { username: string; full_name: string } | null;
  } | null;
}

export interface SellerStats {
  wallet: SellerWallet | null;
  productCount: number;
  totalDownloads: number;
  pendingOrders: number;
  completedOrders: number;
  monthlyReports: SalesReport[];
  recentSales: SellerSaleRow[];
  transactions: Transaction[];
}

export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  const supabase = await createClient();

  const [wallet, products, reports, sales, transactions] = await Promise.all([
    supabase.from("seller_wallet").select("*").eq("seller_id", sellerId).maybeSingle(),
    supabase
      .from("notes")
      .select("downloads")
      .eq("uploader_id", sellerId),
    supabase
      .from("sales_reports")
      .select("*")
      .eq("seller_id", sellerId)
      .order("period", { ascending: false })
      .limit(12),
    supabase
      .from("order_items")
      .select(
        "id, title, final_price, created_at, note_id, order:orders (order_number, status, buyer:profiles (username, full_name))"
      )
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("transactions")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const saleRows = (sales.data ?? []) as unknown as SellerSaleRow[];
  const productRows = products.data ?? [];

  return {
    wallet: (wallet.data as SellerWallet | null) ?? null,
    productCount: productRows.length,
    totalDownloads: productRows.reduce((sum, note) => sum + Number(note.downloads), 0),
    pendingOrders: saleRows.filter((row) => row.order?.status === "pending").length,
    completedOrders: saleRows.filter((row) => row.order?.status === "paid").length,
    monthlyReports: (reports.data ?? []) as SalesReport[],
    recentSales: saleRows,
    transactions: (transactions.data ?? []) as Transaction[],
  };
}
