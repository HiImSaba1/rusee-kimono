import "server-only";
import { databasePool } from "@/lib/db/connection";
import { releaseExpiredReservations } from "@/features/inventory/release-expired-reservations";
import { getPaymentProvider } from "./registry";
import { PaymentProviderError } from "./provider";

type OrderRow = { id: number; public_id: string; order_number: string; total_minor: number; currency: string; email: string; status: string; payment_status: string; reservation_active: number };

export async function createPaymentAttempt(publicId: string) {
  await releaseExpiredReservations();
  const provider = getPaymentProvider();
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT id, public_id, order_number, total_minor, currency, email, status, payment_status, reservation_expires_at > NOW() AS reservation_active FROM orders WHERE public_id = ? LIMIT 1 FOR UPDATE", [publicId]);
    const order = (rows as OrderRow[])[0];
    if (!order) throw new PaymentProviderError("Order was not found.", "order_not_found");
    if (order.status !== "pending_payment" || order.payment_status !== "pending") throw new PaymentProviderError("Order is not awaiting payment.", "order_not_payable");
    if (!order.reservation_active) throw new PaymentProviderError("The stock reservation has expired.", "reservation_expired");
    const checkout = await provider.createCheckout({ id: order.id, publicId: order.public_id, orderNumber: order.order_number, amountMinor: order.total_minor, currency: order.currency, customerEmail: order.email });
    const [existingRows] = await connection.execute("SELECT id FROM payments WHERE provider = ? AND provider_payment_id = ? LIMIT 1", [provider.name, checkout.providerPaymentId]);
    if (!(existingRows as Array<{ id: number }>)[0]) await connection.execute(
      "INSERT INTO payments (order_id, provider, provider_payment_id, amount_minor, currency, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [order.id, provider.name, checkout.providerPaymentId, order.total_minor, order.currency],
    );
    await connection.commit();
    return checkout;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
