import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const expectedToken = process.env.MY_INBOUND_TOKEN || "test";

    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const rawEdiContent = await request.text();

    if (!rawEdiContent || rawEdiContent.trim() === "") {
      return NextResponse.json({ error: "Missing EDI content" }, { status: 400 });
    }

    let ediType = "Unknown";
    let poNumber = null;
    let logType = "System";
    let logMessage = "Received inbound EDI document.";
    let orderStatus = null;

    // Item-tracking state arrays for multi-segment loops
    let parsedItems = [];
    let currentItemSku = null;

    const lines = rawEdiContent.split(/[~\n]+/);
    for (let line of lines) {
      line = line.trim();

      if (line.startsWith("GS*")) {
        const segments = line.split("*");
        ediType = segments[1];
      } else if (line.startsWith("BEG*")) {
        const segments = line.split("*");
        poNumber = segments[3];
      } else if (line.startsWith("BAK*")) {
        const segments = line.split("*");
        poNumber = segments[3];
        const ackType = segments[2];
        orderStatus = ackType === "RE" ? "Rejected" : "Accepted";
      }
      
      // Catch Order Context for 856 Shipping Notices
      else if (line.startsWith("PRF*")) {
        const segments = line.split("*");
        poNumber = segments[1]; 
      }
      
      // Catch Order Context for 810 Invoices (BIG*Date*InvoiceNum*PODate*PONumber)
      else if (line.startsWith("BIG*")) {
        const segments = line.split("*");
        if (segments[4]) poNumber = segments[4];
      }
      
      // Extract Item Part Numbers/SKUs (LIN segment loops)
      else if (line.startsWith("LIN*")) {
        const segments = line.split("*");
        const bpIndex = segments.indexOf("BP");
        if (bpIndex !== -1 && segments[bpIndex + 1]) {
          currentItemSku = segments[bpIndex + 1];
        }
      }
      
      // Extract Item Quantities and pair them with the current active SKU
      else if (line.startsWith("SN1*") || line.startsWith("IT1*")) {
        const segments = line.split("*");
        const quantity = segments[2];
        
        // If it's an IT1 invoice loop, the SKU can sometimes live right inside the same segment array
        if (line.startsWith("IT1*")) {
          const bpIndex = segments.indexOf("BP");
          if (bpIndex !== -1 && segments[bpIndex + 1]) {
            currentItemSku = segments[bpIndex + 1];
          }
        }

        if (quantity && currentItemSku) {
          parsedItems.push(`${quantity}x ${currentItemSku}`);
          currentItemSku = null; // reset layout frame for next dynamic loop iteration
        }
      }
    }

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const manilaOffset = 8 * 60 * 60 * 1000; 
    const manilaDate = new Date(utcTime + manilaOffset);

    const year = manilaDate.getFullYear();
    const month = String(manilaDate.getMonth() + 1).padStart(2, "0");
    const day = String(manilaDate.getDate()).padStart(2, "0");
    const hours = String(manilaDate.getHours()).padStart(2, "0");
    const minutes = String(manilaDate.getMinutes()).padStart(2, "0");
    const seconds = String(manilaDate.getSeconds()).padStart(2, "0");
    
    const mysqlTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const itemsString = parsedItems.length > 0 ? parsedItems.join(", ") : null;

    if (ediType === "PO" || ediType === "855") {
      logType = "Order";
      if (orderStatus === "Rejected") {
        logMessage = `Purchase order ${poNumber || "N/A"} was REJECTED by Sermacrops.`;
      } else {
        logMessage = `Purchase order ${poNumber || "N/A"} confirmed by Sermacrops.`;
      }
      
      // SAFE WRAPPER: Suppress missing foreign relationship database flags
      if (poNumber && orderStatus) {
        try {
          await pool.query("UPDATE edi_orders SET status = ?, updated_at = ? WHERE po_number = ?", [orderStatus, mysqlTimestamp, poNumber]);
        } catch (dbErr) {
          console.warn(`[Inbound Webhook Warning] Could not sync table status for ${poNumber}:`, dbErr.message);
        }
      }
    } 
    else if (ediType === "SH" || ediType === "856") {
      logType = "Delivery";
      logMessage = `Sermacrops sent Shipping Notice for Order ${poNumber || "N/A"}.${itemsString ? ` Shipped: [ ${itemsString} ].` : ""} Items are now in transit.`;
      
      if (poNumber) {
        try {
          await pool.query("UPDATE edi_orders SET status = 'Shipped', updated_at = ? WHERE po_number = ?", [mysqlTimestamp, poNumber]);
        } catch (dbErr) {
          console.warn(`[Inbound Webhook Warning] Could not sync delivery flag status for ${poNumber}:`, dbErr.message);
        }
      }
    } 
    else if (ediType === "IN" || ediType === "810") {
      logType = "Invoice";
      logMessage = `New Supplier Invoice received for Order ${poNumber || "N/A"}.${itemsString ? ` Items billed: [ ${itemsString} ].` : ""} Pending payment review.`;
      
      if (poNumber) {
        try {
          await pool.query("UPDATE edi_orders SET status = 'Invoiced', updated_at = ? WHERE po_number = ?", [mysqlTimestamp, poNumber]);
        } catch (dbErr) {
          console.warn(`[Inbound Webhook Warning] Could not sync invoice processing status for ${poNumber}:`, dbErr.message);
        }
      }
    }

    // Always logs the payload record into activity_logs cleanly
    await pool.query(
      "INSERT INTO activity_logs (type, reference, message, status, created_at, edi_doc_type, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [logType, poNumber, logMessage, "OK", mysqlTimestamp, ediType, rawEdiContent]
    );

    return NextResponse.json({ success: true, message: `Inbound EDI ${ediType} document processed successfully.` });
  } catch (err) {
    console.error("[POST /api/edi/inbound]", err);
    return NextResponse.json({ error: "Failed to process inbound EDI" }, { status: 500 });
  }
}