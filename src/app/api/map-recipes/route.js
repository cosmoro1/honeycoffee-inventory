import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Wiping and seeding exact master product recipes...");

    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE product_recipes;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    const [products] = await pool.query("SELECT id, name, category FROM products");

    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, error: "Run seed-all-products first!" }, { status: 400 });
    }

    const recipeRows = [];

    products.forEach((product) => {
      const name = product.name.toLowerCase().trim();
      const cat = product.category.toLowerCase().trim();
      const stringId = String(product.id);

      // --- ALL BEVERAGES GET A PAPER CUP ---
      if (cat === "coffee" || cat === "blended" || cat === "tea") {
        recipeRows.push([stringId, "Paper Cups (L)", 1.00]);
      }

      // --- BEANS RAW MATERIALS ---
      if (name.includes("barako") && name.includes("liberica")) {
        recipeRows.push([stringId, "Robusta Blend", 1.00]);
      } else if (name.includes("sagada") || name.includes("benguet") || name.includes("mindanao")) {
        recipeRows.push([stringId, "Arabica Beans", 1.00]);
      } else if (name.includes("house blend")) {
        recipeRows.push([stringId, "Arabica Beans", 0.50]);
        recipeRows.push([stringId, "Robusta Blend", 0.50]);
      }

      // --- COFFEE DRINKS ---
      if (name === "barako brew") {
        recipeRows.push([stringId, "Robusta Blend", 0.02]);
      } else if (name === "espresso" || name === "americano" || name === "hot coffee" || name === "cold brew") {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
      } else if (name === "cappuccino" || name === "latte" || name === "cafe latte (hot / iced)" || name === "flat white" || name === "spanish latte" || name === "mocha (hot / iced)" || name === "caramel macchiato" || name === "vanilla latte" || name === "hazelnut latte" || name === "white chocolate mocha" || name === "kapeng gatas") {
        recipeRows.push([stringId, "Arabica Beans", 0.02]);
        recipeRows.push([stringId, "Fresh Milk", 0.22]);
        if (name === "spanish latte" || name === "caramel macchiato" || name === "vanilla latte" || name === "hazelnut latte" || name === "white chocolate mocha") {
          recipeRows.push([stringId, "Sugar Syrup", 0.03]);
        }
      }

      // --- FRAPPES & BLENDED (EXACT MATCHES) ---
      if (cat === "blended" || name.includes("frappe") || name.includes("frost") || name.includes("blended") || name.includes("shake")) {
        recipeRows.push([stringId, "Sugar Syrup", 0.03]);
        
        // Milk setup for blended
        if (name.includes("matcha")) {
          recipeRows.push([stringId, "Oat Milk", 0.25]);
          recipeRows.push([stringId, "Matcha Powder", 0.015]);
        } else {
          recipeRows.push([stringId, "Fresh Milk", 0.20]);
        }

        // Coffee base checks for frappes
        if (name.includes("mocha") || name.includes("caramel") || name.includes("vanilla") || name.includes("hazelnut") || name.includes("jelly") || name.includes("frost")) {
          recipeRows.push([stringId, "Arabica Beans", 0.02]);
        }
      }

      // --- TEAS ---
      if (cat === "tea") {
        if (name.includes("milk tea")) {
          recipeRows.push([stringId, "Fresh Milk", 0.20]);
          recipeRows.push([stringId, "Sugar Syrup", 0.03]);
        } else if (name.includes("iced tea")) {
          recipeRows.push([stringId, "Sugar Syrup", 0.03]);
        } else if (name === "matcha latte") {
          recipeRows.push([stringId, "Oat Milk", 0.22]);
          recipeRows.push([stringId, "Matcha Powder", 0.015]);
        }
      }

      // --- BAKED GOODS & SNACKS ---
      if (cat === "snacks") {
        if (name.includes("croissant") || name === "cheese danish") {
          recipeRows.push([stringId, "Croissants", 1.00]);
        } else if (name.includes("muffin") || name.includes("ensaymada") || name === "banana bread" || name.includes("sandwich") || name.includes("roll")) {
          recipeRows.push([stringId, "Muffins", 1.00]);
        }
        if (name.includes("cue") || name.includes("turon")) {
          recipeRows.push([stringId, "Sugar Syrup", 0.02]);
        }
      }
    });

    await pool.query(
      "INSERT INTO product_recipes (product_id, inventory_item, quantity_required) VALUES ?",
      [recipeRows]
    );

    return NextResponse.json({ 
      success: true, 
      message: `Perfect! Inserted ${recipeRows.length} exact recipe links into your database.` 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}