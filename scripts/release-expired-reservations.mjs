import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.beginTransaction();
  const [orders] = await connection.execute(
    `SELECT id, order_number FROM orders
     WHERE status = 'pending_payment' AND payment_status = 'pending'
       AND reservation_released_at IS NULL
       AND reservation_expires_at IS NOT NULL
       AND reservation_expires_at <= NOW()
     ORDER BY id FOR UPDATE`,
  );
  for (const order of orders) {
    const [lines] = await connection.execute(
      "SELECT variant_id, SUM(quantity) AS quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL GROUP BY variant_id",
      [order.id],
    );
    for (const line of lines) {
      await connection.execute("UPDATE inventory SET reserved = GREATEST(0, reserved - ?) WHERE variant_id = ?", [line.quantity, line.variant_id]);
      await connection.execute(
        "INSERT INTO inventory_movements (variant_id, order_id, quantity_delta, reason, note) VALUES (?, ?, ?, 'release', ?)",
        [line.variant_id, order.id, -line.quantity, `Expired reservation released for ${order.order_number}`],
      );
    }
    await connection.execute(
      "UPDATE orders SET status='cancelled', payment_status='cancelled', fulfilment_status='cancelled', reservation_released_at=NOW(), updated_at=NOW() WHERE id=? AND status='pending_payment' AND reservation_released_at IS NULL",
      [order.id],
    );
    await connection.execute(
      "INSERT INTO order_status_events (order_id, from_status, to_status, actor_type, note) VALUES (?, 'pending_payment', 'cancelled', 'system', 'Payment window expired; stock reservation released')",
      [order.id],
    );
  }
  await connection.commit();
  console.log(`Released ${orders.length} expired reservation(s).`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
