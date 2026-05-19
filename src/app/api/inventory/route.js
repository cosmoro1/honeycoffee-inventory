import { NextResponse } from "next/server";
import pool from "@/lib/db";

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

export async function POST(request) {
  try {
    const body = await request.json();

    const targetProductId = body.productId || body.item;
    const quantitySold = Number(body.quantitySold || body.quantityReduced);

    if (!targetProductId || isNaN(quantitySold)) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    // 1. Fetch all recipe parts mapping to the ID parameter (Cast to String to ensure column type match)
    const [recipeIngredients] = await pool.query(
      "SELECT inventory_item, quantity_required FROM product_recipes WHERE product_id = ?",
      [String(targetProductId)]
    );

    // Safety Fallback Block: If no recipe exists, attempt a direct table match against raw ingredient names
    if (!recipeIngredients || recipeIngredients.length === 0) {
      console.log(`[Inventory Engine]: No recipe configured for ID: ${targetProductId}. Running safe fallback.`);
      
      const [directRowMatch] = await pool.query("SELECT item FROM inventory WHERE item = ?", [targetProductId]);
      
      if (directRowMatch.length > 0) {
        await pool.query(
          `UPDATE inventory 
           SET current_stock = current_stock - ?,
               status = CASE 
                 WHEN (current_stock) <= 0 THEN 'Out of Stock'
                 WHEN (current_stock) <= 10 THEN 'Critical'
                 WHEN (current_stock) <= 25 THEN 'Low Stock'
                 ELSE 'OK'
               END,
               last_updated = NOW()
           WHERE item = ?`,
          [quantitySold, targetProductId] // Directly updates utilizing clean, simple placeholder matching bounds
        );
      } else {
        console.warn(`[Inventory Sync Terminated]: Unknown item ID tracking point: ${targetProductId}`);
        return NextResponse.json({ success: true, message: "Unknown product ID reference. Stocks left intact." });
      }
    } else {
      // Recipe match confirmed! Run loop through database table array elements safely
      for (const ingredient of recipeIngredients) {
        const totalDeduction = Number(ingredient.quantity_required) * quantitySold;

        // Optimized query processing execution logic avoiding nested double calculations
        await pool.query(
          `UPDATE inventory 
           SET current_stock = current_stock - ?,
               last_updated = NOW()
           WHERE item = ?`,
          [totalDeduction, ingredient.inventory_item]
        );

        // Recalculate status strings based on the structural drops safely
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

    // Background Async Procurement Trigger Framework (Restock Engine)
    (async () => {
      try {
        const [lowStockItems] = await pool.query(
          "SELECT item, current_stock, unit FROM inventory WHERE status = 'Low Stock' OR status = 'Critical'"
        );

        if (!lowStockItems || lowStockItems.length === 0) return;

        const filteredItems = [];
        for (const stockItem of lowStockItems) {
          const [recentOrders] = await pool.query(
            `SELECT id FROM activity_logs 
             WHERE type = 'Order' 
               AND message LIKE ? 
               AND created_at >= NOW() - INTERVAL 1 DAY`,
            [`%${stockItem.item}%`]
          );

          if (recentOrders.length === 0) filteredItems.push(stockItem);
        }

        if (filteredItems.length === 0) return;

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
        filteredItems.forEach((lowItem, index) => {
          const itemCode = lowItem.item.toUpperCase().replace(/\s+/g, "-");
          itemLogNames.push(`100x ${lowItem.item}`);
          bodySegments.push(`PO1*${index + 1}*100*EA*5.00*PE*VN*${itemCode}*UP*012345678905`);
        });

        bodySegments.push(`CTT*${filteredItems.length}`, `SE*${bodySegments.length + 1}*0001`);
        const fullX12Payload = `${isa}${gs}${bodySegments.join("~\n")}~\nGE*1*1~\nIEA*1*${controlNum}~\n`;

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
      } catch (bgErr) {
        console.error("[Auto-Restock System Exception]:", bgErr.message);
      }
    })();

    return NextResponse.json({ 
      success: true, 
      message: `Stock inventory successfully reduced for choice transaction ${targetProductId}.` 
    });

  } catch (err) {
    console.error("[POST /api/inventory]", err);
    return NextResponse.json({ error: "Failed to process inventory update" }, { status: 500 });
  }
}