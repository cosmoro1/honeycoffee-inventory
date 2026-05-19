import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
         i.id,
         i.order_id  AS orderId,
         CONCAT('PHP ', FORMAT(i.amount, 2)) AS amount,
         i.status,
         DATE_FORMAT(i.issued_at, '%b %d, %Y %h:%i %p') AS issuedAt
       FROM invoices i
       ORDER BY i.issued_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/invoices]", err);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
