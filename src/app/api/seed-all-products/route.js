import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Wiping and batch-seeding all 45+ master products into the database...");

    // 1. Temporarily bypass constraints to drop old truncated data safely
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE products;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. Full clean list of your real menu items, aligned with your public/images/menu folder names
    const masterProducts = [
      ["Batangas Barako (Liberica)", "Beans", 520, "Popular", "Bold, strong, distinctly Filipino", "/images/menu/batangas-barako-liberica.jpg"],
      ["Sagada Arabica", "Beans", 500, "Available", "Smooth floral notes from Mountain Province", "/images/menu/sagada-arabica.jpg"],
      ["Benguet Arabica", "Beans", 480, "Available", "Balanced and nutty from highlands", "/images/menu/benguet-arabica.jpg"],
      ["Kalinga Robusta", "Beans", 390, "Available", "Earthy, full-bodied, perfect for strong brews", "/images/menu/kalinga-robusta.jpg"],
      ["Mindanao Excelsa", "Beans", 460, "Available", "Rare beans with fruity undertones", "/images/menu/mindanao-excelsa.jpg"],
      ["House Blend", "Beans", 430, "Popular", "BREW signature mix of Arabica and Robusta", "/images/menu/house-blend.jpg"],
      ["Espresso Roast", "Beans", 450, "Available", "Dark and rich for espresso machines", "/images/menu/espresso-roast.jpg"],
      ["Cold Brew Roast", "Beans", 440, "Available", "Medium roast optimized for cold brewing", "/images/menu/cold-brew-roast.jpg"],
      ["Barako Brew", "Coffee", 120, "Popular", "Strong traditional brew", "/images/menu/barako-brew.jpg"],
      ["Espresso", "Coffee", 95, "Available", "Strong and bold single shot", "/images/menu/espresso-double-espresso.jpg"],
      ["Americano", "Coffee", 110, "Available", "Espresso with hot water", "/images/menu/americano-hot-iced.jpg"],
      ["Hot Coffee", "Coffee", 100, "Available", "Classic brewed drip coffee", "/images/menu/hot-coffee.jpg"],
      ["Cappuccino", "Coffee", 130, "Available", "Equal parts espresso, steam, foam", "/images/menu/cappuccino.jpg"],
      ["Latte", "Coffee", 135, "Available", "Espresso with steamed milk", "/images/menu/latte.jpg"],
      ["Cafe Latte (Hot / Iced)", "Coffee", 150, "Available", "Smooth espresso with fresh milk", "/images/menu/cafe-latte-hot-iced.jpg"],
      ["Flat White", "Coffee", 150, "Available", "Velvety smooth espresso blend", "/images/menu/flat-white.jpg"],
      ["Spanish Latte", "Coffee", 165, "Popular", "Sweet and creamy espresso drink", "/images/menu/spanish-latte.jpg"],
      ["Mocha (Hot / Iced)", "Coffee", 165, "Available", "Rich chocolate espresso fuse", "/images/menu/mocha-hot-iced.jpg"],
      ["Caramel Macchiato", "Coffee", 175, "Popular", "Vanilla latte drizzled with caramel", "/images/menu/caramel-macchiato.jpg"],
      ["Vanilla Latte", "Coffee", 160, "Available", "Espresso with vanilla syrup injection", "/images/menu/vanilla-latte.jpg"],
      ["Hazelnut Latte", "Coffee", 165, "Available", "Toasted nut flavor espresso", "/images/menu/hazelnut-latte.jpg"],
      ["White Chocolate Mocha", "Coffee", 185, "Available", "Sweet white chocolate espresso fuse", "/images/menu/white-chocolate-mocha.jpg"],
      ["Kapeng Gatas", "Coffee", 105, "Available", "Local sweet style coffee with milk", "/images/menu/kapeng-gatas.jpg"],
      ["Cold Brew", "Coffee", 150, "Available", "Slow-steeped over 12 hours", "/images/menu/cold-brew-roast.jpg"],
      ["Mocha Frost", "Blended", 175, "Available", "Iced blended mocha treat", "/images/menu/mocha-frost.jpg"],
      ["Caramel Frappe", "Blended", 180, "Available", "Sweet blended caramel refreshment", "/images/menu/caramel-frappe.jpg"],
      ["Vanilla Frappe", "Blended", 175, "Available", "Smooth rich blended vanilla cream", "/images/menu/vanilla-frappe.jpg"],
      ["Hazelnut Frappe", "Blended", 185, "Available", "Blended nutty espresso treat", "/images/menu/hazelnut-frappe.jpg"],
      ["Matcha Blended", "Blended", 185, "Available", "Pure Japanese green tea blend", "/images/menu/matcha-blended.jpg"],
      ["Ube Latte Frappe", "Blended", 190, "Popular", "Sweet purple yam blend dessert", "/images/menu/ube-latte-frappe.jpg"],
      ["Cookies & Cream Frappe", "Blended", 190, "Available", "Classic cookie crumble blend cream", "/images/menu/cookies-cream-frappe.jpg"],
      ["Chocolate Ice Blended", "Blended", 180, "Available", "Rich icy deep cocoa refreshment", "/images/menu/chocolate-ice-blended.jpg"],
      ["Coffee Jelly Frappe", "Blended", 195, "Available", "Blended coffee with chewy jelly cubes", "/images/menu/coffee-jelly-frappe.jpg"],
      ["Mango Graham Shake", "Blended", 170, "Available", "Fruity mango and graham cracker crumbs", "/images/menu/mango-graham-shake.jpg"],
      ["Classic Milk Tea (with pearls)", "Tea", 135, "Popular", "Traditional brown sugar milk tea", "/images/menu/classic-milk-tea.jpg"],
      ["Wintermelon Milk Tea", "Tea", 145, "Available", "Sweet wintermelon infused tea line", "/images/menu/wintermelon-milk-tea.jpg"],
      ["Okinawa Milk Tea", "Tea", 150, "Available", "Rich roasted brown sugar profile tea", "/images/menu/okinawa-milk-tea.jpg"],
      ["Thai Milk Tea", "Tea", 150, "Available", "Creamy aromatic sweet orange tea", "/images/menu/thai-milk-tea.jpg"],
      ["Matcha Latte", "Tea", 145, "Available", "Ceremonial grade matcha with milk", "/images/menu/matcha-latte-hot-iced.jpg"],
      ["Calamansi Iced Tea", "Tea", 95, "Available", "Local citrus infused iced tea", "/images/menu/calamansi-iced-tea.jpg"],
      ["Lemon Iced Tea", "Tea", 95, "Available", "Classic refreshing lemon tea", "/images/menu/lemon-iced-tea.jpg"],
      ["Chamomile", "Tea", 100, "Available", "Soothing herbal blend", "/images/menu/chamomile-tea.jpg"],
      ["Green Tea", "Tea", 105, "Available", "Delicate Japanese sencha", "/images/menu/green-tea.jpg"],
      ["Ensaymada", "Snacks", 95, "Popular", "Sweet filipino pastry with cheese topping", "/images/menu/ensaymada.jpg"],
      ["Cheese Roll", "Snacks", 85, "Available", "Soft bread roll with cheese center", "/images/menu/cheese-roll.jpg"],
      ["Pandesal with Ham & Cheese", "Snacks", 115, "Available", "Toasted sandwich slider breakfast style", "/images/menu/pandesal-ham-cheese.jpg"],
      ["Banana Bread", "Snacks", 80, "Available", "House-baked banana loaf slice", "/images/menu/banana-bread.jpg"],
      ["Blueberry Muffin", "Snacks", 90, "Available", "Moist muffin with blueberry burst", "/images/menu/muffin.jpg"],
      ["Cheese Danish", "Snacks", 95, "Available", "Cream cheese filled buttery pastry", "/images/menu/cheese-roll.jpg"],
      ["Croissant", "Snacks", 85, "Available", "Buttery flaky golden pastry", "/images/menu/croissant.jpg"],
      ["Banana Cue", "Snacks", 65, "Available", "Caramelized skewered brown sugar saba bananas", "/images/menu/banana-cue.jpg"],
      ["Turon", "Snacks", 70, "Popular", "Crispy fried banana rolls glazed in jackfruit sugar", "/images/menu/turon.jpg"]
    ];

    // 3. Run the complete SQL insertion query
    await pool.query(
      "INSERT INTO products (name, category, price, status, description, image) VALUES ?",
      [masterProducts]
    );

    return NextResponse.json({ 
      success: true, 
      message: `Database successfully filled! All ${masterProducts.length} products are live.` 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}