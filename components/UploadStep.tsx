"use client";

import { useRef, useState } from "react";
import { Card, Button, Space, Typography, Spin, Alert } from "antd";
import {
  UploadOutlined,
  ScanOutlined,
  EditOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { BillState } from "@/lib/types";
import { MOCK_OCR_TEXT, parseReceiptText } from "@/lib/mockParser";

const { Title, Text, Paragraph } = Typography;

interface Props {
  bill: BillState;
  updateBill: (patch: Partial<BillState>) => void;
  goStep: (step: number) => void;
}

export default function UploadStep({ bill, updateBill, goStep }: Props) {
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    updateBill({ imageFile: file, imagePreviewUrl: url });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  // Simulate OCR scan with mock data (replace with Tesseract.js later)
  const handleScan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 1800)); // simulate delay
    const raw = MOCK_OCR_TEXT;
    const items = parseReceiptText(raw);
    updateBill({ ocrRawText: raw, items });
    setScanning(false);
    goStep(1);
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
              justifyContent: "center",
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
            <br />
            <Button
              size="small"
              onClick={() => {
                updateBill({ imageFile: null, imagePreviewUrl: null });
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

      {/* Demo notice */}
      <Alert
        title="Mode Demo"
        description="Saat ini OCR menggunakan data mock untuk demo UI. Integrasi Tesseract.js akan ditambahkan di tahap berikutnya."
        type="info"
        showIcon
        style={{ borderRadius: 12 }}
      />

      {/* Actions */}
      <Space style={{ width: "100%" }} orientation="vertical" size={10}>
        {scanning ? (
          <Card style={{ textAlign: "center", padding: "20px 0" }}>
            <Spin size="large" />
            <br />
            <Text type="secondary" style={{ marginTop: 12, display: "block" }}>
              Sedang membaca struk...
            </Text>
          </Card>
        ) : (
          <>
            <Button
              type="primary"
              size="large"
              block
              icon={<ScanOutlined />}
              onClick={handleScan}
              disabled={!bill.imagePreviewUrl}
              style={{ height: 48, fontSize: 15, borderRadius: 12 }}
            >
              🔍 Scan dengan OCR
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
          </>
        )}
      </Space>

      {/* Tips */}
      <Card
        size="small"
        style={{ background: "#fffbe6", border: "1px solid #ffe58f" }}
      >
        <Text style={{ fontSize: 12, color: "#875800" }}>
          <strong>💡 Tips foto struk yang bagus:</strong>
          <br />• Pastikan pencahayaan cukup terang
          <br />• Foto lurus dari atas, jangan miring
          <br />• Semua teks harus terbaca jelas
        </Text>
      </Card>
    </Space>
  );
}
