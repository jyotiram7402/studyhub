import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email/templates";
import { getPaymentProvider } from "@/lib/payments";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validations/order";
import type { Order, OrderItem } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const limit = checkRateLimit(`orders:${user.id}`, 10, 60_000);
  if (!limit.allowed) {
    return rateLimitResponse(limit);
  }

  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: orderId, error: orderError } = await supabase.rpc("create_note_order", {
    target_note_id: parsed.data.noteId,
  });

  if (orderError || !orderId) {
    return NextResponse.json(
      { error: orderError?.message ?? "Could not create order" },
      { status: 400 }
    );
  }

  const { data: orderData } = await supabase
    .from("orders")
    .select("*, items:order_items (*)")
    .eq("id", orderId)
    .single();

  const order = orderData as unknown as (Order & { items: OrderItem[] }) | null;
  if (!order) {
    return NextResponse.json({ error: "Could not load order" }, { status: 500 });
  }

  const provider = getPaymentProvider();
  const payment = await provider.createPayment({
    orderId: order.id,
    orderNumber: order.order_number,
    amount: order.total,
    currency: order.currency,
    buyerEmail: user.email ?? "",
  });

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    provider: provider.id,
    provider_payment_id: payment.providerPaymentId,
    amount: order.total,
    currency: order.currency,
    method: payment.method,
  });

  if (paymentError) {
    return NextResponse.json({ error: "Could not initialise payment" }, { status: 500 });
  }

  if (user.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await sendEmail(
      orderConfirmationEmail({
        buyerEmail: user.email,
        buyerName: user.user_metadata?.full_name ?? "there",
        orderNumber: order.order_number,
        itemTitle: order.items[0]?.title ?? "your purchase",
        total: order.total,
        libraryUrl: `${siteUrl}/dashboard/library`,
      })
    );
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
