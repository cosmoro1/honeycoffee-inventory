import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // 1. Ensure the table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_recipes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id VARCHAR(100) NOT NULL,      
          inventory_item VARCHAR(100) NOT NULL,  
          quantity_required DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (inventory_item) REFERENCES inventory(item) ON UPDATE CASCADE
      );
    `);

    // 2. Clear old records to prevent duplicate keys on re-run
    await pool.query("TRUNCATE TABLE product_recipes;");

    // 3. MASTER BULK INSERT FOR THE ENTIRE MENU LIST
    await pool.query(`
      INSERT INTO product_recipes (product_id, inventory_item, quantity_required) VALUES
      
      -- === BEANS CATEGORY (Raw Material Multipliers) ===
      ('batangas-barako-liberica', 'Robusta Blend', 1.00),
      ('sagada-arabica', 'Arabica Beans', 1.00),
      ('benguet-arabica', 'Arabica Beans', 1.00),
      ('kalinga-robusta', 'Robusta Blend', 1.00),
      ('mindanao-excelsa', 'Arabica Beans', 1.00),
      ('house-blend', 'Arabica Beans', 0.50),
      ('house-blend', 'Robusta Blend', 0.50),
      ('espresso-roast', 'Arabica Beans', 1.00),
      ('cold-brew-roast', 'Arabica Beans', 1.00),

      -- === COFFEE DRINKS CATEGORY ===
      ('barako-brew', 'Robusta Blend', 0.02),
      ('barako-brew', 'Paper Cups (L)', 1.00),
      
      ('espresso-double-espresso', 'Arabica Beans', 0.02),
      ('espresso-double-espresso', 'Paper Cups (S)', 1.00),
      
      ('americano-hot-iced', 'Arabica Beans', 0.02),
      ('americano-hot-iced', 'Paper Cups (L)', 1.00),
      
      ('cafe-latte-hot-iced', 'Arabica Beans', 0.02),
      ('cafe-latte-hot-iced', 'Fresh Milk', 0.25),
      ('cafe-latte-hot-iced', 'Paper Cups (L)', 1.00),
      
      ('cappuccino', 'Arabica Beans', 0.02),
      ('cappuccino', 'Fresh Milk', 0.20),
      ('cappuccino', 'Paper Cups (L)', 1.00),
      
      ('flat-white', 'Arabica Beans', 0.02),
      ('flat-white', 'Fresh Milk', 0.18),
      ('flat-white', 'Paper Cups (S)', 1.00),
      
      ('spanish-latte', 'Arabica Beans', 0.02),
      ('spanish-latte', 'Fresh Milk', 0.20),
      ('spanish-latte', 'Sugar Syrup', 0.03),
      ('spanish-latte', 'Paper Cups (L)', 1.00),
      
      ('mocha-hot-iced', 'Arabica Beans', 0.02),
      ('mocha-hot-iced', 'Fresh Milk', 0.22),
      ('mocha-hot-iced', 'Sugar Syrup', 0.02),
      ('mocha-hot-iced', 'Paper Cups (L)', 1.00),
      
      ('caramel-macchiato', 'Arabica Beans', 0.02),
      ('caramel-macchiato', 'Fresh Milk', 0.22),
      ('caramel-macchiato', 'Sugar Syrup', 0.04),
      ('caramel-macchiato', 'Paper Cups (L)', 1.00),
      
      ('vanilla-latte', 'Arabica Beans', 0.02),
      ('vanilla-latte', 'Fresh Milk', 0.25),
      ('vanilla-latte', 'Sugar Syrup', 0.03),
      ('vanilla-latte', 'Paper Cups (L)', 1.00),
      
      ('hazelnut-latte', 'Arabica Beans', 0.02),
      ('hazelnut-latte', 'Fresh Milk', 0.25),
      ('hazelnut-latte', 'Sugar Syrup', 0.03),
      ('hazelnut-latte', 'Paper Cups (L)', 1.00),
      
      ('white-chocolate-mocha', 'Arabica Beans', 0.02),
      ('white-chocolate-mocha', 'Fresh Milk', 0.22),
      ('white-chocolate-mocha', 'Sugar Syrup', 0.04),
      ('white-chocolate-mocha', 'Paper Cups (L)', 1.00),
      
      ('kapeng-gatas', 'Robusta Blend', 0.02),
      ('kapeng-gatas', 'Fresh Milk', 0.15),
      ('kapeng-gatas', 'Paper Cups (S)', 1.00),

      -- === BLENDED / FRAPPE CATEGORY ===
      ('mocha-frost', 'Arabica Beans', 0.02),
      ('mocha-frost', 'Fresh Milk', 0.20),
      ('mocha-frost', 'Sugar Syrup', 0.04),
      ('mocha-frost', 'Paper Cups (L)', 1.00),
      
      ('caramel-frappe', 'Arabica Beans', 0.02),
      ('caramel-frappe', 'Fresh Milk', 0.20),
      ('caramel-frappe', 'Sugar Syrup', 0.05),
      ('caramel-frappe', 'Paper Cups (L)', 1.00),
      
      ('vanilla-frappe', 'Arabica Beans', 0.02),
      ('vanilla-frappe', 'Fresh Milk', 0.20),
      ('vanilla-frappe', 'Sugar Syrup', 0.04),
      ('vanilla-frappe', 'Paper Cups (L)', 1.00),
      
      ('hazelnut-frappe', 'Arabica Beans', 0.02),
      ('hazelnut-frappe', 'Fresh Milk', 0.20),
      ('hazelnut-frappe', 'Sugar Syrup', 0.04),
      ('hazelnut-frappe', 'Paper Cups (L)', 1.00),
      
      ('matcha-blended', 'Matcha Powder', 0.02),
      ('matcha-blended', 'Oat Milk', 0.25),
      ('matcha-blended', 'Sugar Syrup', 0.03),
      ('matcha-blended', 'Paper Cups (L)', 1.00),
      
      ('ube-latte-frappe', 'Fresh Milk', 0.25),
      ('ube-latte-frappe', 'Sugar Syrup', 0.04),
      ('ube-latte-frappe', 'Paper Cups (L)', 1.00),
      
      ('cookies-cream-frappe', 'Fresh Milk', 0.25),
      ('cookies-cream-frappe', 'Sugar Syrup', 0.03),
      ('cookies-cream-frappe', 'Paper Cups (L)', 1.00),
      
      ('chocolate-ice-blended', 'Fresh Milk', 0.25),
      ('chocolate-ice-blended', 'Sugar Syrup', 0.04),
      ('chocolate-ice-blended', 'Paper Cups (L)', 1.00),
      
      ('coffee-jelly-frappe', 'Arabica Beans', 0.02),
      ('coffee-jelly-frappe', 'Fresh Milk', 0.20),
      ('coffee-jelly-frappe', 'Sugar Syrup', 0.03),
      ('coffee-jelly-frappe', 'Paper Cups (L)', 1.00),
      
      ('mango-graham-shake', 'Fresh Milk', 0.20),
      ('mango-graham-shake', 'Sugar Syrup', 0.04),
      ('mango-graham-shake', 'Paper Cups (L)', 1.00),

      -- === TEA CATEGORY ===
      ('classic-milk-tea', 'Fresh Milk', 0.20),
      ('classic-milk-tea', 'Sugar Syrup', 0.04),
      ('classic-milk-tea', 'Paper Cups (L)', 1.00),
      
      ('wintermelon-milk-tea', 'Fresh Milk', 0.20),
      ('wintermelon-milk-tea', 'Sugar Syrup', 0.05),
      ('wintermelon-milk-tea', 'Paper Cups (L)', 1.00),
      
      ('okinawa-milk-tea', 'Fresh Milk', 0.20),
      ('okinawa-milk-tea', 'Sugar Syrup', 0.05),
      ('okinawa-milk-tea', 'Paper Cups (L)', 1.00),
      
      ('thai-milk-tea', 'Fresh Milk', 0.20),
      ('thai-milk-tea', 'Sugar Syrup', 0.05),
      ('thai-milk-tea', 'Paper Cups (L)', 1.00),
      
      ('matcha-latte-hot-iced', 'Matcha Powder', 0.015),
      ('matcha-latte-hot-iced', 'Oat Milk', 0.25),
      ('matcha-latte-hot-iced', 'Sugar Syrup', 0.02),
      ('matcha-latte-hot-iced', 'Paper Cups (L)', 1.00),
      
      ('calamansi-iced-tea', 'Sugar Syrup', 0.04),
      ('calamansi-iced-tea', 'Paper Cups (L)', 1.00),
      
      ('lemon-iced-tea', 'Sugar Syrup', 0.04),
      ('lemon-iced-tea', 'Paper Cups (L)', 1.00),
      
      ('earl-grey-hot-tea', 'Paper Cups (L)', 1.00),
      ('english-breakfast-tea', 'Paper Cups (L)', 1.00),
      ('chamomile-tea', 'Paper Cups (L)', 1.00),
      ('green-tea', 'Paper Cups (L)', 1.00),

      -- === BAKED GOODS & SNACKS ===
      ('ensaymada', 'Muffins', 1.00),
      ('cheese-roll', 'Croissants', 1.00),
      ('pandesal-ham-cheese', 'Muffins', 1.00),
      ('banana-cue', 'Sugar Syrup', 0.02),
      ('turon', 'Sugar Syrup', 0.02),
      ('bibingka-mini', 'Muffins', 1.00),
      ('puto-bumbong-seasonal', 'Muffins', 1.00),
      ('churros-chocolate-dip', 'Sugar Syrup', 0.03),
      ('egg-sandwich', 'Muffins', 1.00),
      ('tuna-melt-sandwich', 'Muffins', 1.00),
      ('clubhouse-sandwich', 'Muffins', 1.00),
      ('pasta-carbonara-spaghetti', 'Muffins', 1.00),
      ('pancakes-syrup', 'Sugar Syrup', 0.04),
      ('waffles-butter-jam', 'Sugar Syrup', 0.03);
    `);

    return NextResponse.json({ success: true, message: "All HONEY COFFEE SHOP menu items compiled and mapped successfully!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}