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
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_N8N_API_KEY ?? "",
    },
    body: JSON.stringify({ rawText }),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as N8NOcrResult;
}
