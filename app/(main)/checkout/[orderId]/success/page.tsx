import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Button } from "@/components/ui/button";
import { getOrderForBuyer } from "@/lib/queries/orders";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Payment successful",
};

export default async function CheckoutSuccessPage(props: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/checkout/${orderId}/success`);
  }

  const order = await getOrderForBuyer(orderId, user.id).catch(() => null);
  if (!order) notFound();

  if (order.status !== "paid") {
    redirect(`/checkout/${orderId}`);
  }

  const firstItem = order.items[0];

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="mb-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
          Payment successful
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          You now have lifetime download access to your purchase. A receipt has been
          sent to your email.
        </p>
        {order.paid_at && (
          <p className="mt-1 text-xs text-muted-foreground">
            Paid on {formatDate(order.paid_at)}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {firstItem && (
            <Button size="lg" asChild>
              <Link href={`/notes/${firstItem.note_id}`}>Download now</Link>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard/library">Go to my library</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <OrderSummary order={order} />
      </div>
    </div>
  );
}
