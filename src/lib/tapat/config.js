/**
 * Honeycoffee × TAPAT configuration.
 * Override via env vars when registering this branch with the TAPAT Hub.
 */

export const TAPAT_HUB_URL =
  (process.env.TAPAT_HUB_URL || "").trim() || "http://localhost:3002";

export const TAPAT_ESTABLISHMENT_ID =
  (process.env.TAPAT_ESTABLISHMENT_ID || "").trim() || "TP-EST-COFFEE-001";

export const TAPAT_TERMINAL_ID =
  (process.env.TAPAT_TERMINAL_ID || "").trim() || "TERM-COFFEE-001";

export const TAPAT_RECEIVER_ID =
  (process.env.TAPAT_RECEIVER_ID || "").trim() || "TP-001";

/**
 * Map a Honeycoffee cart item to the line-item shape TAPAT expects.
 * Coffee shop items are all GENERAL category (no Basic-Necessity / Prime-Commodity
 * goods on a café menu), which gives PWD/SC the 20% statutory discount.
 */
export function toTapatLineItem(cartItem) {
  const unitPrice =
    typeof cartItem.price === "string"
      ? parseFloat(cartItem.price.replace(/[^0-9.]/g, "")) || 0
      : Number(cartItem.price) || 0;

  return {
    sku: String(cartItem.id ?? cartItem.sku ?? cartItem.name),
    name: cartItem.name,
    unit_price: unitPrice,
    qty: cartItem.quantity ?? cartItem.qty ?? 1,
    category: "GENERAL",
  };
}
