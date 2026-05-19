import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Starting master recipe matching sync...");

    // 1. Temporarily disable foreign key checks to safely truncate the table
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE product_recipes;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. Fetch all products from your live database to cross-reference names with IDs
    const [products] = await pool.query("SELECT id, name FROM products");

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No items found in the products table. Seed products first!" 
      }, { status: 400 });
    }

    const recipeRows = [];

    // 3. Loop through your live database items and dynamically build recipes based on their real names
    products.forEach((product) => {
      const productName = product.name.toLowerCase();
      const stringId = String(product.id); // Ensures it handles numeric or text IDs perfectly

      // === BEANS CATEGORY (Raw Materials / Multipliers) ===
      if (productName.includes("barako") && productName.includes("liberica")) {
        recipeRows.push([stringId, "Robusta Blend", 1.00]);
      } else if (productName.includes("sagada") || productName.includes("benguet") || productName.includes("mindanao")) {
        recipeRows.push([stringId, "Arabica Beans", 1.00]);
      } else if (productName.includes("house blend")) {
        recipeRows.push([stringId, "Arabica Beans", 0.50]);
        recipeRows.push([stringId, "Robusta Blend", 0.50]);
      }

      // === COFFEE DRINKS ===
      if (productName.includes("barako brew")) {
        recipeRows.push([stringId, "Robusta Blend", 0.02]);
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      } else if (productName.includes("espresso") || productName.includes("americano") || productName.includes("cold brew")) {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      } else if (productName.includes("latte") || productName.includes("cappuccino") || productName.includes("flat white") || productName.includes("macchiato") || productName.includes("mocha") || productName.includes("gatas")) {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
        recipeRows.push([stringId, "Fresh Milk", 0.22]);
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      }

      // === ADD SYRUP FOR SWEET DRINKS ===
      if (productName.includes("spanish") || productName.includes("caramel") || productName.includes("vanilla") || productName.includes("hazelnut") || productName.includes("white chocolate")) {
        recipeRows.push([stringId, "Sugar Syrup", 0.03]);
      }

      // === FRAPPES & BLENDED ===
      if (productName.includes("frost") || productName.includes("frappe") || productName.includes("jelly")) {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
        recipeRows.push([stringId, "Fresh Milk", 0.20]);
        recipeRows.push([stringId, "Sugar Syrup", 0.04]);
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      } else if (productName.includes("shake") || productName.includes("cream frappe") || productName.includes("chocolate ice")) {
        recipeRows.push([stringId, "Fresh Milk", 0.22]);
        recipeRows.push([stringId, "Sugar Syrup", 0.04]);
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      }

      // === TEA & MILK TEA ===
      if (productName.includes("milk tea")) {
        recipeRows.push([stringId, "Fresh Milk", 0.20]);
        recipeRows.push([stringId, "Sugar Syrup", 0.04]);
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      } else if (productName.includes("iced tea") || productName.includes("hot tea") || productName.includes("green tea") || productName.includes("chamomile")) {
        recipeRows.push([stringId, "Sugar Syrup", 0.02]);
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      }

      // === SPECIAL EXTRACTS ===
      if (productName.includes("matcha")) {
        recipeRows.push([stringId, "Matcha Powder", 0.015]);
      }

      // === BAKED GOODS & SNACKS ===
      if (productName.includes("ensaymada") || productName.includes("sandwich") || productName.includes("roll") || productName.includes("mini") || productName.includes("seasonal") || productName.includes("pasta")) {
        recipeRows.push([stringId, "Muffins", 1.00]); // Using your baseline inventory item group mapping
      } else if (productName.includes("cue") || productName.includes("turon") || productName.includes("churros") || productName.includes("pancakes") || productName.includes("waffles")) {
        recipeRows.push([stringId, "Sugar Syrup", 0.03]);
      }
    });

    if (recipeRows.length === 0) {
      return NextResponse.json({ success: true, message: "Parsed names but zero recipe rows were generated." });
    }

    // 4. Perform a bulk batch insert into the database
    await pool.query(
      "INSERT INTO product_recipes (product_id, inventory_item, quantity_required) VALUES ?",
      [recipeRows]
    );

    return NextResponse.json({ 
      success: true, 
      message: `Successfully mapped and created ${recipeRows.length} total ingredient recipe links using dynamic numerical IDs!` 
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}