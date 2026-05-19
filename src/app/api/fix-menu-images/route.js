import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    console.log("Aligning all database product image paths with public folder...");

    // 1. Fetch your current products from the database
    const [products] = await pool.query("SELECT id, name FROM products");

    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, error: "No products found in the database table." }, { status: 400 });
    }

    // 2. Master dictionary matching your actual database product names to your exact file strings
    const imageMap = {
      "hot coffee": "/images/menu/hot-coffee.jpg",
      "americano": "/images/menu/americano-hot-iced.jpg",
      "cappuccino": "/images/menu/cappuccino.jpg",
      "cold brew": "/images/menu/cold-brew-roast.jpg",
      "espresso": "/images/menu/espresso-double-espresso.jpg",
      "latte": "/images/menu/latte.jpg",
      "matcha latte": "/images/menu/matcha-latte-hot-iced.jpg",
      "green tea": "/images/menu/green-tea.jpg",
      "chamomile": "/images/menu/chamomile-tea.jpg",
      "oolong tea": "/images/menu/tea.jpg", // Fallback to tea template
      "banana bread": "/images/menu/banana-bread.jpg",
      "blueberry muffin": "/images/menu/muffin.jpg",
      "cheese danish": "/images/menu/cheese-roll.jpg", // Maps to your cheese roll asset
      "croissant": "/images/menu/croissant.jpg",
      
      // Fallback arrays for the rest of your background catalog
      "barako brew": "/images/menu/barako-brew.jpg",
      "cafe latte (hot / iced)": "/images/menu/cafe-latte-hot-iced.jpg",
      "mocha (hot / iced)": "/images/menu/mocha-hot-iced.jpg",
      "caramel macchiato": "/images/menu/caramel-macchiato.jpg",
      "vanilla latte": "/images/menu/vanilla-latte.jpg",
      "hazelnut latte": "/images/menu/hazelnut-latte.jpg",
      "white chocolate mocha": "/images/menu/white-chocolate-mocha.jpg",
      "kapeng gatas": "/images/menu/kapeng-gatas.jpg",
      "mocha frost": "/images/menu/mocha-frost.jpg",
      "caramel frappe": "/images/menu/caramel-frappe.jpg",
      "vanilla frappe": "/images/menu/vanilla-frappe.jpg",
      "hazelnut frappe": "/images/menu/hazelnut-frappe.jpg",
      "matcha blended": "/images/menu/matcha-blended.jpg",
      "ube latte frappe": "/images/menu/ube-latte-frappe.jpg",
      "cookies & cream frappe": "/images/menu/cookies-cream-frappe.jpg",
      "chocolate ice blended": "/images/menu/chocolate-ice-blended.jpg",
      "coffee jelly frappe": "/images/menu/coffee-jelly-frappe.jpg",
      "mango graham shake": "/images/menu/mango-graham-shake.jpg",
      "classic milk tea (with pearls)": "/images/menu/classic-milk-tea.jpg",
      "wintermelon milk tea": "/images/menu/wintermelon-milk-tea.jpg",
      "okinawa milk tea": "/images/menu/okinawa-milk-tea.jpg",
      "thai milk tea": "/images/menu/thai-milk-tea.jpg",
      "calamansi iced tea": "/images/menu/calamansi-iced-tea.jpg",
      "lemon iced tea": "/images/menu/lemon-iced-tea.jpg",
      "earl grey hot tea": "/images/menu/earl-grey-hot-tea.jpg",
      "english breakfast tea": "/images/menu/english-breakfast-tea.jpg",
      "ensaymada": "/images/menu/ensaymada.jpg",
      "cheese roll": "/images/menu/cheese-roll.jpg",
      "pandesal with ham & cheese": "/images/menu/pandesal-ham-cheese.jpg",
      "banana cue": "/images/menu/banana-cue.jpg",
      "turon": "/images/menu/turon.jpg",
      "bibingka (mini)": "/images/menu/bibingka-mini.jpg",
      "puto bumbong (seasonal)": "/images/menu/puto-bumbong-seasonal.jpg",
      "churros with chocolate dip": "/images/menu/churros-chocolate-dip.jpg",
      "egg sandwich": "/images/menu/egg-sandwich.jpg",
      "tuna melt sandwich": "/images/menu/tuna-melt-sandwich.jpg",
      "clubhouse sandwich": "/images/menu/clubhouse-sandwich.jpg",
      "pasta (carbonara / spaghetti)": "/images/menu/pasta-carbonara-spaghetti.jpg",
      "pancakes with syrup": "/images/menu/pancakes-syrup.jpg",
      "waffles with butter & jam": "/images/menu/waffles-butter-jam.jpg",
      "batangas barako (liberica)": "/images/menu/batangas-barako-liberica.jpg",
      "sagada arabica": "/images/menu/sagada-arabica.jpg",
      "benguet-arabica": "/images/menu/benguet-arabica.jpg",
      "kalinga robusta": "/images/menu/kalinga-robust.jpg",
      "mindanao excelsa": "/images/menu/mindanao-excelsa.jpg",
      "house blend": "/images/menu/house-blend.jpg",
      "espresso roast": "/images/menu/espresso-roast.jpg",
      "cold brew roast": "/images/menu/cold-brew-roast.jpg"
    };

    let updateCount = 0;

    // 3. Loop through database entries and apply changes
    for (const product of products) {
      const normalizedName = product.name.toLowerCase().trim();
      const matchingImagePath = imageMap[normalizedName];

      if (matchingImagePath) {
        await pool.query("UPDATE products SET image = ? WHERE id = ?", [matchingImagePath, product.id]);
        updateCount++;
      } else {
        // Fallback catch-all for close string approximations
        if (normalizedName.includes("muffin")) {
          await pool.query("UPDATE products SET image = '/images/menu/muffin.jpg' WHERE id = ?", [product.id]);
          updateCount++;
        } else if (normalizedName.includes("tea")) {
          await pool.query("UPDATE products SET image = '/images/menu/tea.jpg' WHERE id = ?", [product.id]);
          updateCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${updateCount} product image asset references!` 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}