import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Starting master recipe matching sync...");

    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE product_recipes;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    const [products] = await pool.query("SELECT id, name FROM products");

    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, error: "No products found." }, { status: 400 });
    }

    const recipeRows = [];

    products.forEach((product) => {
      const productName = product.name.toLowerCase();
      const stringId = String(product.id);

      // --- 1. BEANS RAW MATERIALS ---
      if (productName.includes("barako") && productName.includes("liberica")) {
        recipeRows.push([stringId, "Robusta Blend", 1.00]);
      } else if (productName.includes("sagada") || productName.includes("benguet") || productName.includes("mindanao")) {
        recipeRows.push([stringId, "Arabica Beans", 1.00]);
      } else if (productName.includes("house blend")) {
        recipeRows.push([stringId, "Arabica Beans", 0.50]);
        recipeRows.push([stringId, "Robusta Blend", 0.50]);
      }

      // --- 2. DRINK BASE INGREDIENTS ---
      let isDrink = false;

      if (productName.includes("barako brew")) {
        recipeRows.push([stringId, "Robusta Blend", 0.02]);
        isDrink = true;
      } else if (productName.includes("espresso") || productName.includes("americano") || productName.includes("cold brew")) {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
        isDrink = true;
      } else if (productName.includes("latte") || productName.includes("cappuccino") || productName.includes("flat white") || productName.includes("macchiato") || productName.includes("mocha") || productName.includes("gatas") || productName.includes("frost") || productName.includes("frappe") || productName.includes("jelly") || productName.includes("shake") || productName.includes("blended") || productName.includes("tea")) {
        isDrink = true;
        
        // Add beans if it's a coffee base drink
        if (!productName.includes("tea") && !productName.includes("shake") && !productName.includes("chocolate ice") && !productName.includes("ube-latte")) {
          recipeRows.push([stringId, "Arabica Beans", 0.02]);
        }
        
        // Add milk milk volume
        if (productName.includes("frappe") || productName.includes("frost") || productName.includes("jelly")) {
          recipeRows.push([stringId, "Fresh Milk", 0.20]);
        } else if (productName.includes("milk tea") || productName.includes("latte") || productName.includes("cappuccino") || productName.includes("flat white") || productName.includes("macchiato") || productName.includes("mocha") || productName.includes("gatas") || productName.includes("shake") || productName.includes("chocolate ice")) {
          recipeRows.push([stringId, "Fresh Milk", 0.22]);
        }
      }

      // --- 3. SYRUPS & CUP ATTACHMENTS FOR ALL DRINKS ---
      if (isDrink) {
        // Assign 1 paper cup per single beverage item ordered
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);

        // Sweetener additions
        if (productName.includes("spanish") || productName.includes("caramel") || productName.includes("vanilla") || productName.includes("hazelnut") || productName.includes("white chocolate") || productName.includes("iced tea") || productName.includes("frappe") || productName.includes("frost") || productName.includes("shake") || productName.includes("milk tea")) {
          recipeRows.push([stringId, "Sugar Syrup", 0.03]);
        }
        if (productName.includes("matcha")) {
          recipeRows.push([stringId, "Matcha Powder", 0.015]);
        }
      }

      // --- 4. FOODS & SNACKS ---
      if (!isDrink) {
        if (productName.includes("ensaymada") || productName.includes("sandwich") || productName.includes("roll") || productName.includes("mini") || productName.includes("seasonal") || productName.includes("pasta")) {
          recipeRows.push([stringId, "Muffins", 1.00]);
        } else if (productName.includes("cue") || productName.includes("turon") || productName.includes("churros") || productName.includes("pancakes") || productName.includes("waffles")) {
          recipeRows.push([stringId, "Sugar Syrup", 0.03]);
        }
      }
    });

    await pool.query("INSERT INTO product_recipes (product_id, inventory_item, quantity_required) VALUES ?", [recipeRows]);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully mapped ${recipeRows.length} total recipes! Cup mapping and coffee calculations are fixed.` 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}