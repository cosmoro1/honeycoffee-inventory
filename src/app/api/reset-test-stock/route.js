import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Setting inventory levels to just above the restock threshold for demonstration...");

    // Set everything right on the edge of 'OK' status (Deductions use 1 to 25 threshold rules)
    await pool.query(`
      UPDATE inventory 
      SET current_stock = CASE 
            WHEN LOWER(TRIM(unit)) = 'pcs' THEN 26.00  -- Threshold is 25 (1 checkout drops this)
            WHEN LOWER(TRIM(unit)) = 'kg'  THEN 25.01  -- 1 gram above the threshold limit
            WHEN LOWER(TRIM(unit)) = 'l'   THEN 25.05  -- 50ml above the threshold limit
            ELSE 26.00
          END,
          status = 'OK',
          last_updated = NOW();
    `);

    // Clear out today's old log references so the 24-hour anti-spam guard resets completely
    await pool.query(`
      DELETE FROM activity_logs 
      WHERE LOWER(type) LIKE '%order%' 
         OR reference LIKE 'PO%';
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Stock set to ALMOST LOW levels, and anti-spam log guard cleared! Ready for your live PO demonstration." 
    });
  } catch (err) {
    console.error("[Reset Endpoint Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}