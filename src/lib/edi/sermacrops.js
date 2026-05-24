import pool from "@/lib/db";

const SERMACROPS_ENDPOINT =
  (process.env.SERMACROPS_EDI_URL || "").trim() ||
  "https://sermacrops-repo.onrender.com/api/edi/inbound";

const SERMACROPS_TOKEN =
  (process.env.SERMACROPS_TOKEN || process.env.MY_INBOUND_TOKEN || "test").trim();

const HONEYCOFFEE_SENDER_ID =
  (process.env.SERMACROPS_SENDER_ID || "HONEYCOFFEE").trim();

const SERMACROPS_RECEIVER_ID =
  (process.env.SERMACROPS_RECEIVER_ID || "SERMACROPS").trim();

function pad(value, width) {
  return String(value).padStart(width, "0");
}

function formatDateParts(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid receiptDate");
  }

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const hh = pad(date.getHours(), 2);
  const min = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);

  return {
    date6: `${String(yyyy).slice(-2)}${mm}${dd}`,
    date8: `${yyyy}${mm}${dd}`,
    time4: `${hh}${min}`,
    mysqlTimestamp: `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`,
  };
}

function nextInterchangeControlNumber() {
  return String(Date.now()).slice(-9).padStart(9, "0");
}

function sanitizeItemCode(value) {
  return String(value || "MISC-ITEM")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "MISC-ITEM";
}

function inferUnit(value) {
  const unit = String(value || "").trim().toLowerCase();

  if (unit === "kg") return "KG";
  if (unit === "l") return "CA";
  return "EA";
}

function parseItemsString(itemsText, totalQuantity) {
  if (!itemsText || typeof itemsText !== "string") {
    return [];
  }

  const parsed = itemsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => {
      const trailingQtyMatch = item.match(/^(.*?)(?:\s*x\s*(\d+(?:\.\d+)?))$/i);
      const leadingQtyMatch = item.match(/^(\d+(?:\.\d+)?)\s*x\s*(.+)$/i);

      const description =
        trailingQtyMatch?.[1]?.trim() ||
        leadingQtyMatch?.[2]?.trim() ||
        `ITEM-${index + 1}`;
      const qty = Number(trailingQtyMatch?.[2] || leadingQtyMatch?.[1] || 0);

      return {
        description,
        itemCode: sanitizeItemCode(description),
        quantityAccepted: qty > 0 ? qty : 0,
        unit: "EA",
      };
    })
    .filter((item) => item.quantityAccepted > 0);

  if (parsed.length > 0) {
    return parsed;
  }

  const fallbackQty = Number(totalQuantity || 0);
  if (fallbackQty > 0) {
    return [
      {
        description: "ORDER-RECEIPT",
        itemCode: "ORDER-RECEIPT",
        quantityAccepted: fallbackQty,
        unit: "EA",
      },
    ];
  }

  return [];
}

function normalizeItems(items, fallbackItemsText, fallbackTotalQuantity) {
  if (!Array.isArray(items) || items.length === 0) {
    const parsedFallback = parseItemsString(fallbackItemsText, fallbackTotalQuantity);

    if (parsedFallback.length > 0) {
      return parsedFallback;
    }

    return [
      {
        description: "RECEIVED-GOODS",
        itemCode: "RECEIVED-GOODS",
        quantityAccepted: Number(fallbackTotalQuantity || 1) > 0 ? Number(fallbackTotalQuantity || 1) : 1,
        unit: "EA",
      },
    ];
  }

  return items
    .map((item, index) => {
      const quantityAccepted = Number(
        item.quantityAccepted ??
          item.quantityReceived ??
          item.quantity ??
          item.receivedQty ??
          0
      );
      const quantityRejected = Number(item.quantityRejected ?? item.rejectedQty ?? 0);
      const description = String(
        item.description ?? item.name ?? item.item ?? item.sku ?? `ITEM-${index + 1}`
      ).trim();

      return {
        description,
        itemCode: sanitizeItemCode(item.itemCode ?? item.sku ?? description),
        quantityAccepted: quantityAccepted > 0 ? quantityAccepted : 0,
        quantityRejected: quantityRejected > 0 ? quantityRejected : 0,
        unit: inferUnit(item.unit),
      };
    })
    .filter((item) => item.quantityAccepted > 0 || item.quantityRejected > 0);
}

export async function getReceiptSourceByPoNumber(poNumber) {
  if (!poNumber) {
    return null;
  }

  const [rows] = await pool.query(
    "SELECT po_number, items, quantity, status FROM edi_orders WHERE po_number = ? LIMIT 1",
    [poNumber]
  );

  return rows[0] ?? null;
}

export function buildSermacrops861({
  poNumber,
  shipmentReference,
  receiptDate,
  items,
  itemsText,
  totalQuantity,
  logisticsStatusCode,
}) {
  if (!poNumber) {
    throw new Error("poNumber is required to build EDI 861");
  }

  const normalizedItems = normalizeItems(items, itemsText, totalQuantity);
  if (normalizedItems.length === 0) {
    throw new Error("At least one received item is required to send EDI 861");
  }

  const { date6, date8, time4 } = formatDateParts(receiptDate);
  const controlNumber = nextInterchangeControlNumber();
  const receiptNumber = `RCV${time4}${controlNumber.slice(-3)}`;

  const isa = `ISA*00* *00* *ZZ*${HONEYCOFFEE_SENDER_ID.padEnd(15, " ")}*ZZ*${SERMACROPS_RECEIVER_ID.padEnd(15, " ")}*${date6}*${time4}*U*00401*${controlNumber}*0*P*>~\n`;
  const gs = `GS*RC*${HONEYCOFFEE_SENDER_ID}*${SERMACROPS_RECEIVER_ID}*${date8}*${time4}*1*X*004010~\n`;
  const bodySegments = [
    "ST*861*0001",
    `BRA*00*${receiptNumber}*${date8}`,
    `PRF*${poNumber}`,
    `REF*BM*${shipmentReference || poNumber}`,
    `DTM*050*${date8}`,
    "N1*ST*HONEY COFFEE SHOP*92*STORE01",
    "N1*SU*Sermacrops*92*SUP123",
  ];

  if (logisticsStatusCode) {
    bodySegments.push(`REF*ZZ*214-${logisticsStatusCode}`);
  }

  normalizedItems.forEach((item, index) => {
    bodySegments.push(
      `LIN*${index + 1}*VN*${item.itemCode}`,
      `SN1**${item.quantityAccepted || 0}*${item.unit}`
    );

    if (item.quantityRejected > 0) {
      bodySegments.push(`QTY*RJ*${item.quantityRejected}`);
    }
  });

  bodySegments.push(`CTT*${normalizedItems.length}`, `SE*${bodySegments.length + 1}*0001`);

  return {
    receiptNumber,
    payload: `${isa}${gs}${bodySegments.join("~\n")}~\nGE*1*1~\nIEA*1*${controlNumber}~\n`,
    normalizedItems,
  };
}

export async function dispatchSermacrops861(options) {
  const built = buildSermacrops861(options);
  const response = await fetch(SERMACROPS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERMACROPS_TOKEN}`,
      "Content-Type": "application/EDI-X12",
    },
    body: built.payload,
  });

  const responseText = await response.text().catch(() => "");

  return {
    ok: response.ok,
    status: response.status,
    responseText,
    receiptNumber: built.receiptNumber,
    payload: built.payload,
    normalizedItems: built.normalizedItems,
  };
}

export function toMysqlTimestamp(value) {
  return formatDateParts(value).mysqlTimestamp;
}
