import "server-only";
import type { PoolConnection } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";

type ExpiredOrder = { id: number; order_number: string };
type ReservedLine = { variant_id: number; quantity: number };

export async function releaseExpiredReservations() {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const released = await releaseExpiredReservationsInTransaction(connection);
    await connection.commit();
    return released;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function releaseExpiredReservationsInTransaction(connection: PoolConnection) {
  const [orderRows] = await connection.execute(
    `SELECT id, order_number
     FROM orders
     WHERE status = 'pending_payment'
       AND payment_status = 'pending'
       AND reservation_released_at IS NULL
       AND reservation_expires_at IS NOT NULL
       AND reservation_expires_at <= NOW()
     ORDER BY id
     FOR UPDATE`,
  );
  const expiredOrders = orderRows as ExpiredOrder[];

  for (const order of expiredOrders) {
    const [lineRows] = await connection.execute(
      `SELECT variant_id, SUM(quantity) AS quantity
       FROM order_items
       WHERE order_id = ? AND variant_id IS NOT NULL
       GROUP BY variant_id`,
      [order.id],
    );

    for (const line of lineRows as ReservedLine[]) {
      await connection.execute(
        "UPDATE inventory SET reserved = GREATEST(0, reserved - ?) WHERE variant_id = ?",
        [line.quantity, line.variant_id],
      );
      await connection.execute(
        `INSERT INTO inventory_movements (variant_id, order_id, quantity_delta, reason, note)
         VALUES (?, ?, ?, 'release', ?)`,
        [line.variant_id, order.id, -line.quantity, `Expired reservation released for ${order.order_number}`],
      );
    }

    await connection.execute(
      `UPDATE orders
       SET status = 'cancelled', payment_status = 'cancelled', fulfilment_status = 'cancelled',
           reservation_released_at = NOW(), updated_at = NOW()
       WHERE id = ? AND status = 'pending_payment' AND reservation_released_at IS NULL`,
      [order.id],
    );
    await connection.execute(
      `INSERT INTO order_status_events (order_id, from_status, to_status, actor_type, note)
       VALUES (?, 'pending_payment', 'cancelled', 'system', 'Payment window expired; stock reservation released')`,
      [order.id],
    );
  }

  return expiredOrders.length;
}
