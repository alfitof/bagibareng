"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Input,
  InputNumber,
  Space,
  Typography,
  Tag,
  Popconfirm,
  Tooltip,
  Empty,
  Divider,
  Badge,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { BillItem, BillState } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  bill: BillState;
  updateBill: (patch: Partial<BillState>) => void;
  goStep: (step: number) => void;
}

export default function EditItemsStep({ bill, updateBill, goStep }: Props) {
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [newQty, setNewQty] = useState<number>(1);
  const [showRaw, setShowRaw] = useState(false);

  const fmtRp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

  const totalBill = bill.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const addItem = () => {
    if (!newName.trim() || !newPrice) return;
    updateBill({
      items: [
        ...bill.items,
        { id: uuidv4(), name: newName.trim(), price: newPrice, qty: newQty },
      ],
    });
    setNewName("");
    setNewPrice(null);
    setNewQty(1);
  };

  const updateItem = (id: string, patch: Partial<BillItem>) =>
    updateBill({
      items: bill.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  const deleteItem = (id: string) => {
    const assignments = { ...bill.assignments };
    delete assignments[id];
    updateBill({ items: bill.items.filter((i) => i.id !== id), assignments });
  };

  const reparse = () => {};

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      {/* Raw OCR */}
      {bill.ocrRawText && (
        <Card
          size="small"
          title={
            <Space>
              <EditOutlined />
              <span>Teks Hasil OCR</span>
              <Tag color="blue">{bill.items.length} item terdeteksi</Tag>
            </Space>
          }
          extra={
            <Button
              size="small"
              type="link"
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? "Sembunyikan" : "Lihat teks"}
            </Button>
          }
        >
          {showRaw && (
            <>
              <TextArea
                value={bill.ocrRawText}
                onChange={(e) => updateBill({ ocrRawText: e.target.value })}
                rows={6}
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  marginBottom: 8,
                }}
              />
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={reparse}
                disabled
                title="Parse ulang tidak tersedia — edit item manual di bawah"
              >
                Parse Ulang (via AI)
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Items List */}
      <Card
        title={
          <Space>
            <span>🛒 Daftar Item</span>
            <Badge
              count={bill.items.length}
              style={{ backgroundColor: "#f5a623" }}
            />
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Edit jika OCR kurang akurat
          </Text>
        }
      >
        {bill.items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada item."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Header Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 64px 140px auto",
                gap: 8,
                padding: "0 8px",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                NAMA ITEM
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 11, textAlign: "center" }}
              >
                QTY
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 11, textAlign: "right" }}
              >
                HARGA SATUAN
              </Text>
              <span />
            </div>

            {/* Item Rows */}
            {bill.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 64px 140px auto",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px",
                  background: "#fafafa",
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                }}
              >
                {/* Name — full width, wraps freely */}
                <Input
                  value={item.name}
                  onChange={(e) =>
                    updateItem(item.id, { name: e.target.value })
                  }
                  variant="borderless"
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "0 4px",
                    width: "100%",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                />
                {/* Qty */}
                <InputNumber
                  value={item.qty}
                  min={1}
                  max={99}
                  onChange={(v) => updateItem(item.id, { qty: v ?? 1 })}
                  style={{ width: "100%" }}
                  size="small"
                />
                {/* Price */}
                <InputNumber
                  value={item.price}
                  min={0}
                  step={500}
                  formatter={(v) =>
                    v
                      ? `Rp ${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
                      : ""
                  }
                  parser={(v) => Number(v!.replace(/[Rp\s.]/g, "")) as 0}
                  onChange={(v) => updateItem(item.id, { price: v ?? 0 })}
                  style={{ width: "100%" }}
                  size="small"
                />
                {/* Delete */}
                <Popconfirm
                  title="Hapus item ini?"
                  onConfirm={() => deleteItem(item.id)}
                  okText="Hapus"
                  cancelText="Batal"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Hapus">
                    <Button
                      danger
                      ghost
                      size="small"
                      shape="circle"
                      icon={<DeleteOutlined />}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            ))}

            {/* Subtotal per item hint */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Subtotal masing-masing dihitung otomatis saat assign
              </Text>
            </div>
          </div>
        )}

        {/* Total */}
        {bill.items.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: 10,
              padding: "12px 16px",
              marginTop: 12,
            }}
          >
            <Text strong style={{ fontSize: 14 }}>
              💰 Total Struk
            </Text>
            <Text strong style={{ fontSize: 18, color: "#f5a623" }}>
              {fmtRp(totalBill)}
            </Text>
          </div>
        )}

        <Divider style={{ margin: "16px 0 12px" }} />

        {/* Add Item Manual — improved spacing */}
        <div>
          <Text
            strong
            style={{ display: "block", marginBottom: 12, fontSize: 13 }}
          >
            ➕ Tambah Item Manual
          </Text>
          <Space orientation="vertical" size={8} style={{ width: "100%" }}>
            <Input
              placeholder="Nama item..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={addItem}
              size="large"
              style={{ borderRadius: 10 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <InputNumber
                placeholder="Qty"
                value={newQty}
                min={1}
                onChange={(v) => setNewQty(v ?? 1)}
                style={{ width: 90, borderRadius: 10 }}
                size="large"
              />
              <InputNumber
                placeholder="Harga satuan"
                value={newPrice}
                min={0}
                step={500}
                formatter={(v) =>
                  v
                    ? `Rp ${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
                    : ""
                }
                parser={(v) => Number(v!.replace(/[Rp\s.]/g, "")) as 0}
                onChange={(v) => setNewPrice(v)}
                style={{ flex: 1, borderRadius: 10 }}
                size="large"
                onPressEnter={addItem}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addItem}
                disabled={!newName.trim() || !newPrice}
                size="large"
                style={{ borderRadius: 10, minWidth: 48 }}
              />
            </div>
          </Space>
        </div>
      </Card>

      {/* Navigation */}
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => goStep(0)}
          style={{ borderRadius: 10, flex: 1 }}
        >
          Kembali
        </Button>
        <Button
          type="primary"
          size="large"
          disabled={bill.items.length === 0}
          onClick={() => goStep(2)}
          style={{ borderRadius: 10, flex: 1 }}
        >
          Lanjut ke Orang <ArrowRightOutlined />
        </Button>
      </div>
    </Space>
  );
}
