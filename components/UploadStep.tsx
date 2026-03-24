"use client";

import { useRef, useState } from "react";
import { Card, Button, Space, Typography, Alert, Progress } from "antd";
import { ScanOutlined, EditOutlined, InboxOutlined } from "@ant-design/icons";
import { BillState } from "@/lib/types";
import { runOcr, OcrProgress } from "@/lib/ocrParser";
import { parseReceiptText } from "@/lib/mockParser"; // fallback manual

const { Title, Text } = Typography;

interface Props {
  bill: BillState;
  updateBill: (patch: Partial<BillState>) => void;
  goStep: (step: number) => void;
}

export default function UploadStep({ bill, updateBill, goStep }: Props) {
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({
    status: "",
    progress: 0,
  });
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    updateBill({ imageFile: file, imagePreviewUrl: url });
    setOcrError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleScan = async () => {
    if (!bill.imageFile) return;
    setScanning(true);
    setOcrError(null);
    setOcrProgress({ status: "Memulai OCR...", progress: 0 });

    try {
      const { rawText, items } = await runOcr(bill.imageFile, (p) => {
        setOcrProgress(p);
      });
      updateBill({ ocrRawText: rawText, items });
      goStep(1);
    } catch (err) {
      setOcrError(
        err instanceof Error
          ? err.message
          : "Gagal membaca struk. Coba foto ulang.",
      );
    } finally {
      setScanning(false);
    }
  };

  const handleManual = () => {
    updateBill({ ocrRawText: "", items: [] });
    goStep(1);
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          📷 Upload Foto Struk
        </Title>

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
                if (fileRef.current) fileRef.current.value = "";
              }}
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

      {/* OCR Progress */}
      {scanning && (
        <Card>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            🔍 {ocrProgress.status}
          </Text>
          <Progress
            percent={ocrProgress.progress}
            strokeColor="#f5a623"
            railColor="#f0f0f0"
            showInfo={ocrProgress.progress > 0}
          />
          <Text
            type="secondary"
            style={{ fontSize: 12, marginTop: 6, display: "block" }}
          >
            Harap tunggu, jangan tutup halaman ini...
          </Text>
        </Card>
      )}

      {/* Error */}
      {ocrError && (
        <Alert
          title="OCR Gagal"
          description={ocrError}
          type="error"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}

      {/* Actions */}
      {!scanning && (
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
            🔍 Scan Struk dengan OCR
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
          <strong>💡 Tips agar OCR akurat:</strong>
          <br />• Foto dari atas, tegak lurus — jangan miring
          <br />• Pastikan semua teks terbaca, tidak blur
          <br />• Cahaya cukup, hindari bayangan di atas struk
          <br />• Setelah scan, cek & edit hasilnya di langkah berikutnya
        </Text>
      </Card>
    </Space>
  );
}
