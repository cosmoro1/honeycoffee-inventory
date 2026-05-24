/**
 * Minimal ANSI X12-style envelope builder for the TAPAT Hub.
 * Mirrors @tapat/edi-core's shape so the Hub accepts our payloads verbatim.
 */

const FUNCTIONAL_GROUPS = {
  "270": "HB",
  "271": "HB",
  "826": "TX",
  "813": "TX",
  "997": "FA",
  "850": "PO",
  "856": "SH",
  "810": "IN",
  "861": "RC",
};

let _counter = 0;
let _lastIssuedAt = 0;

export function nextControlNumber() {
  const now = Date.now();
  if (now === _lastIssuedAt) {
    _counter += 1;
  } else {
    _lastIssuedAt = now;
    _counter = 0;
  }
  return `${now}${String(_counter).padStart(3, "0")}`;
}

export function buildEnvelope({
  senderId,
  receiverId,
  controlNumber,
  transactionType,
  body,
  segmentCount,
}) {
  const setControlNumber = `ST-${String(controlNumber).padStart(9, "0")}`;
  const groupControlNumber = `GS-${String(controlNumber).padStart(6, "0")}`;
  const functionalGroup = FUNCTIONAL_GROUPS[transactionType] ?? "XX";

  return {
    isa: {
      sender_id: senderId,
      receiver_id: receiverId,
      control_number: controlNumber,
      timestamp: new Date().toISOString(),
      version: "TAPAT-1.0",
    },
    gs: {
      functional_group: functionalGroup,
      transaction_set: transactionType,
      group_control_number: groupControlNumber,
    },
    st: {
      transaction_set_id: transactionType,
      set_control_number: setControlNumber,
    },
    body,
    se: {
      segment_count: segmentCount,
      set_control_number: setControlNumber,
    },
  };
}
