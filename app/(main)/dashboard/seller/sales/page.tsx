import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/notes/empty-state";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { getSellerStats } from "@/lib/queries/seller";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Sales",
};

export default async function SellerSalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/seller/sales");

  const stats = await getSellerStats(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every order that includes one of your uploads.
        </p>
      </div>

      {stats.recentSales.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No sales yet"
          description="When a student buys one of your uploads, the order shows up here with the buyer and amount."
          actionLabel="Upload notes"
          actionHref="/upload"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Item</th>
                <th className="p-4 font-medium">Buyer</th>
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="max-w-[240px] p-4">
                    <Link
                      href={`/notes/${sale.note_id}`}
                      className="line-clamp-1 font-medium hover:text-primary"
                    >
                      {sale.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    {sale.order?.buyer ? (
                      <Link
                        href={`/profile/${sale.order.buyer.username}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {sale.order.buyer.full_name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">
                    {sale.order?.order_number ?? "—"}
                  </td>
                  <td className="p-4">
                    <OrderStatusBadge
                      status={(sale.order?.status ?? "pending") as OrderStatus}
                    />
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(sale.created_at)}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatPrice(sale.final_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
