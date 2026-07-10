import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/notes/empty-state";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { getBuyerOrders } from "@/lib/queries/orders";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order history",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/orders");

  const orders = await getBuyerOrders(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? "order" : "orders"} placed
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No orders yet"
          description="Orders you place appear here with their payment status and receipts."
          actionLabel="Browse notes"
          actionHref="/browse"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-medium">{order.order_number}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(order.created_at)} · {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                  {order.status === "pending" && (
                    <Button size="sm" asChild>
                      <Link href={`/checkout/${order.id}`}>Complete payment</Link>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled title="Invoices arrive in a future release">
                    <ReceiptText className="h-4 w-4" />
                    Invoice
                  </Button>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t pt-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
                    <Link
                      href={`/notes/${item.note_id}`}
                      className="line-clamp-1 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {item.title}
                    </Link>
                    <span className="shrink-0 text-muted-foreground">
                      {formatPrice(item.final_price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
