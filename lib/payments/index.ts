import { sandboxProvider } from "@/lib/payments/sandbox";
import type { PaymentProvider } from "@/lib/payments/types";

// Additional providers (Stripe, Razorpay, PayPal) implement PaymentProvider
// and register here; PAYMENT_PROVIDER selects the active one per environment.
const providers: Record<string, PaymentProvider> = {
  sandbox: sandboxProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const providerId = process.env.PAYMENT_PROVIDER ?? "sandbox";
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${providerId}`);
  }
  return provider;
}
