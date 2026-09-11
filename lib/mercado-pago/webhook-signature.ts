import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type SignatureParts = {
  ts: string;
  v1: string;
};

function parseSignature(value: string): SignatureParts | null {
  let ts = "";
  let v1 = "";

  for (const part of value.split(",")) {
    const [rawKey, ...rawValue] = part.split("=");
    const key = rawKey?.trim().toLowerCase();
    const item = rawValue.join("=").trim();

    if (key === "ts") ts = item;
    if (key === "v1") v1 = item;
  }

  return ts && v1 ? { ts, v1 } : null;
}

function safeEqualHex(expected: string, received: string) {
  if (
    !/^[0-9a-f]+$/i.test(expected) ||
    !/^[0-9a-f]+$/i.test(received) ||
    expected.length !== received.length
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex")
  );
}

export function validateMercadoPagoWebhookSignature({
  signature,
  requestId,
  dataId,
}: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret || !signature || !requestId || !dataId) {
    return false;
  }

  const parts = parseSignature(signature);

  if (!parts) {
    return false;
  }


  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return safeEqualHex(expected, parts.v1);
}


