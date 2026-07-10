import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import {
  purchaseSuccessEmail,
  receiptEmail,
  sellerSaleEmail,
} from "@/lib/email/templates";
import { getPaymentProvider } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import { confirmPaymentSchema } from "@/lib/validations/order";
import type { Order, OrderItem, Payment } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!z.string().uuid().safeParse(orderId).success) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = confirmPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payment details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: orderData } = await supabase
    .from("orders")
    .select("*, items:order_items (*), payments (*)")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  const order = orderData as unknown as
    | (Order & { items: OrderItem[]; payments: Payment[] })
    | null;

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ status: "paid" });
  }
  if (order.status !== "pending") {
    return NextResponse.json({ error: "This order can no longer be paid" }, { status: 409 });
  }

  const provider = getPaymentProvider();

  // Reuse the open payment attempt, or open a fresh one so a declined card
  // doesn't permanently block the order.
  let pendingPayment = order.payments.find((payment) => payment.status === "created");
  if (!pendingPayment) {
    const created = await provider.createPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total,
      currency: order.currency,
      buyerEmail: user.email ?? "",
    });

    const { data: newPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        provider: provider.id,
        provider_payment_id: created.providerPaymentId,
        amount: order.total,
        currency: order.currency,
        method: created.method,
      })
      .select("*")
      .single();

    if (paymentError || !newPayment) {
      return NextResponse.json({ error: "Could not initialise payment" }, { status: 500 });
    }
    pendingPayment = newPayment as Payment;
  }
  const verification = await provider.verifyPayment({
    providerPaymentId: pendingPayment.provider_payment_id,
    amount: order.total,
    currency: order.currency,
    payload: {
      cardNumber: parsed.data.cardNumber,
      cardHolder: parsed.data.cardHolder,
      expiry: parsed.data.expiry,
    },
  });

  const { data: result, error: settleError } = await supabase.rpc(
    "complete_order_payment",
    {
      target_order_id: order.id,
      payment_reference: pendingPayment.provider_payment_id,
      payment_succeeded: verification.succeeded,
      payment_failure_reason: verification.failureReason ?? null,
    }
  );

  if (settleError) {
    return NextResponse.json({ error: "Could not finalise payment" }, { status: 500 });
  }

  if (!verification.succeeded || result !== "paid") {
    return NextResponse.json({
      status: "failed",
      error: verification.failureReason ?? "Payment was declined",
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const itemTitle = order.items[0]?.title ?? "your purchase";

  if (user.email) {
    const buyerContext = {
      buyerEmail: user.email,
      buyerName: user.user_metadata?.full_name ?? "there",
      orderNumber: order.order_number,
      itemTitle,
      total: order.total,
      libraryUrl: `${siteUrl}/dashboard/library`,
    };
    await Promise.all([
      sendEmail(purchaseSuccessEmail(buyerContext)),
      sendEmail(receiptEmail(buyerContext)),
    ]);
  }

  const { data: sellerContexts } = await supabase.rpc("get_order_email_context", {
    target_order_id: order.id,
  });

  for (const seller of sellerContexts ?? []) {
    if (!seller.seller_email) continue;
    await sendEmail(
      sellerSaleEmail({
        sellerEmail: seller.seller_email,
        sellerName: seller.seller_name ?? "there",
        itemTitle: seller.item_title,
        amount: Number(seller.amount),
        dashboardUrl: `${siteUrl}/dashboard/seller`,
      })
    );
  }

  return NextResponse.json({ status: "paid" });
}
