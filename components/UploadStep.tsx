"use client";

import { useRef, useState } from "react";
import { Card, Button, Space, Typography, Alert, Progress } from "antd";
import { ScanOutlined, EditOutlined, InboxOutlined } from "@ant-design/icons";
import { BillState } from "@/lib/types";
import { extractTextFromImage, OcrProgress } from "@/lib/ocrParser";
import { sendTextToN8N } from "@/lib/n8nOcr";

const { Title, Text } = Typography;

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? "";

interface Props {
  bill: BillState;
  updateBill: (patch: Partial<BillState>) => void;
  goStep: (step: number) => void;
}

type ScanPhase = "idle" | "ocr" | "ai" | "done" | "error";

export default function UploadStep({ bill, updateBill, goStep }: Props) {
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progressText, setProgressText] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isOcrDone = phase === "ai" || phase === "done";
  const isAiDone = phase === "done";

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    updateBill({ imageFile: file, imagePreviewUrl: url });
    setOcrError(null);
    setPhase("idle");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleScan = async () => {
    if (!bill.imageFile) return;
    setOcrError(null);
    setProgressPct(0);

    try {
      setPhase("ocr");

      const rawText = await extractTextFromImage(
        bill.imageFile,
        (p: OcrProgress) => {
          setProgressText(p.status);
          setProgressPct(p.progress);
        },
      );

      updateBill({ ocrRawText: rawText });

      // ── STEP 2: Kirim raw text ke N8N AI Agent ───────────────────────────
      setPhase("ai");
      setProgressPct(0);
      setProgressText("Mengirim ke AI Agent...");

      const result = await sendTextToN8N(rawText, WEBHOOK_URL);

      if (!result.success) {
        throw new Error(result.error ?? "AI gagal memproses struk.");
      }

      // ── STEP 3: Done ─────────────────────────────────────────────────────
      setPhase("done");
      setProgressPct(100);
      updateBill({ items: result.items });

      setTimeout(() => goStep(1), 400);
    } catch (err) {
      setPhase("error");
      setOcrError(
        err instanceof Error
          ? err.message
          : "Gagal memproses struk. Coba lagi.",
      );
    }
  };

  const handleManual = () => {
    updateBill({ ocrRawText: "", items: [] });
    goStep(1);
  };

  const isScanning = phase === "ocr" || phase === "ai";

  const phaseLabel: Record<ScanPhase, string> = {
    idle: "",
    ocr: progressText || "Membaca teks...",
    ai: progressText || "AI memproses struk...",
    done: "Selesai!",
    error: "",
  };

  const phaseIcon: Record<ScanPhase, string> = {
    idle: "",
    ocr: "🔍",
    ai: "🤖",
    done: "✅",
    error: "❌",
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          📷 Upload Foto Struk
        </Title>

        {/* Upload Zone */}
        {!bill.imagePreviewUrl ? (
          <div
            className={`upload-zone ${dragging ? "dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <InboxOutlined
              style={{
                fontSize: 48,
                color: "#f5a623",
                display: "block",
                marginBottom: 12,
              }}
            />
            <Text strong style={{ fontSize: 15 }}>
              Drag & drop atau klik untuk upload
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              JPG, PNG, WebP — maks 10MB
            </Text>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bill.imagePreviewUrl}
              alt="Preview struk"
              style={{
                maxWidth: "100%",
                maxHeight: 320,
                objectFit: "contain",
                borderRadius: 12,
                border: "1px solid #e8e8e8",
                marginBottom: 12,
              }}
            />
            <Button
              size="small"
              onClick={() => {
                updateBill({ imageFile: null, imagePreviewUrl: null });
                setOcrError(null);
                setPhase("idle");
                if (fileRef.current) fileRef.current.value = "";
              }}
              disabled={isScanning}
            >
              Ganti Foto
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}
      </Card>

      {/* Progress Card */}
      {isScanning && (
        <Card>
          {/* Phase steps indicator */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {/* Step 1 - OCR */}
            {/* Step 1 - OCR */}
            <div
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                background:
                  phase === "ocr"
                    ? "#fff7e6"
                    : isOcrDone
                      ? "#f6ffed"
                      : "#fafafa",
                border: `1px solid ${phase === "ocr" ? "#f5a623" : isOcrDone ? "#b7eb8f" : "#f0f0f0"}`,
                textAlign: "center",
                transition: "all 0.3s",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>
                {isOcrDone ? "✅" : "🔍"}
              </div>
              <Text
                style={{
                  fontSize: 11,
                  color: "#595959",
                  fontWeight: phase === "ocr" ? 700 : 400,
                }}
              >
                OCR
              </Text>
            </div>

            {/* Arrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#d9d9d9",
                fontSize: 16,
              }}
            >
              →
            </div>

            {/* Step 2 - AI */}
            <div
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                background:
                  phase === "ai" ? "#fff7e6" : isAiDone ? "#f6ffed" : "#fafafa",
                border: `1px solid ${phase === "ai" ? "#f5a623" : isAiDone ? "#b7eb8f" : "#f0f0f0"}`,
                textAlign: "center",
                transition: "all 0.3s",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>
                {isAiDone ? "✅" : "🤖"}
              </div>
              <Text
                style={{
                  fontSize: 11,
                  color: "#595959",
                  fontWeight: phase === "ai" ? 700 : 400,
                }}
              >
                AI Agent
              </Text>
            </div>
          </div>

          {/* Status text */}
          <Text
            strong
            style={{ display: "block", marginBottom: 8, fontSize: 13 }}
          >
            {phaseIcon[phase]} {phaseLabel[phase]}
          </Text>

          {/* Progress bar — hanya tampil saat OCR */}
          {phase === "ocr" && (
            <Progress
              percent={progressPct}
              strokeColor="#f5a623"
              railColor="#f0f0f0"
              showInfo={progressPct > 0}
            />
          )}

          {/* AI loading indicator */}
          {phase === "ai" && (
            <Progress
              percent={100}
              strokeColor="#f5a623"
              status="active"
              showInfo={false}
            />
          )}

          <Text
            type="secondary"
            style={{ fontSize: 11, marginTop: 8, display: "block" }}
          >
            Harap tunggu, jangan tutup halaman ini...
          </Text>
        </Card>
      )}

      {/* Error */}
      {ocrError && (
        <Alert
          title="Scan Gagal"
          description={ocrError}
          type="error"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}

      {/* Actions */}
      {!isScanning && (
        <Space orientation="vertical" size={10} style={{ width: "100%" }}>
          <Button
            type="primary"
            size="large"
            block
            icon={<ScanOutlined />}
            onClick={handleScan}
            disabled={!bill.imagePreviewUrl}
            style={{ height: 48, fontSize: 15, borderRadius: 12 }}
          >
            🔍 Scan Struk
          </Button>
          <Button
            size="large"
            block
            icon={<EditOutlined />}
            onClick={handleManual}
            style={{ height: 48, fontSize: 15, borderRadius: 12 }}
          >
            ⌨️ Input Manual
          </Button>
        </Space>
      )}

      {/* Tips */}
      <Card
        size="small"
        style={{ background: "#fffbe6", border: "1px solid #ffe58f" }}
      >
        <Text style={{ fontSize: 12, color: "#875800" }}>
          <strong>💡 Tips agar hasil scan akurat:</strong>
          <br />• Foto dari atas, tegak lurus — jangan miring
          <br />• Pastikan semua teks terbaca, tidak blur
          <br />• Cahaya cukup, hindari bayangan di atas struk
          <br />• Setelah scan, cek & edit hasilnya di langkah berikutnya
        </Text>
      </Card>
    </Space>
  );
}
