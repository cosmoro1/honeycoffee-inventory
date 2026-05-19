import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Wiping and batch-seeding all 45+ master products into the database safely...");

    // 1. Temporarily bypass foreign keys to safely clear old truncated data
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE products;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. Full clean list matched precisely to [name, category, price, description, image]
    const masterProducts = [
      ["Batangas Barako (Liberica)", "Beans", 520, "Bold, strong, distinctly Filipino", "/images/menu/batangas-barako-liberica.jpg"],
      ["Sagada Arabica", "Beans", 500, "Smooth floral notes from Mountain Province", "/images/menu/sagada-arabica.jpg"],
      ["Benguet Arabica", "Beans", 480, "Balanced and nutty from highlands", "/images/menu/benguet-arabica.jpg"],
      ["Kalinga Robusta", "Beans", 390, "Earthy, full-bodied, perfect for strong brews", "/images/menu/kalinga-robusta.jpg"],
      ["Mindanao Excelsa", "Beans", 460, "Rare beans with fruity undertones", "/images/menu/mindanao-excelsa.jpg"],
      ["House Blend", "Beans", 430, "BREW signature mix of Arabica and Robusta", "/images/menu/house-blend.jpg"],
      ["Espresso Roast", "Beans", 450, "Dark and rich for espresso machines", "/images/menu/espresso-roast.jpg"],
      ["Cold Brew Roast", "Beans", 440, "Medium roast optimized for cold brewing", "/images/menu/cold-brew-roast.jpg"],
      ["Barako Brew", "Coffee", 120, "Strong traditional brew", "/images/menu/barako-brew.jpg"],
      ["Espresso", "Coffee", 95, "Strong and bold single shot", "/images/menu/espresso-double-espresso.jpg"],
      ["Americano", "Coffee", 110, "Espresso with hot water", "/images/menu/americano-hot-iced.jpg"],
      ["Hot Coffee", "Coffee", 100, "Classic brewed drip coffee", "/images/menu/hot-coffee.jpg"],
      ["Cappuccino", "Coffee", 130, "Equal parts espresso, steam, foam", "/images/menu/cappuccino.jpg"],
      ["Latte", "Coffee", 135, "Espresso with steamed milk", "/images/menu/latte.jpg"],
      ["Cafe Latte (Hot / Iced)", "Coffee", 150, "Smooth espresso with fresh milk", "/images/menu/cafe-latte-hot-iced.jpg"],
      ["Flat White", "Coffee", 150, "Velvety smooth espresso blend", "/images/menu/flat-white.jpg"],
      ["Spanish Latte", "Coffee", 165, "Sweet and creamy espresso drink", "/images/menu/spanish-latte.jpg"],
      ["Mocha (Hot / Iced)", "Coffee", 165, "Rich chocolate espresso fuse", "/images/menu/mocha-hot-iced.jpg"],
      ["Caramel Macchiato", "Coffee", 175, "Vanilla latte drizzled with caramel", "/images/menu/caramel-macchiato.jpg"],
      ["Vanilla Latte", "Coffee", 160, "Espresso with vanilla syrup injection", "/images/menu/vanilla-latte.jpg"],
      ["Hazelnut Latte", "Coffee", 165, "Toasted nut flavor espresso", "/images/menu/hazelnut-latte.jpg"],
      ["White Chocolate Mocha", "Coffee", 185, "Sweet white chocolate espresso fuse", "/images/menu/white-chocolate-mocha.jpg"],
      ["Kapeng Gatas", "Coffee", 105, "Local sweet style coffee with milk", "/images/menu/kapeng-gatas.jpg"],
      ["Cold Brew", "Coffee", 150, "Slow-steeped over 12 hours", "/images/menu/cold-brew-roast.jpg"],
      ["Mocha Frost", "Blended", 175, "Iced blended mocha treat", "/images/menu/mocha-frost.jpg"],
      ["Caramel Frappe", "Blended", 180, "Sweet blended caramel refreshment", "/images/menu/caramel-frappe.jpg"],
      ["Vanilla Frappe", "Blended", 175, "Smooth rich blended vanilla cream", "/images/menu/vanilla-frappe.jpg"],
      ["Hazelnut Frappe", "Blended", 185, "Blended nutty espresso treat", "/images/menu/hazelnut-frappe.jpg"],
      ["Matcha Blended", "Blended", 185, "Pure Japanese green tea blend", "/images/menu/matcha-blended.jpg"],
      ["Ube Latte Frappe", "Blended", 190, "Sweet purple yam blend dessert", "/images/menu/ube-latte-frappe.jpg"],
      ["Cookies & Cream Frappe", "Blended", 190, "Classic cookie crumble blend cream", "/images/menu/cookies-cream-frappe.jpg"],
      ["Chocolate Ice Blended", "Blended", 180, "Rich icy deep cocoa refreshment", "/images/menu/chocolate-ice-blended.jpg"],
      ["Coffee Jelly Frappe", "Blended", 195, "Blended coffee with chewy jelly cubes", "/images/menu/coffee-jelly-frappe.jpg"],
      ["Mango Graham Shake", "Blended", 170, "Fruity mango and graham cracker crumbs", "/images/menu/mango-graham-shake.jpg"],
      ["Classic Milk Tea (with pearls)", "Tea", 135, "Traditional brown sugar milk tea", "/images/menu/classic-milk-tea.jpg"],
      ["Wintermelon Milk Tea", "Tea", 145, "Sweet wintermelon infused tea line", "/images/menu/wintermelon-milk-tea.jpg"],
      ["Okinawa Milk Tea", "Tea", 150, "Rich roasted brown sugar profile tea", "/images/menu/okinawa-milk-tea.jpg"],
      ["Thai Milk Tea", "Tea", 150, "Creamy aromatic sweet orange tea", "/images/menu/thai-milk-tea.jpg"],
      ["Matcha Latte", "Tea", 145, "Ceremonial grade matcha with milk", "/images/menu/matcha-latte-hot-iced.jpg"],
      ["Calamansi Iced Tea", "Tea", 95, "Local citrus infused iced tea", "/images/menu/calamansi-iced-tea.jpg"],
      ["Lemon Iced Tea", "Tea", 95, "Classic refreshing lemon tea", "/images/menu/lemon-iced-tea.jpg"],
      ["Chamomile", "Tea", 100, "Soothing herbal blend", "/images/menu/chamomile-tea.jpg"],
      ["Green Tea", "Tea", 105, "Delicate Japanese sencha", "/images/menu/green-tea.jpg"],
      ["Ensaymada", "Snacks", 95, "Sweet filipino pastry with cheese topping", "/images/menu/ensaymada.jpg"],
      ["Cheese Roll", "Snacks", 85, "Soft bread roll with cheese center", "/images/menu/cheese-roll.jpg"],
      ["Pandesal with Ham & Cheese", "Snacks", 115, "Toasted sandwich slider breakfast style", "/images/menu/pandesal-ham-cheese.jpg"],
      ["Banana Bread", "Snacks", 80, "House-baked banana loaf slice", "/images/menu/banana-bread.jpg"],
      ["Blueberry Muffin", "Snacks", 90, "Moist muffin with blueberry burst", "/images/menu/muffin.jpg"],
      ["Cheese Danish", "Snacks", 95, "Cream cheese filled buttery pastry", "/images/menu/cheese-roll.jpg"],
      ["Croissant", "Snacks", 85, "Buttery flaky golden pastry", "/images/menu/croissant.jpg"],
      ["Banana Cue", "Snacks", 65, "Caramelized skewered brown sugar saba bananas", "/images/menu/banana-cue.jpg"],
      ["Turon", "Snacks", 70, "Crispy fried banana rolls glazed in jackfruit sugar", "/images/menu/turon.jpg"]
    ];

    // 3. Adjusted execution matching exact existing column fields
    await pool.query(
      "INSERT INTO products (name, category, price, description, image) VALUES ?",
      [masterProducts]
    );

    return NextResponse.json({ 
      success: true, 
      message: `Database cleanly initialized! All ${masterProducts.length} items are active in your storefront.` 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}