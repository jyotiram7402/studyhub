import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "@/lib/payments/types";

export const SANDBOX_SUCCESS_CARD = "4242 4242 4242 4242";
export const SANDBOX_DECLINE_CARD = "4000 0000 0000 0002";

export const sandboxProvider: PaymentProvider = {
  id: "sandbox",
  displayName: "Sandbox Gateway (test mode)",

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    return {
      providerPaymentId: `sandbox_${params.orderNumber}_${globalThis.crypto.randomUUID()}`,
      method: "card",
    };
  },

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const cardNumber = String(params.payload.cardNumber ?? "").replace(/\s+/g, "");

    if (!/^\d{16}$/.test(cardNumber)) {
      return { succeeded: false, failureReason: "Invalid card number" };
    }
    if (cardNumber === SANDBOX_DECLINE_CARD.replace(/\s+/g, "")) {
      return { succeeded: false, failureReason: "Card declined by issuer (test decline card)" };
    }
    return { succeeded: true };
  },
};
