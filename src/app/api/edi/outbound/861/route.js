import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  dispatchSermacrops861,
  getReceiptSourceByPoNumber,
  toMysqlTimestamp,
} from "@/lib/edi/sermacrops";

export async function POST(request) {
  try {
    const body = await request.json();
    const poNumber = String(body.poNumber || body.reference || "").trim();

    if (!poNumber) {
      return NextResponse.json({ error: "poNumber is required" }, { status: 400 });
    }

    const receiptSource = await getReceiptSourceByPoNumber(poNumber);
    const dispatchResult = await dispatchSermacrops861({
      poNumber,
      shipmentReference: body.shipmentReference || body.logisticsReference || null,
      receiptDate: body.receiptDate || new Date(),
      items: body.items,
      itemsText: body.itemsText ?? receiptSource?.items,
      totalQuantity: body.totalQuantity ?? receiptSource?.quantity,
      logisticsStatusCode: body.logisticsStatusCode || null,
    });

    const timestamp = toMysqlTimestamp(body.receiptDate || new Date());
    const itemSummary = dispatchResult.normalizedItems
      .map((item) => `${item.quantityAccepted}x ${item.itemCode}`)
      .join(", ");

    await pool.query(
      "INSERT INTO activity_logs (type, reference, message, status, created_at, edi_doc_type, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        "Delivery",
        poNumber,
        `Outbound EDI 861 ${dispatchResult.receiptNumber} sent to Sermacrops for Order ${poNumber}.${itemSummary ? ` Received: [ ${itemSummary} ].` : ""}`,
        dispatchResult.ok ? "OK" : "Error",
        timestamp,
        "861",
        dispatchResult.payload,
      ]
    );

    if (dispatchResult.ok) {
      await pool.query(
        "UPDATE edi_orders SET status = 'Delivered', updated_at = ? WHERE po_number = ?",
        [timestamp, poNumber]
      );
    }

    return NextResponse.json(
      {
        success: dispatchResult.ok,
        receiptNumber: dispatchResult.receiptNumber,
        poNumber,
        supplierStatus: dispatchResult.status,
        supplierResponse: dispatchResult.responseText,
      },
      { status: dispatchResult.ok ? 200 : 502 }
    );
  } catch (err) {
    console.error("[POST /api/edi/outbound/861]", err);
    return NextResponse.json({ error: err.message || "Failed to send EDI 861" }, { status: 500 });
  }
}
