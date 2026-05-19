import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id, items, quantity, status, updated_at AS updatedAt
       FROM edi_orders
       ORDER BY created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
