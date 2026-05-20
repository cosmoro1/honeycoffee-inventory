import { NextResponse } from "next/server";
import { buildEnvelope, nextControlNumber } from "@/lib/tapat/envelope";
import {
  TAPAT_HUB_URL,
  TAPAT_ESTABLISHMENT_ID,
  TAPAT_TERMINAL_ID,
  TAPAT_RECEIVER_ID,
} from "@/lib/tapat/config";

/**
 * Transaction finalization (EDI 826 — Tax Information Exchange).
 * Once payment is taken, post the discounted transaction back to the Hub
 * so it can be relayed to the Government Portal for compliance reporting.
 *
 * We fire-and-forget the 826 toward the Hub; the customer-facing receipt
 * does not need to block on Govt acknowledgement.
 */
export async function POST(req) {
  try {
    const { result, pickupNumber } = await req.json();

    if (!result?.approved || !result.card_id || !result.discount) {
      return NextResponse.json(
        { error: "Invalid TAPAT verification result" },
        { status: 400 }
      );
    }

    const d = result.discount;
    const now = new Date();
    const dateTag = now.toISOString().slice(0, 10).replace(/-/g, "");
    const controlNumber = nextControlNumber();
    const receiptNumber = `OR-${dateTag}-${controlNumber.slice(-5)}`;

    const edi826 = buildEnvelope({
      senderId: TAPAT_ESTABLISHMENT_ID,
      receiverId: TAPAT_RECEIVER_ID,
      controlNumber,
      transactionType: "826",
      body: {
        transaction_id: `TXN-${dateTag}-${controlNumber.slice(-5)}`,
        beneficiary_id_masked: `CARD-XXXX-${result.card_id.slice(-4)}`,
        beneficiary_type: result.beneficiary_type,
        establishment_id: TAPAT_ESTABLISHMENT_ID,
        transaction_date: now.toISOString(),
        line_items: d.line_items_discounted ?? [],
        gross_amount: d.gross_amount,
        vat_removed: d.vat_removed,
        discount_rate: result.discount_pct,
        discount_amount: d.discount_amount,
        net_total: d.net_total,
        discount_type: d.discount_type,
        bnpc_weekly_used: d.bnpc_allowed ?? 0,
        bnpc_weekly_remaining: result.weekly_remaining_after ?? 0,
        receipt_number: receiptNumber,
        pickup_number: pickupNumber ?? null,
      },
      segmentCount: 8,
    });

    fetch(`${TAPAT_HUB_URL}/api/edi/receive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-EDI-Sender-ID": TAPAT_ESTABLISHMENT_ID,
      },
      body: JSON.stringify(edi826),
    }).catch((err) =>
      console.warn("[tapat/transaction] 826 dispatch failed:", err.message)
    );

    return NextResponse.json({
      receipt_number: receiptNumber,
      transaction_id: edi826.body.transaction_id,
      card_id: result.card_id,
      beneficiary_type: result.beneficiary_type,
      gross_amount: d.gross_amount,
      vat_removed: d.vat_removed,
      discount_amount: d.discount_amount,
      net_total: d.net_total,
      transacted_at: now.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/tapat/transaction]", err);
    return NextResponse.json(
      { error: "Failed to record TAPAT transaction" },
      { status: 500 }
    );
  }
}
