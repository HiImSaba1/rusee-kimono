import "server-only";
import { FakePaymentProvider } from "./fake-provider";
import { PaymentProviderError, type PaymentProvider, type PaymentProviderName } from "./provider";

const providers: Partial<Record<PaymentProviderName, PaymentProvider>> = { fake: new FakePaymentProvider() };

export function getPaymentProvider(name = process.env.PAYMENTS_DEFAULT_PROVIDER ?? "fake") {
  if (process.env.NODE_ENV === "production" && (name === "fake" || process.env.ENABLE_FAKE_PAYMENTS === "true")) {
    throw new PaymentProviderError("Production payments are not configured.", "provider_not_configured");
  }
  const provider = providers[name as PaymentProviderName];
  if (!provider) throw new PaymentProviderError(`Payment provider ${name} is not configured.`, "provider_not_configured");
  return provider;
}
