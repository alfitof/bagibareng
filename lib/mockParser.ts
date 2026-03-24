// lib/mockParser.ts
export { parseReceiptText } from "./ocrParser";

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
