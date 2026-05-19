import { NextResponse } from "next/server";
import pool from "@/lib/db";

// 1. GET: Fetch current live stock levels with priority sorting
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

// 2. POST: Process multi-item nested ingredient deductions and restock checks
export async function POST(request) {
  try {
    const body = await request.json();

    const targetProductId = body.productId || body.item;
    const quantitySold = Number(body.quantitySold || body.quantityReduced);

    if (!targetProductId || isNaN(quantitySold)) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    // A. Check if an explicit blueprint recipe configuration exists in the DB
    let [recipeIngredients] = await pool.query(
      "SELECT inventory_item, quantity_required FROM product_recipes WHERE product_id = ?",
      [String(targetProductId)]
    );

    // B. BULLETPROOF ACCUMULATOR FALLBACK ENGINE
    // Runs dynamically if map-recipes hasn't cataloged this specific numeric database primary key yet
    if (!recipeIngredients || recipeIngredients.length === 0) {
      console.log(`[Inventory Engine] Recipe missing for product ID ${targetProductId}. Running fallback builder...`);
      
      const [productMeta] = await pool.query("SELECT name, category FROM products WHERE id = ?", [targetProductId]);
      
      if (productMeta && productMeta.length > 0) {
        const cat = productMeta[0].category.toLowerCase().trim();
        const name = productMeta[0].name.toLowerCase().trim();
        const temporaryRecipes = [];

        // Determine if it belongs to any liquid beverage group
        const isBeverage = (cat === "coffee" || cat === "blended" || cat === "tea" || name.includes("frappe") || name.includes("latte") || name.includes("brew") || name.includes("tea"));

        if (isBeverage) {
          // Rule #1: EVERY liquid beverage selection drops exactly 1 Paper Cup unit!
          temporaryRecipes.push({ inventory_item: "Paper Cups (L)", quantity_required: 1.00 });

          // Rule #2: Coffee Bean Deductions (Exclude pure teas, fruit shakes, and cocoa creamers)
          const needsBeans = (cat === "coffee" || name.includes("coffee") || name.includes("frappe") || name.includes("espresso") || name.includes("brew")) && 
                             (!name.includes("tea") && !name.includes("mango") && !name.includes("cookies") && !name.includes("chocolate"));
          
          if (needsBeans) {
            temporaryRecipes.push({ inventory_item: "Arabica Beans", quantity_required: 0.02 });
          }

          // Rule #3: Fresh Milk Line Deductions
          const needsMilk = (name.includes("latte") || name.includes("cappuccino") || name.includes("mocha") || name.includes("white") || cat === "blended" || name.includes("frappe") || name.includes("milk tea") || name.includes("gatas") || name.includes("shake"));
          
          if (needsMilk && !name.includes("matcha")) { // Matcha uses your Oat Milk line
            const milkVolume = (cat === "blended" || name.includes("frappe")) ? 0.20 : 0.22;
            temporaryRecipes.push({ inventory_item: "Fresh Milk", quantity_required: milkVolume });
          }

          // Rule #4: Sweetener Syrup Volume Deductions
          const needsSyrup = (name.includes("spanish") || name.includes("caramel") || name.includes("vanilla") || name.includes("hazelnut") || name.includes("white chocolate") || name.includes("frappe") || name.includes("shake") || name.includes("milk tea") || name.includes("frost") || name.includes("cue") || name.includes("turon"));
          
          if (needsSyrup) {
            temporaryRecipes.push({ inventory_item: "Sugar Syrup", quantity_required: 0.03 });
          }

          // Rule #5: Matcha Extracts & Alternative Plant Milks
          if (name.includes("matcha")) {
            temporaryRecipes.push({ inventory_item: "Matcha Powder", quantity_required: 0.015 });
            temporaryRecipes.push({ inventory_item: "Oat Milk", quantity_required: 0.25 });
          }
        } else {
          // --- PASTRY & SNACKS ACCUMULATOR ---
          if (name.includes("croissant") || name.includes("danish")) {
            temporaryRecipes.push({ inventory_item: "Croissants", quantity_required: 1.00 });
          } else if (name.includes("muffin") || name.includes("ensaymada") || name.includes("bread") || name.includes("sandwich") || name.includes("pasta") || name.includes("roll")) {
            temporaryRecipes.push({ inventory_item: "Muffins", quantity_required: 1.00 });
          }
          
          if (name.includes("cue") || name.includes("turon")) {
            temporaryRecipes.push({ inventory_item: "Sugar Syrup", quantity_required: 0.02 });
          }
        }

        recipeIngredients = temporaryRecipes;
      }
    }

    // C. CLEAN SEQUENTIAL DATABASE STOCK DROPS
    if (recipeIngredients && recipeIngredients.length > 0) {
      for (const ingredient of recipeIngredients) {
        const totalDeduction = Number(ingredient.quantity_required) * quantitySold;

        // 1. Subtract values from raw tracking rows
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
      console.log(`[Inventory Success] Deducted components for ID ${targetProductId}:`, recipeIngredients);
    } else {
      console.warn(`[Inventory Warning] No items could be resolved for deduction mapping on ID: ${targetProductId}`);
    }

    // D. BACKGROUND AUTOMATED RESTOCK MANAGER (Asynchronous EDI Dispatch)
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