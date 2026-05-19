import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { exec } from "child_process";
import path from "path";

// 1. YOUR EXISTING GET ENDPOINT
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT 
         item, 
         current_stock                                       AS currentStock, 
         unit, 
         status, 
         DATE_FORMAT(last_updated, '%b %d, %Y %h:%i %p')     AS lastUpdated
       FROM inventory
       ORDER BY FIELD(status, 'Out of Stock', 'Critical', 'Low Stock', 'OK'), item`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/inventory]", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

// 2. THE NEW POST ENDPOINT WITH PYTHON TRIGGER
export async function POST(request) {
  try {
    const { item, quantityReduced } = await request.json();

    // Validate request parameters
    if (!item || !quantityReduced) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Step A: Update the database stock and dynamically adjust status flag bounds
    await pool.query(
      `UPDATE inventory 
       SET current_stock = current_stock - ?,
           status = CASE 
             WHEN (current_stock - ?) <= 0 THEN 'Out of Stock'
             WHEN (current_stock - ?) <= 10 THEN 'Critical'
             WHEN (current_stock - ?) <= 25 THEN 'Low Stock'
             ELSE 'OK'
           END,
           last_updated = NOW()
       WHERE item = ?`,
      [quantityReduced, quantityReduced, quantityReduced, quantityReduced, item]
    );

    // Step B: Asynchronously fire the Python automation script to handle potential orders
    const scriptPath = path.join(process.cwd(), "auto_restock.py");
    
    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Trigger Error] Failed to execute auto_restock.py: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[Python Runtime Error]: ${stderr}`);
        return;
      }
      // Prints the X12 generation results directly into your VS Code terminal window
      console.log(`[Auto-Restock System Output]:\n${stdout}`);
    });

    // Step C: Send response immediately to the frontend client without waiting for Python network request
    return NextResponse.json({ 
      success: true, 
      message: `Inventory stock reduced for ${item}. Check triggered.` 
    });

  } catch (err) {
    console.error("[POST /api/inventory]", err);
    return NextResponse.json({ error: "Failed to process inventory update" }, { status: 500 });
  }
}