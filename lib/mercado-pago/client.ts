import "server-only";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";

function getAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }

  return token;
}

export class MercadoPagoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "MercadoPagoApiError";
  }
}

export async function mercadoPagoRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    idempotencyKey?: string;
  } = {}
): Promise<T> {
  const headers = new Headers({
    Authorization: `Bearer ${getAccessToken()}`,
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.idempotencyKey) {
    headers.set("X-Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(`${MERCADO_PAGO_API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new MercadoPagoApiError(
      `Mercado Pago respondeu HTTP ${response.status}.`,
      response.status,
      body
    );
  }

  return body as T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requireString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Resposta inválida do Mercado Pago: ${fieldName}.`);
  }

  return value;
}
