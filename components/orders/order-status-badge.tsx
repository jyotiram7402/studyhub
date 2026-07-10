import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const statusConfig: Record<OrderStatus, { label: string; variant: "success" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
  refunded: { label: "Refunded", variant: "outline" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
