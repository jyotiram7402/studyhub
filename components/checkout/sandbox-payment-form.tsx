"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SANDBOX_DECLINE_CARD, SANDBOX_SUCCESS_CARD } from "@/lib/payments/sandbox";
import { formatPrice } from "@/lib/utils";
import { confirmPaymentSchema } from "@/lib/validations/order";

interface SandboxPaymentFormProps {
  orderId: string;
  total: number;
}

export function SandboxPaymentForm({ orderId, total }: SandboxPaymentFormProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = confirmPaymentSchema.safeParse({
      cardNumber: formData.get("cardNumber"),
      cardHolder: formData.get("cardHolder"),
      expiry: formData.get("expiry"),
      cvc: formData.get("cvc"),
      acceptedTerms: formData.get("acceptedTerms") === "on",
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message])
        )
      );
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/payments/${orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(body?.error ?? "Payment could not be processed.");
        return;
      }

      if (body.status === "paid") {
        router.push(`/checkout/${orderId}/success`);
        router.refresh();
        return;
      }

      toast.error(body.error ?? "Payment was declined. Try a different card.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Test mode</p>
        <p className="mt-1">
          Use card <code className="font-mono">{SANDBOX_SUCCESS_CARD}</code> to approve
          the payment, or <code className="font-mono">{SANDBOX_DECLINE_CARD}</code> to
          simulate a decline. No real money moves.
        </p>
      </div>

      <FormField label="Card number" htmlFor="cardNumber" error={errors.cardNumber}>
        <Input
          id="cardNumber"
          name="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          defaultValue={SANDBOX_SUCCESS_CARD}
          placeholder="1234 5678 9012 3456"
          required
        />
      </FormField>

      <FormField label="Name on card" htmlFor="cardHolder" error={errors.cardHolder}>
        <Input
          id="cardHolder"
          name="cardHolder"
          autoComplete="cc-name"
          placeholder="Priya Sharma"
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Expiry" htmlFor="expiry" error={errors.expiry}>
          <Input
            id="expiry"
            name="expiry"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            defaultValue="12/29"
            required
          />
        </FormField>
        <FormField label="CVC" htmlFor="cvc" error={errors.cvc}>
          <Input
            id="cvc"
            name="cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            defaultValue="123"
            required
          />
        </FormField>
      </div>

      <div className="space-y-1">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="acceptedTerms"
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
          />
          <span className="text-muted-foreground">
            I agree that this is a digital product with instant delivery, and I accept
            the{" "}
            <Link href="/browse" className="underline hover:text-foreground">
              marketplace terms
            </Link>
            .
          </span>
        </label>
        {errors.acceptedTerms && (
          <p className="text-xs text-destructive">{errors.acceptedTerms}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={processing}>
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {processing ? "Processing payment..." : `Pay ${formatPrice(total)}`}
      </Button>
    </form>
  );
}
