import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  const conn = await pool.getConnection();
  try {
    const { pickupNumber, items, totalAmount } = await request.json();

    if (!pickupNumber || !items?.length) {
      return NextResponse.json({ error: "Missing pickupNumber or items" }, { status: 400 });
    }

    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      "INSERT INTO customer_orders (pickup_number, total_amount) VALUES (?, ?)",
      [pickupNumber, totalAmount ?? 0]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      // Parse price — item.price may be "PHP 520" string or a number
      const unitPrice = typeof item.price === "string"
        ? parseFloat(item.price.replace(/[^0-9.]/g, ""))
        : item.price;

      await conn.query(
        `INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, unitPrice]
      );
    }

    await conn.query(
      "INSERT INTO activity_logs (type, reference, message, status) VALUES ('Order', ?, ?, 'Pending')",
      [pickupNumber, `Customer order ${pickupNumber} placed — ${items.length} item(s).`]
    );

    await conn.commit();
    return NextResponse.json({ success: true, orderId }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    console.error("[POST /api/customer-orders]", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  } finally {
    conn.release();
  }
}
