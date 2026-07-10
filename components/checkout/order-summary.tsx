import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types";

export function OrderSummary({ order }: { order: OrderWithItems }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="font-semibold">Order summary</h2>
      <p className="mt-1 text-xs text-muted-foreground">Order {order.order_number}</p>

      <ul className="mt-4 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
            <span className="line-clamp-2">{item.title}</span>
            <span className="shrink-0 font-medium">{formatPrice(item.final_price)}</span>
          </li>
        ))}
      </ul>

      <Separator className="my-4" />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>Subtotal</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <dt>Discount</dt>
            <dd>-{formatPrice(order.discount_total)}</dd>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <dt>Tax</dt>
          <dd>{formatPrice(order.tax)}</dd>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between text-base font-bold">
          <dt>Total</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted-foreground">
        Taxes are calculated at checkout where applicable. Digital delivery — nothing
        will be shipped.
      </p>
    </div>
  );
}
