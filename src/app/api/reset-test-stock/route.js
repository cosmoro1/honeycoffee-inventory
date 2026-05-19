import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Resetting inventory levels to OK and clearing anti-spam history for testing...");

    // 1. Reset all your raw stock numbers high so their status shifts back to 'OK'
    await pool.query(`
      UPDATE inventory 
      SET current_stock = CASE 
            WHEN unit = 'pcs' THEN 200.00
            WHEN unit = 'kg' THEN 50.00
            WHEN unit = 'L' THEN 40.00
            ELSE 100.00
          END,
          status = 'OK',
          last_updated = NOW();
    `);

    // 2. Clear out recent Order logs from today so the 24-hour anti-spam guard resets
    await pool.query("DELETE FROM activity_logs WHERE type = 'Order';");

    return NextResponse.json({ 
      success: true, 
      message: "Inventory reset to OK and anti-spam guard cleared! Ready for a fresh restock test." 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}