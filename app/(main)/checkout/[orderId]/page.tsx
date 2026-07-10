import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { OrderSummary } from "@/components/checkout/order-summary";
import { SandboxPaymentForm } from "@/components/checkout/sandbox-payment-form";
import { getOrderForBuyer } from "@/lib/queries/orders";
import { getPaymentProvider } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage(props: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/checkout/${orderId}`);
  }

  const order = await getOrderForBuyer(orderId, user.id).catch(() => null);
  if (!order) notFound();

  if (order.status === "paid") {
    redirect(`/checkout/${orderId}/success`);
  }
  if (order.status !== "pending") {
    redirect("/dashboard/orders");
  }

  const provider = getPaymentProvider();

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Checkout</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Secured by {provider.displayName}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Payment details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your payment to unlock instant download access.
          </p>
          <div className="mt-5">
            <SandboxPaymentForm orderId={order.id} total={order.total} />
          </div>
        </div>

        <OrderSummary order={order} />
      </div>
    </div>
  );
}
