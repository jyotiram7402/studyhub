import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Manage orders",
};

type AdminOrderRow = Order & {
  items: OrderItem[];
  buyer: { username: string; full_name: string } | null;
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items (*), buyer:profiles!orders_buyer_id_fkey (username, full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (data ?? []) as unknown as AdminOrderRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All marketplace orders with their payment status.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No orders yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Buyer</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 text-right font-medium">Total</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="p-4 font-mono text-xs">{order.order_number}</td>
                  <td className="p-4">
                    {order.buyer ? `@${order.buyer.username}` : "—"}
                  </td>
                  <td className="max-w-[220px] p-4">
                    <span className="line-clamp-1 text-muted-foreground">
                      {order.items.map((item) => item.title).join(", ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatPrice(order.total)}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Refunds arrive with the production payment gateway"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Refund
                    </Button>
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
