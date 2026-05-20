import { NextResponse } from "next/server";
import { buildEnvelope, nextControlNumber } from "@/lib/tapat/envelope";
import {
  TAPAT_HUB_URL,
  TAPAT_ESTABLISHMENT_ID,
  TAPAT_TERMINAL_ID,
  TAPAT_RECEIVER_ID,
  toTapatLineItem,
} from "@/lib/tapat/config";

/**
 * Eligibility check (EDI 270 → 271).
 * Forwards the cardholder's tap + cart to the TAPAT Hub for verification
 * against the government registry. Returns the discount breakdown if
 * approved, or a rejection reason if not.
 */
export async function POST(req) {
  try {
    const { cardId, items } = await req.json();

    if (!cardId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "cardId and items are required" },
        { status: 400 }
      );
    }

    const tapatItems = items.map(toTapatLineItem);
    const controlNumber = nextControlNumber();

    const edi270 = buildEnvelope({
      senderId: TAPAT_ESTABLISHMENT_ID,
      receiverId: TAPAT_RECEIVER_ID,
      controlNumber,
      transactionType: "270",
      body: {
        card_id: cardId,
        tap_token: `sim-${Date.now()}-${controlNumber}`,
        establishment_id: TAPAT_ESTABLISHMENT_ID,
        pos_terminal_id: TAPAT_TERMINAL_ID,
        items: tapatItems,
      },
      segmentCount: 4,
    });

    const hubResponse = await fetch(
      `${TAPAT_HUB_URL}/api/verification/request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edi270),
      }
    );

    const result = await hubResponse.json();
    return NextResponse.json(result, {
      status: hubResponse.ok ? 200 : hubResponse.status,
    });
  } catch (err) {
    console.error("[POST /api/tapat/verify]", err);
    return NextResponse.json(
      { error: "Could not reach TAPAT Hub" },
      { status: 502 }
    );
  }
}
