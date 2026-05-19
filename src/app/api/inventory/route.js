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

// 2. POST: Deduct recipe ingredients accurately based on quantities sold
export async function POST(request) {
  try {
    const body = await request.json();

    const targetProductId = body.productId || body.item;
    const quantitySold = Number(body.quantitySold || body.quantityReduced);

    if (!targetProductId || isNaN(quantitySold)) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    // A. Check if a custom ingredient recipe structure exists for this ID
    let [recipeIngredients] = await pool.query(
      "SELECT inventory_item, quantity_required FROM product_recipes WHERE product_id = ?",
      [String(targetProductId)]
    );

    // B. GLOBAL SAFETY FALLBACK SYSTEM
    // If the database has no formula mapped yet, dynamically detect the item category from the products table!
    if (!recipeIngredients || recipeIngredients.length === 0) {
      console.log(`[Inventory Engine] Missing custom recipe for ID ${targetProductId}. Running global categorical mapping...`);
      
      const [productMeta] = await pool.query("SELECT name, category FROM products WHERE id = ?", [targetProductId]);
      
      if (productMeta && productMeta.length > 0) {
        const cat = productMeta[0].category.toLowerCase();
        const name = productMeta[0].name.toLowerCase();
        const temporaryRecipes = [];

        // If it's a liquid beverage group, it MUST deduct a cup!
        if (cat === "coffee" || cat === "blended" || cat === "tea") {
          temporaryRecipes.push({ inventory_item: "Paper Cups (L)", quantity_required: 1.00 });
          
          if (cat === "coffee" || name.includes("frappe") || name.includes("coffee")) {
            temporaryRecipes.push({ inventory_item: "Arabica Beans", quantity_required: 0.02 });
          }
          if (name.includes("latte") || name.includes("cappuccino") || cat === "blended") {
            temporaryRecipes.push({ inventory_item: "Fresh Milk", quantity_required: 0.22 });
          }
        } else if (cat === "snacks") {
          temporaryRecipes.push({ inventory_item: "Muffins", quantity_required: 1.00 });
        }

        recipeIngredients = temporaryRecipes;
      }
    }

    // C. DATABASE DEDUCTION UPDATE EXECUTION
    if (recipeIngredients && recipeIngredients.length > 0) {
      for (const ingredient of recipeIngredients) {
        const totalDeduction = Number(ingredient.quantity_required) * quantitySold;

        // Deduct raw ingredient stock weights
        await pool.query(
          "UPDATE inventory SET current_stock = current_stock - ?, last_updated = NOW() WHERE item = ?",
          [totalDeduction, ingredient.inventory_item]
        );

        // Dynamically adjust inventory system critical status flags
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
    } else {
      console.warn(`[Inventory Sync Aborted] Unmapped item context reference: ${targetProductId}`);
    }

    // D. BACKGROUND AUTOMATED SUPPLY RESTOCK TRiggers (EDI 850 Automation)
    (async () => {
      try {
        const [lowStockItems] = await pool.query(
          "SELECT item, current_stock, unit FROM inventory WHERE status = 'Low Stock' OR status = 'Critical'"
        );
        if (!lowStockItems || lowStockItems.length === 0) return;

        const filteredItems = [];
        for (const stockItem of lowStockItems) {
          const [recentOrders] = await pool.query(
            "SELECT id FROM activity_logs WHERE type = 'Order' AND message LIKE ? AND created_at >= NOW() - INTERVAL 1 DAY",
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
        let bodySegments = [`ST*850*0001`, `BEG*00*NE*${poNumber}**${date8Char}`, `N1*BT*HONEY COFFEE SHOP*92*HQ001`, `N1*ST*HONEY COFFEE SHOP*92*STORE01`, `N3*Unit 3 Ground Floor Sunrise Commercial Building`, `N4*Calamba*Laguna*4027*PH`, `N1*SU*Sermacrops*92*SUP123`];

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
          headers: { "Authorization": `Bearer ${process.env.MY_INBOUND_TOKEN || "test"}`, "Content-Type": "application/EDI-X12" },
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

    return NextResponse.json({ success: true, message: "Inventory transaction processed successfully." });

  } catch (err) {
    console.error("[POST /api/inventory]", err);
    return NextResponse.json({ error: "Failed to process inventory update" }, { status: 500 });
  }
}