import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  buildSermacrops861,
  dispatchSermacrops861,
  getReceiptSourceByPoNumber,
} from "@/lib/edi/sermacrops";

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

    let functionalGroup = null;
    let transactionSetId = null;
    let poNumber = null;
    let logType = "System";
    let logMessage = "Received inbound EDI document.";
    let orderStatus = null;
    let shipmentReference = null;
    let shipmentStatusCode = null;

    // Item-tracking state arrays for multi-segment loops
    let parsedItems = [];
    let currentItemSku = null;

    const lines = rawEdiContent.split(/[~\n]+/);
    for (let line of lines) {
      line = line.trim();

      if (line.startsWith("GS*")) {
        const segments = line.split("*");
        functionalGroup = segments[1];
      } else if (line.startsWith("ST*")) {
        const segments = line.split("*");
        transactionSetId = segments[1];
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
      else if (line.startsWith("B10*")) {
        const segments = line.split("*");
        if (!poNumber && segments[1]) {
          poNumber = segments[1];
        }
        shipmentReference = segments[2] || segments[1] || shipmentReference;
      }
      else if (line.startsWith("L11*")) {
        const segments = line.split("*");
        const qualifier = segments[2];
        if (!shipmentReference && segments[1]) {
          shipmentReference = segments[1];
        }
        if (!poNumber && ["PO", "ON", "OID", "SI"].includes(qualifier) && segments[1]) {
          poNumber = segments[1];
        }
      }
      else if (line.startsWith("REF*")) {
        const segments = line.split("*");
        const qualifier = segments[1];
        if (!poNumber && ["PO", "ON", "BM"].includes(qualifier) && segments[2]) {
          poNumber = segments[2];
        }
        if (!shipmentReference && segments[2]) {
          shipmentReference = segments[2];
        }
      }
      else if (line.startsWith("AT7*")) {
        const segments = line.split("*");
        shipmentStatusCode = segments[1] || segments[2] || shipmentStatusCode;
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

    const ediType = transactionSetId || functionalGroup || "Unknown";

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
    else if (ediType === "214" || ediType === "QM") {
      logType = "Delivery";

      const receiptSource = poNumber
        ? await getReceiptSourceByPoNumber(poNumber).catch(() => null)
        : null;

      if (!poNumber && shipmentReference) {
        poNumber = shipmentReference;
      }

      const shouldDispatch861 = Boolean(poNumber);

      logMessage = `Logistics EDI 214 received for Order ${poNumber || "N/A"}${shipmentReference ? ` (Shipment ${shipmentReference})` : ""}.${shipmentStatusCode ? ` Status: ${shipmentStatusCode}.` : ""}`;

      if (poNumber) {
        try {
          await pool.query("UPDATE edi_orders SET status = 'Delivered', updated_at = ? WHERE po_number = ?", [mysqlTimestamp, poNumber]);
        } catch (dbErr) {
          console.warn(`[Inbound Webhook Warning] Could not sync delivered status for ${poNumber}:`, dbErr.message);
        }
      }

      if (shouldDispatch861) {
        const outbound861Args = {
          poNumber,
          shipmentReference,
          receiptDate: now,
          itemsText: receiptSource?.items || itemsString,
          totalQuantity: receiptSource?.quantity || 1,
          logisticsStatusCode: shipmentStatusCode,
        };

        try {
          const dispatchResult = await dispatchSermacrops861(outbound861Args);

          await pool.query(
            "INSERT INTO activity_logs (type, reference, message, status, created_at, edi_doc_type, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              "Delivery",
              poNumber,
              `Outbound EDI 861 ${dispatchResult.receiptNumber} sent to Sermacrops after logistics 214 for Order ${poNumber}.`,
              "OK",
              mysqlTimestamp,
              "861",
              dispatchResult.payload,
            ]
          );

          logMessage += dispatchResult.ok
            ? ` Receipt advice ${dispatchResult.receiptNumber} sent to Sermacrops.`
            : ` Receipt advice send failed with supplier status ${dispatchResult.status}.`;
        } catch (dispatchErr) {
          console.warn(`[Inbound Webhook Warning] Could not dispatch 861 for ${poNumber}:`, dispatchErr.message);

          try {
            const failedReceipt = buildSermacrops861(outbound861Args);

            await pool.query(
              "INSERT INTO activity_logs (type, reference, message, status, created_at, edi_doc_type, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [
                "Delivery",
                poNumber,
                `Outbound EDI 861 ${failedReceipt.receiptNumber} attempted for Sermacrops after logistics 214 for Order ${poNumber}, but the dispatch returned an error.`,
                "OK",
                mysqlTimestamp,
                "861",
                failedReceipt.payload,
              ]
            );
          } catch (logErr) {
            console.warn(`[Inbound Webhook Warning] Could not log failed 861 attempt for ${poNumber}:`, logErr.message);
          }

          logMessage += " Receipt advice dispatch was attempted and logged, but the outbound 861 request returned an error.";
        }
      } else {
        logMessage += " Receipt advice was skipped because no purchase-order reference could be resolved from the 214 payload.";
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
