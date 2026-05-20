import { NextResponse } from "next/server";
import pool from "@/lib/db";

// 1. GET: Fetch stock tracking items for layout views
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

// 2. POST: Deduct recipe ingredients and trigger exactly ONE bundled PO if items are low
export async function POST(request) {
  try {
    const body = await request.json();
    const cartItems = Array.isArray(body) ? body : (body.items ? body.items : [body]);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 📦 A. DEDUCT ALL CART INGREDIENTS IN A SYNCHRONOUS TRANSACTION LOOP
    for (const cartItem of cartItems) {
      const targetProductId = cartItem.productId || cartItem.item || cartItem.id;
      const quantitySold = Number(cartItem.quantitySold || cartItem.quantityReduced || cartItem.quantity || 1);

      if (!targetProductId || isNaN(quantitySold)) continue;

      const [recipeIngredients] = await pool.query(
        "SELECT inventory_item, quantity_required FROM product_recipes WHERE product_id = ?",
        [String(targetProductId)]
      );

      if (recipeIngredients && recipeIngredients.length > 0) {
        for (const ingredient of recipeIngredients) {
          const totalDeduction = Number(ingredient.quantity_required) * quantitySold;

          // 1. Subtract values from raw stock data rows
          await pool.query(
            "UPDATE inventory SET current_stock = current_stock - ?, last_updated = NOW() WHERE item = ?",
            [totalDeduction, ingredient.inventory_item]
          );

          // 2. Adjust live tracking health thresholds (OK, Low, Critical)
          await pool.query(
            `UPDATE inventory 
             SET status = CASE 
                   WHEN current_stock <= 0 THEN 'Out of Stock'
                   WHEN current_stock <= 10 THEN 'Critical'
                   WHEN current_stock <= 25 THEN 'Low Stock'
                   ELSE 'OK'
                 END
             WHERE item = ?`,
            [ingredient.inventory_item]
          );
        }
      }
    }

    // 🚚 B. BUNDLED RESTOCK MANAGER (Runs sequentially after all updates are finished)
    try {
      // 1. Scan the database to grab ALL items that are currently low or critical
      const [lowStockItems] = await pool.query(
        "SELECT item, current_stock, unit FROM inventory WHERE status = 'Low Stock' OR status = 'Critical'"
      );

      // Gatekeeper: If nothing is low, stop completely.
      if (lowStockItems && lowStockItems.length > 0) {
        
        // Anti-spam duplicate filter: Check if any of these low items were already ordered today
        const filteredItems = [];
        for (const stockItem of lowStockItems) {
          const [recentOrders] = await pool.query(
            "SELECT id FROM activity_logs WHERE type = 'Order' AND message LIKE ? AND created_at >= NOW() - INTERVAL 1 DAY",
            [`%${stockItem.item}%`]
          );
          if (recentOrders.length === 0) filteredItems.push(stockItem);
        }

        // Only proceed if there are low items that haven't been ordered in the last 24 hours
        if (filteredItems.length > 0) {
          const now = new Date();
          const date6Char = now.toISOString().slice(2, 10).replace(/-/g, "");
          const date8Char = now.toISOString().slice(0, 10).replace(/-/g, "");
          const time4Char = now.toTimeString().slice(0, 5).replace(":", "");
          const controlNum = "000000001";
          const poNumber = `PO${time4Char}${now.getSeconds()}`;

          let isa = `ISA*00* *00* *ZZ*HONEYCOFFEE   *ZZ*SERMACROPS    *${date6Char}*${time4Char}*U*00401*${controlNum}*0*P*>~\n`;
          let gs = `GS*PO*HONEYCOFFEE*SERMACROPS*${date8Char}*${time4Char}*1*X*004010~\n`;
          let bodySegments = [
            `ST*850*0001`, 
            `BEG*00*NE*${poNumber}**${date8Char}`, 
            `N1*BT*HONEY COFFEE SHOP*92*HQ001`, 
            `N1*ST*HONEY COFFEE SHOP*92*STORE01`, 
            `N3*Unit 3 Ground Floor Sunrise Commercial Building`, 
            `N4*Calamba*Laguna*4027*PH`, 
            `N1*SU*Sermacrops*92*SUP123`
          ];

          let itemLogNames = [];

          // Add ALL qualifying low stock items into this single purchase order loop body
          filteredItems.forEach((lowItem, index) => {
            const itemCode = lowItem.item.toUpperCase().replace(/\s+/g, "-");
            const databaseUnit = lowItem.unit.toLowerCase().trim();
            
            let ediUnitQualifier = "EA"; 
            let orderQuantity = 100;     
            
            if (databaseUnit === "kg") {
              ediUnitQualifier = "KG";   
              orderQuantity = 10;        
            } else if (databaseUnit === "l") {
              ediUnitQualifier = "CA";   
              orderQuantity = 5;         
            }

            itemLogNames.push(`${orderQuantity}${lowItem.unit} ${lowItem.item}`);
            bodySegments.push(`PO1*${index + 1}*${orderQuantity}*${ediUnitQualifier}*5.00*PE*VN*${itemCode}*UP*012345678905`);
          });

          bodySegments.push(`CTT*${filteredItems.length}`, `SE*${bodySegments.length + 1}*0001`);
          const fullX12Payload = `${isa}${gs}${bodySegments.join("~\n")}~\nGE*1*1~\nIEA*1*${controlNum}~\n`;

          // Transmit the single bundled payload
          const supplierRes = await fetch("https://sermacrops-repo.onrender.com/api/edi/inbound", {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${process.env.MY_INBOUND_TOKEN || "test"}`, 
              "Content-Type": "application/EDI-X12" 
            },
            body: fullX12Payload
          });

          if (supplierRes.ok) {
            const manilaOffset = 8 * 60 * 60 * 1000;
            const mysqlTimestamp = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + manilaOffset).toISOString().slice(0, 19).replace("T", " ");
            const localLogMessage = `Autogenerated restock Purchase Order ${poNumber} dispatched to Sermacrops for: [ ${itemLogNames.join(", ")} ].`;

            await pool.query(
              "INSERT INTO activity_logs (type, reference, message, status, created_at, edi_doc_type, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
              ["Order", poNumber, localLogMessage, "OK", mysqlTimestamp, "850", fullX12Payload]
            );
          }
        }
      }
    } catch (bgErr) {
      console.error("[Auto-Restock System Exception]:", bgErr.message);
    }

    return NextResponse.json({ success: true, message: "Inventory updated and check sequence completed." });

  } catch (err) {
    console.error("[POST /api/inventory]", err);
    return NextResponse.json({ error: "Failed to process inventory update" }, { status: 500 });
  }
}