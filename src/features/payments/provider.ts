import "server-only";

export type PaymentProviderName = "fake" | "stripe" | "paypal" | "nbg" | "worldline";
export type ProviderPaymentStatus = "created" | "pending" | "authorized" | "captured" | "failed" | "cancelled" | "partially_refunded" | "refunded";

export type CheckoutOrder = {
  id: number;
  publicId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
};

export type ProviderCheckout = {
  provider: PaymentProviderName;
  providerPaymentId: string;
  redirectUrl: string;
  expiresAt?: Date;
};

export type VerifiedProviderEvent = {
  provider: PaymentProviderName;
  providerEventId: string;
  providerPaymentId: string;
  type: string;
  status: ProviderPaymentStatus;
  amountMinor: number;
  currency: string;
  occurredAt: Date;
  payloadHash: string;
  sanitizedPayload: Record<string, string | number | boolean | null>;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(order: CheckoutOrder): Promise<ProviderCheckout>;
  verifyWebhook(request: Request): Promise<VerifiedProviderEvent>;
  getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatus>;
  refund(providerPaymentId: string, amountMinor: number, reason?: string): Promise<{ providerRefundId: string; status: "pending" | "succeeded" }>;
}

export class PaymentProviderError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}
