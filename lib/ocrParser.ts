import Tesseract from "tesseract.js";

export interface OcrProgress {
  status: string;
  progress: number;
}

async function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const val = avg < 140 ? 0 : 255;
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

// Hanya extract raw text — parsing diserahkan ke AI agent
export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  onProgress?.({ status: "Memproses gambar...", progress: 0 });
  const processedImage = await preprocessImage(imageFile);

  onProgress?.({ status: "Memuat OCR engine...", progress: 0 });

  const result = await Tesseract.recognize(processedImage, "ind+eng", {
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

  return result.data.text;
}
