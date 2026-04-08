import { BillItem } from "./types";

export interface N8NOcrResult {
  success: boolean;
  rawText: string;
  items: BillItem[];
  error?: string;
}

export async function sendTextToN8N(
  rawText: string,
  webhookUrl: string,
): Promise<N8NOcrResult> {
  let response: Response;

  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_N8N_API_KEY ?? "",
      },
      body: JSON.stringify({ rawText }),
    });
  } catch (err) {
    throw new Error(
      "Tidak dapat terhubung ke server. Periksa koneksi internet.",
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Server error ${response.status}: ${responseText.slice(0, 200)}`,
    );
  }

  if (!responseText || responseText.trim() === "") {
    throw new Error(
      "Server mengembalikan response kosong. Periksa konfigurasi N8N webhook.",
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        data = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error(
          `Response bukan JSON valid. Preview: ${responseText.slice(0, 200)}`,
        );
      }
    } else {
      throw new Error(
        `Response bukan JSON valid. Preview: ${responseText.slice(0, 200)}`,
      );
    }
  }

  const result = data as N8NOcrResult;

  if (typeof result !== "object" || result === null) {
    throw new Error("Format response tidak valid.");
  }

  if (Array.isArray(data)) {
    const first = (data as N8NOcrResult[])[0];
    if (!first) throw new Error("Response array kosong dari N8N.");
    return sanitizeResult(first, rawText);
  }

  return sanitizeResult(result, rawText);
}

function sanitizeResult(data: N8NOcrResult, rawText: string): N8NOcrResult {
  const raw = data as any;

  let items = data.items;
  if (!Array.isArray(items)) {
    if (Array.isArray(raw.output?.items)) items = raw.output.items;
    else if (Array.isArray(raw.data?.items)) items = raw.data.items;
    else if (typeof raw.output === "string") {
      try {
        const parsed = JSON.parse(raw.output);
        items = parsed.items ?? [];
      } catch {
        items = [];
      }
    } else {
      items = [];
    }
  }

  const sanitized: N8NOcrResult["items"] = items
    .filter((item: unknown) => item && typeof item === "object")
    .map((item: any, idx: number) => ({
      id: String(item.id ?? idx + 1),
      name: String(item.name ?? "").trim(),
      price: parseInt(String(item.price ?? "0").replace(/[^\d]/g, ""), 10),
      qty: parseInt(String(item.qty ?? "1"), 10) || 1,
    }))
    .filter(
      (item: N8NOcrResult["items"][0]) =>
        item.name.length > 0 && item.price >= 500 && item.price <= 9_999_999,
    );

  return {
    success: true,
    rawText: data.rawText ?? rawText,
    items: sanitized,
  };
}
