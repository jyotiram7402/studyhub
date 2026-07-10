export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  buyerEmail: string;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  method: string;
}

export interface VerifyPaymentParams {
  providerPaymentId: string;
  amount: number;
  currency: string;
  payload: Record<string, unknown>;
}

export interface VerifyPaymentResult {
  succeeded: boolean;
  failureReason?: string;
}

export interface PaymentProvider {
  id: string;
  displayName: string;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
}
