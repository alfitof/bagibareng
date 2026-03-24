import Tesseract from "tesseract.js";
import { BillItem } from "./types";

// ── Skip patterns ─────────────────────────────────────────────────────────────
const SKIP_PATTERNS = [
  /total|subtotal|sub\s*total/i,
  /pajak|tax|ppn|vat/i,
  /service|servis|charge/i,
  /diskon|discount|promo/i,
  /cash|tunai|bayar|payment/i,
  /kembalian|change|kembali/i,
  /terima\s*kasih|thank\s*you|please\s*come/i,
  /struk|receipt|invoice|nota/i,
  /kasir|cashier|operator|winda|pos\d/i,
  /tanggal|date|check\s*no|no\.\s*\d/i,
  /telp|phone|alamat|address|jl\.|jalan|ruko|boulevard/i,
  /member|point|poin/i,
  /grand/i,
  /rounding|pembulatan/i,
  /tip|gratuity/i,
  /debit|kredit|credit|bca|bni|bri|mandiri|visa|master/i,
  /closed|open/i,
  /www\.|\.com|\.id|http/i,
  /pembelian|gratis|jika\s*tidak/i,
  /^\s*[-=*#~_.]+\s*$/, // separator
  /^\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s*$/, // date only
  /^\s*\d{2}:\d{2}(:\d{2})?\s*$/, // time only
  /\d{2}:\d{2}:\d{2}/, // baris yang ada timestamp
  /\b\d{6,}\b(?!\s*$)/, // nomor panjang di tengah (no. kasir dll)
];

function isSkippedLine(line: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(line));
}

// ── Ekstrak harga ─────────────────────────────────────────────────────────────
// Format yang valid di struk Indonesia:
//   11,500 / 11.500 / 11500 / Rp 11.500
// Harga valid: 500 s/d 9.999.999
// TIDAK valid: nomor kasir (1506551), timestamp (16:33:20)
function extractPrice(line: string): { price: number; index: number } | null {
  // Normalisasi: ganti koma ribuan → tidak ada pemisah, titik ribuan → tidak ada pemisah
  // Pattern: angka dengan separator ribuan (titik atau koma) ATAU angka polos
  // Prioritas: cari dari kanan (harga biasanya di akhir baris)

  // Match: 11,500 / 11.500 / 11,500,000 / 11.500.000
  const withSeparator = /(\d{1,3}(?:[.,]\d{3})+)/g;
  // Match: angka polos 4-7 digit
  const plain = /\b(\d{4,7})\b/g;

  const candidates: { price: number; index: number }[] = [];

  // Cari dengan separator dulu (lebih akurat)
  let m;
  withSeparator.lastIndex = 0;
  while ((m = withSeparator.exec(line)) !== null) {
    // Normalisasi: hapus semua titik dan koma lalu parse
    const normalized = m[1].replace(/[.,]/g, "");
    const price = parseInt(normalized, 10);
    if (price >= 500 && price <= 9_999_999) {
      candidates.push({ price, index: m.index });
    }
  }

  // Kalau tidak ada yang match dengan separator, coba plain number
  if (candidates.length === 0) {
    plain.lastIndex = 0;
    while ((m = plain.exec(line)) !== null) {
      const price = parseInt(m[1], 10);
      if (price >= 500 && price <= 999_999) {
        candidates.push({ price, index: m.index });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Ambil yang paling kanan (harga di akhir baris)
  return candidates[candidates.length - 1];
}

// ── Ekstrak qty ───────────────────────────────────────────────────────────────
function extractQty(text: string): number {
  // "2x", "2 x", "x2", "2X", "@2"
  const m1 = text.match(/^(\d+)\s*[xX×@]\s*/);
  if (m1) return Math.min(parseInt(m1[1], 10), 99);
  const m2 = text.match(/\s+(\d+)\s*[xX×]\s*$/);
  if (m2) return Math.min(parseInt(m2[1], 10), 99);
  // Qty di paling depan baris tanpa simbol: "1 Bread Butter Pudding 11,500"
  const m3 = text.match(/^(\d{1,2})\s+[A-Za-z]/);
  if (m3) return Math.min(parseInt(m3[1], 10), 99);
  return 1;
}

// ── Bersihkan nama ────────────────────────────────────────────────────────────
function cleanName(raw: string): string {
  return raw
    .replace(/^\d{1,2}\s+/, "") // hapus qty di depan: "1 Bread..."
    .replace(/\d+\s*[xX×@]\s*/g, "") // hapus "2x"
    .replace(/\s*[xX×@]\s*\d+/g, "") // hapus "x2"
    .replace(/[|\\]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-:.]+|[\s\-:.]+$/g, "")
    .trim();
}

// ── Klasifikasi baris ─────────────────────────────────────────────────────────
function classifyLine(line: string, priceIndex: number | null): boolean {
  if (isSkippedLine(line)) return false;
  if (priceIndex === null) return false;

  // Nama kandidat = bagian sebelum harga
  const beforePrice = line.slice(0, priceIndex ?? line.length);
  const nameOnly = beforePrice.replace(/[\d.,xX×@\s]/g, "").trim();

  // Harus ada minimal 2 huruf untuk jadi nama item
  if (nameOnly.length < 2) return false;

  return true;
}

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseReceiptText(text: string): BillItem[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const items: BillItem[] = [];
  let idSeq = 1;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Debug — hapus setelah fix
    console.log("LINE:", JSON.stringify(line));

    if (!line || line.length < 3) {
      i++;
      continue;
    }
    if (isSkippedLine(line)) {
      console.log("  skip? true");
      i++;
      continue;
    }

    let priceResult = extractPrice(line);
    let combinedLine = line;

    // ── Jika baris ini punya nama tapi TIDAK punya harga,
    //    coba gabung dengan baris berikutnya ──────────────────────────────────
    if (!priceResult && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextPrice = extractPrice(nextLine);

      // Baris berikutnya punya harga dan BUKAN skip → kemungkinan harga dari baris ini
      if (nextPrice && !isSkippedLine(nextLine)) {
        // Gabungkan: nama dari baris ini + harga dari baris berikutnya
        combinedLine = line + " " + nextLine;
        priceResult = extractPrice(combinedLine);
        i++; // skip baris berikutnya karena sudah digabung
        console.log("  merged with next:", JSON.stringify(combinedLine));
      }
    }

    console.log("  skip? false");
    console.log("  price:", priceResult);

    const valid = classifyLine(combinedLine, priceResult?.index ?? null);
    console.log("  valid?", valid);

    if (!valid || !priceResult) {
      i++;
      continue;
    }

    const beforePrice = combinedLine.slice(0, priceResult.index).trim();
    const name = cleanName(beforePrice || combinedLine);
    console.log("  name:", name);

    if (!name || name.length < 2) {
      i++;
      continue;
    }

    const qty = extractQty(beforePrice || combinedLine);
    items.push({ id: String(idSeq++), name, price: priceResult.price, qty });

    i++;
  }

  return items;
}

// ── Preprocess gambar untuk meningkatkan akurasi OCR ─────────────────────────
async function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");

      // Scale up 2x untuk ketajaman
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d")!;

      // Scale up
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Ambil pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Increase contrast — threshold binarization
        // Struk thermal: tulisan gelap di background terang
        const threshold = 140;
        const val = avg < threshold ? 0 : 255;

        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };

    img.src = url;
  });
}

// ── OCR ───────────────────────────────────────────────────────────────────────
export interface OcrProgress {
  status: string;
  progress: number;
}

export async function runOcr(
  imageSource: File | string,
  onProgress?: (p: OcrProgress) => void,
): Promise<{ rawText: string; items: BillItem[] }> {
  let source: File | string = imageSource;

  // Preprocess jika input adalah File
  if (imageSource instanceof File) {
    onProgress?.({ status: "Memproses gambar...", progress: 0 });
    source = await preprocessImage(imageSource);
  }

  const result = await Tesseract.recognize(source, "ind+eng", {
    logger: (m) => {
      if (!onProgress) return;
      if (m.status === "recognizing text") {
        onProgress({
          status: "Membaca teks struk...",
          progress: Math.round((m.progress ?? 0) * 100),
        });
      } else {
        const statusMap: Record<string, string> = {
          "loading tesseract core": "Memuat OCR engine...",
          "initializing tesseract": "Inisialisasi OCR...",
          "loading language traineddata": "Memuat model bahasa...",
          "initializing api": "Menyiapkan OCR...",
        };
        onProgress({
          status: statusMap[m.status] ?? m.status,
          progress: 0,
        });
      }
    },
  });

  const rawText = result.data.text;
  const items = parseReceiptText(rawText);
  return { rawText, items };
}
