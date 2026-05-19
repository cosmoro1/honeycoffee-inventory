import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [[{ totalOrders }]]     = await pool.query("SELECT COUNT(*) AS totalOrders FROM edi_orders");
    const [[{ pendingOrders }]]   = await pool.query("SELECT COUNT(*) AS pendingOrders FROM edi_orders WHERE status = 'Pending'");
    const [[{ deliveredOrders }]] = await pool.query("SELECT COUNT(*) AS deliveredOrders FROM edi_orders WHERE status = 'Delivered'");
    const [[{ lowStockItems }]]   = await pool.query("SELECT COUNT(*) AS lowStockItems FROM inventory WHERE status IN ('Low Stock','Critical','Out of Stock')");
    const [[{ activeDeliveries }]]= await pool.query("SELECT COUNT(*) AS activeDeliveries FROM deliveries WHERE status = 'In Transit'");
    const [[{ inventoryCount }]]  = await pool.query("SELECT COUNT(*) AS inventoryCount FROM inventory");
    const [latestLog]             = await pool.query("SELECT created_at FROM activity_logs ORDER BY created_at DESC LIMIT 1");

    const latestUpdate = latestLog[0]
      ? new Date(latestLog[0].created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "—";

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      lowStockItems,
      activeDeliveries,
      inventoryCount,
      latestUpdate,
    });
  } catch (err) {
    console.error("[GET /api/dashboard-stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
