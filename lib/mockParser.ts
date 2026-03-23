import { BillItem } from "./types";

// Simulate OCR raw text
export const MOCK_OCR_TEXT = `
WARUNG MAKAN SEDERHANA
Jl. Sudirman No. 12, Jakarta
================================
AYAM GORENG KREMES   1x  28000
NASI PUTIH           2x  10000
ES TEH MANIS         2x   5000
MILO DINOSAUR        1x  18000
AYAM BAKAR           1x  35000
KANGKUNG TUMIS       1x  15000
--------------------------------
SUBTOTAL                111000
SERVICE CHARGE  5%        5550
PPN 11%                  12210
--------------------------------
TOTAL                   128760
CASH                    150000
KEMBALIAN                21240
================================
Terima kasih!
`.trim();

// Simple parser: detect item lines, skip total/tax/etc
export function parseReceiptText(text: string): BillItem[] {
  const SKIP_KEYWORDS =
    /total|subtotal|pajak|tax|ppn|service|diskon|discount|cash|change|kembalian|tunai|bayar|terima|receipt|struk|warung|resto|jl\.|kota|telp|================================|--------------------------------/i;

  const lines = text.split("\n");
  const items: BillItem[] = [];
  let idSeq = 1;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length < 4) continue;
    if (SKIP_KEYWORDS.test(line)) continue;

    // Try to find price: last number in line (could be 28000 / 28.000 / 28,000)
    const priceMatches = [...line.matchAll(/(\d[\d.,]{1,8})/g)];
    if (!priceMatches.length) continue;

    const lastMatch = priceMatches[priceMatches.length - 1];
    let priceStr = lastMatch[1].replace(/\./g, "").replace(",", ".");
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 500) continue;

    // Try to detect qty pattern: "1x", "2x", "x2" etc
    let qty = 1;
    const qtyMatch = line.match(/(\d+)\s*[xX×]/);
    if (qtyMatch) qty = parseInt(qtyMatch[1]);

    // Name = text before price, clean up
    let name = line
      .slice(0, lastMatch.index)
      .replace(/\d+\s*[xX×]/g, "")
      .replace(/[:\-|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!name || name.length < 2) continue;

    items.push({ id: String(idSeq++), name, price, qty });
  }

  return items;
}
