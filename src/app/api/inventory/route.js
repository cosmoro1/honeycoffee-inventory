import { NextResponse } from "next/server";
import pool from "@/lib/db";

// 1. GET ENDPOINT: Fetch stock tracking items with layout sorting
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

// 2. FIXED POST ENDPOINT: Flexible parameter checking, recipe matching, and automated restock logs
export async function POST(request) {
  try {
    const body = await request.json();

    // Flexible parameters: accepts 'productId' or 'item' / 'quantitySold' or 'quantityReduced'
    const targetProductId = body.productId || body.item;
    const quantitySold = body.quantitySold || body.quantityReduced;

    // Validate request parameters safely
    if (!targetProductId || !quantitySold) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Step A: Look up all recipe components mapped to this product ID (e.g., '12')
    const [recipeIngredients] = await pool.query(
      "SELECT inventory_item, quantity_required FROM product_recipes WHERE product_id = ?",
      [String(targetProductId)]
    );

    // Safety fallback: If this specific item has no mapped recipe components, treat it as a direct inventory row match
    if (!recipeIngredients || recipeIngredients.length === 0) {
      console.log(`[Inventory Engine]: No recipe configured for ID: ${targetProductId}. Attempting direct item reduction fallback.`);
      
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
        [quantitySold, quantitySold, quantitySold, quantitySold, targetProductId]
      );
    } else {
      // Loop through and deduct every recipe ingredient needed for this beverage/snack
      for (const ingredient of recipeIngredients) {
        const totalDeduction = ingredient.quantity_required * quantitySold;

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
          [totalDeduction, totalDeduction, totalDeduction, totalDeduction, ingredient.inventory_item]
        );
      }
    }

    // Step B: Asynchronously handle your background restock validations and EDI generation
    (async () => {
      try {
        // 1. Fetch current items running Low or Critical
        const [lowStockItems] = await pool.query(
          "SELECT item, current_stock, unit FROM inventory WHERE status = 'Low Stock' OR status = 'Critical'"
        );

        if (!lowStockItems || lowStockItems.length === 0) return;

        // 2. ANTI-SPAM DE-DUPLICATION GUARD: Check for active orders sent in the past 24 hours
        const filteredItems = [];
        for (const stockItem of lowStockItems) {
          const [recentOrders] = await pool.query(
            `SELECT id FROM activity_logs 
             WHERE type = 'Order' 
               AND message LIKE ? 
               AND created_at >= NOW() - INTERVAL 1 DAY`,
            [`%${stockItem.item}%`]
          );

          if (recentOrders.length === 0) {
            filteredItems.push(stockItem);
          }
        }

        if (filteredItems.length === 0) {
          console.log("[Auto-Restock System]: Duplicate purchase orders blocked. Active restocks already underway.");
          return;
        }

        // 3. Generate ANSI X12 850 Purchase Order Document
        const now = new Date();
        const date6Char = now.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
        const date8Char = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
        const time4Char = now.toTimeString().slice(0, 5).replace(":", "");  // HHMM
        
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
          `N1*SU*Sermacrops*92*SUP123`,
          `N3*456 Industrial Road Barangay San Isidro`,
          `N4*Batangas City*Batangas*4200*PH`,
          `PER*BD*Purchasing Department*TE*639000000000`
        ];

        let itemLogNames = [];

        filteredItems.forEach((lowItem, index) => {
          const itemCode = lowItem.item.toUpperCase().replace(/\s+/g, "-");
          const qty = 100;
          const unit = "EA";
          const price = "5.00";
          
          itemLogNames.push(`${qty}x ${lowItem.item}`);
          bodySegments.push(`PO1*${index + 1}*${qty}*${unit}*${price}*PE*VN*${itemCode}*UP*012345678905`);
        });

        bodySegments.push(`CTT*${filteredItems.length}`);
        bodySegments.push(`SE*${bodySegments.length + 1}*0001`);

        const bodyContent = bodySegments.join("~\n") + "~\n";
        const fullX12Payload = `${isa}${gs}${bodyContent}GE*1*1~\nIEA*1*${controlNum}~\n`;

        // 4. Send payload to Sermacrops inbound webhook
        const supplierRes = await fetch("https://sermacrops-repo.onrender.com/api/edi/inbound", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.MY_INBOUND_TOKEN || "test"}`,
            "Content-Type": "application/EDI-X12"
          },
          body: fullX12Payload
        });

        if (!supplierRes.ok) throw new Error(`Supplier responded with code: ${supplierRes.status}`);

        // 5. Insert historical activity record to build the timeline dashboard
        const manilaOffset = 8 * 60 * 60 * 1000;
        const manilaDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + manilaOffset);
        const mysqlTimestamp = manilaDate.toISOString().slice(0, 19).replace("T", " ");
        const localLogMessage = `Autogenerated restock Purchase Order ${poNumber} dispatched to Sermacrops for: [ ${itemLogNames.join(", ")} ].`;

        await pool.query(
          "INSERT INTO activity_logs (type, reference, message, status, created_at, edi_doc_type, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
          ["Order", poNumber, localLogMessage, "OK", mysqlTimestamp, "850", fullX12Payload]
        );

        console.log(`[Auto-Restock System Output]: Dispatched ${poNumber} perfectly.`);
      } catch (bgErr) {
        console.error("[Auto-Restock System Exception]:", bgErr.message);
      }
    })();

    // Step C: Respond immediately to customer interface
    return NextResponse.json({ 
      success: true, 
      message: `Inventory updated for product selection ${targetProductId}. Processed cleanly.` 
    });

  } catch (err) {
    console.error("[POST /api/inventory]", err);
    return NextResponse.json({ error: "Failed to process inventory update" }, { status: 500 });
  }
}