import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Starting master recipe matching sync with real menu profiles...");

    // 1. Clear out old layout mappings to ensure clean constraints
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE product_recipes;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. Fetch all products dynamically to pull their active numeric database IDs
    const [products] = await pool.query("SELECT id, name FROM products");

    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, error: "No products found in database." }, { status: 400 });
    }

    const recipeRows = [];

    // 3. Process every active menu entry found in your POS grid view
    products.forEach((product) => {
      const productName = product.name.toLowerCase().trim();
      const stringId = String(product.id);

      // --- FLAG TO SEPARATE DRINKS AND SNACKS ---
      let isDrink = false;

      // --- A. COFFEE DRINKS BASE MATCHING ---
      if (productName === "espresso") {
        recipeRows.push([stringId, "Arabica Beans", 0.02]); // 20g beans
        isDrink = true;
      } else if (productName === "americano" || productName === "hot coffee" || productName === "cold brew") {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
        isDrink = true;
      } else if (productName === "cappuccino" || productName === "latte" || productName === "cafe latte (hot / iced)" || productName === "mocha (hot / iced)" || productName === "caramel macchiato" || productName === "vanilla latte" || productName === "hazelnut-latte") {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
        recipeRows.push([stringId, "Fresh Milk", 0.22]); // 220ml fresh milk base
        isDrink = true;
      } else if (productName.includes("barako")) {
        recipeRows.push([stringId, "Robusta Blend", 0.02]);
        isDrink = true;
      }

      // --- B. TEAS & BLENDED INGREDIENTS ---
      if (productName === "matcha latte" || productName.includes("matcha")) {
        recipeRows.push([stringId, "Matcha Powder", 0.015]); // 15g matcha
        recipeRows.push([stringId, "Oat Milk", 0.25]);       // 250ml oat milk
        isDrink = true;
      } else if (productName === "green tea" || productName === "chamomile" || productName.includes("tea")) {
        // Hot / Iced teas use water base instead of fresh dairy milk milk lines
        isDrink = true;
      }

      // --- C. SPECIALTY SYRUP SYNERGY MODIFIERS ---
      if (productName === "latte" || productName === "caramel macchiato" || productName.includes("frappe") || productName.includes("milk tea")) {
        recipeRows.push([stringId, "Sugar Syrup", 0.03]);
      }

      // --- D. THE FIXED UNIVERSAL LIQUID CUP ASSIGNMENT LOOP ---
      if (isDrink) {
        // Every single beverage item sold from your store automatically drops 1 Paper Cup!
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      }

      // --- E. BAKED GOODS & PASTRY STOCK ALIGNMENTS ---
      if (!isDrink) {
        if (productName.includes("croissant") || productName === "cheese danish") {
          recipeRows.push([stringId, "Croissants", 1.00]); // Maps directly to your 'Croissants' table row
        } else if (productName.includes("muffin") || productName.includes("ensaymada")) {
          recipeRows.push([stringId, "Muffins", 1.00]);    // Maps directly to your 'Muffins' table row
        } else if (productName === "banana bread" || productName.includes("sandwich") || productName.includes("pasta")) {
          // General fallback category for unique bakery items
          recipeRows.push([stringId, "Muffins", 1.00]);
        } else if (productName === "banana cue" || productName === "turon") {
          recipeRows.push([stringId, "Sugar Syrup", 0.02]); // Glaze coating base
        }
      }
    });

    // 4. Batch push the mapped recipes safely into the table
    await pool.query(
      "INSERT INTO product_recipes (product_id, inventory_item, quantity_required) VALUES ?",
      [recipeRows]
    );

    return NextResponse.json({ 
      success: true, 
      message: `Successfully generated ${recipeRows.length} blueprint recipes mapped to real IDs! Paper cup tracking locked.` 
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}