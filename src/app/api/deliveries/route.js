import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.id,
         d.order_id                                         AS orderId,
         s.name                                             AS courier,
         d.status,
         CASE
           WHEN d.completed_at IS NOT NULL
             THEN CONCAT('Completed ', DATE_FORMAT(d.completed_at, '%b %d'))
           WHEN d.eta IS NOT NULL
             THEN CONCAT('ETA ', DATE_FORMAT(d.eta, '%h:%i %p'))
           ELSE '—'
         END                                                AS eta
       FROM deliveries  d
       JOIN suppliers   s ON d.supplier_id = s.id
       ORDER BY d.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/deliveries]", err);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}
