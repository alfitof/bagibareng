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
  Switch,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  EditOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { BillItem, BillState } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AdditionalFee {
  id: string;
  label: string;
  percent: number;
  enabled: boolean;
}

const DEFAULT_FEES: AdditionalFee[] = [
  { id: "tax", label: "PPN / Tax", percent: 11, enabled: false },
  { id: "service", label: "Service Charge", percent: 5, enabled: false },
  { id: "pb1", label: "PB1", percent: 10, enabled: false },
];

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

  // Additional fees state
  const [fees, setFees] = useState<AdditionalFee[]>(DEFAULT_FEES);
  const [customFeeLabel, setCustomFeeLabel] = useState("");
  const [customFeePercent, setCustomFeePercent] = useState<number | null>(null);

  const fmtRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

  const subtotal = bill.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // Hitung total fee
  const activeFees = fees.filter((f) => f.enabled);
  const totalFeePercent = activeFees.reduce((sum, f) => sum + f.percent, 0);
  const totalFeeAmount = Math.round((subtotal * totalFeePercent) / 100);
  const grandTotal = subtotal + totalFeeAmount;

  // Fee amount per fee item
  const getFeeAmount = (percent: number) =>
    Math.round((subtotal * percent) / 100);

  const toggleFee = (id: string) => {
    setFees((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    );
  };

  const updateFeePercent = (id: string, percent: number) => {
    setFees((prev) => prev.map((f) => (f.id === id ? { ...f, percent } : f)));
  };

  const updateFeeLabel = (id: string, label: string) => {
    setFees((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)));
  };

  const deleteFee = (id: string) => {
    setFees((prev) => prev.filter((f) => f.id !== id));
  };

  const addCustomFee = () => {
    if (!customFeeLabel.trim() || !customFeePercent) return;
    setFees((prev) => [
      ...prev,
      {
        id: uuidv4(),
        label: customFeeLabel.trim(),
        percent: customFeePercent,
        enabled: true,
      },
    ]);
    setCustomFeeLabel("");
    setCustomFeePercent(null);
  };

  // Simpan fee info ke bill saat lanjut
  const handleNext = () => {
    // Simpan fee yang aktif ke additionalFees di bill
    // Kita inject fee sebagai item khusus dengan flag
    const feeItems: BillItem[] = activeFees.map((f) => ({
      id: `fee_${f.id}`,
      name: `${f.label} (${f.percent}%)`,
      price: getFeeAmount(f.percent),
      qty: 1,
      isFee: true,
    }));

    // Hapus fee lama jika ada, ganti dengan yang baru
    const nonFeeItems = bill.items.filter((i) => !(i as any).isFee);
    updateBill({ items: [...nonFeeItems, ...feeItems] });
    goStep(2);
  };

  const addItem = () => {
    if (!newName.trim() || !newPrice) return;
    updateBill({
      items: [
        ...bill.items.filter((i) => !(i as any).isFee),
        { id: uuidv4(), name: newName.trim(), price: newPrice, qty: newQty },
        ...bill.items.filter((i) => (i as any).isFee),
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

  // Non-fee items saja yang ditampilkan di tabel
  const displayItems = bill.items.filter((i) => !(i as any).isFee);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      {bill.ocrRawText && (
        <Card
          size="small"
          title={
            <Space>
              <EditOutlined />
              <span>Teks Hasil OCR</span>
              <Tag color="blue">{displayItems.length} item terdeteksi</Tag>
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

      <Card
        title={
          <Space>
            <span>🛒 Daftar Item</span>
            <Badge
              count={displayItems.length}
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
        {displayItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada item."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "10px 12px",
                  background: "#fafafa",
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      updateItem(item.id, { name: e.target.value })
                    }
                    variant="borderless"
                    style={{
                      flex: 1,
                      fontWeight: 600,
                      fontSize: 13,
                      padding: "0 4px",
                    }}
                  />
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

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, flexShrink: 0 }}
                    >
                      Qty
                    </Text>
                    <InputNumber
                      value={item.qty}
                      min={1}
                      max={99}
                      onChange={(v) => updateItem(item.id, { qty: v ?? 1 })}
                      style={{ width: 70 }}
                      size="small"
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, flexShrink: 0 }}
                    >
                      Harga
                    </Text>
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
                      style={{ flex: 1 }}
                      size="small"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayItems.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              marginTop: 10,
              background: "#fafafa",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
            }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              Subtotal
            </Text>
            <Text strong style={{ fontSize: 15 }}>
              {fmtRp(subtotal)}
            </Text>
          </div>
        )}

        <Divider style={{ margin: "14px 0 12px" }} />

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

      <Card
        title={
          <Space>
            <PercentageOutlined style={{ color: "#f5a623" }} />
            <span>Biaya Tambahan</span>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Dihitung dari subtotal
          </Text>
        }
      >
        <Space orientation="vertical" size={10} style={{ width: "100%" }}>
          {fees.map((fee) => (
            <div
              key={fee.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: fee.enabled ? "#fff7e6" : "#fafafa",
                border: `1px solid ${fee.enabled ? "#ffd591" : "#f0f0f0"}`,
                transition: "all 0.2s",
                flexWrap: "wrap",
              }}
            >
              <Switch
                size="small"
                checked={fee.enabled}
                onChange={() => toggleFee(fee.id)}
                style={{ flexShrink: 0 }}
              />

              <Input
                value={fee.label}
                onChange={(e) => updateFeeLabel(fee.id, e.target.value)}
                variant="borderless"
                style={{
                  flex: 1,
                  minWidth: 80,
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "0 4px",
                  color: fee.enabled ? "#1a1a2e" : "#bbb",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <InputNumber
                  value={fee.percent}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={(v) => updateFeePercent(fee.id, v ?? 0)}
                  style={{ width: 70 }}
                  size="small"
                  disabled={!fee.enabled}
                />
                <Text style={{ color: "#888", fontSize: 13 }}>%</Text>
              </div>

              {fee.enabled && subtotal > 0 && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#f5a623",
                    fontWeight: 600,
                    flexShrink: 0,
                    minWidth: 80,
                    textAlign: "right",
                  }}
                >
                  +{fmtRp(getFeeAmount(fee.percent))}
                </Text>
              )}

              {!["tax", "service", "pb1"].includes(fee.id) && (
                <Tooltip title="Hapus">
                  <Button
                    danger
                    ghost
                    size="small"
                    shape="circle"
                    icon={<DeleteOutlined />}
                    onClick={() => deleteFee(fee.id)}
                  />
                </Tooltip>
              )}
            </div>
          ))}

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px dashed #d9d9d9",
              background: "#fafafa",
            }}
          >
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginBottom: 8 }}
            >
              + Tambah biaya lainnya
            </Text>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Input
                placeholder="Nama biaya (mis: Rounding)"
                value={customFeeLabel}
                onChange={(e) => setCustomFeeLabel(e.target.value)}
                onPressEnter={addCustomFee}
                style={{ flex: 1, minWidth: 120, borderRadius: 8 }}
                size="small"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <InputNumber
                  placeholder="0"
                  value={customFeePercent}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={(v) => setCustomFeePercent(v)}
                  style={{ width: 70, borderRadius: 8 }}
                  size="small"
                />
                <Text style={{ color: "#888", fontSize: 13 }}>%</Text>
              </div>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={addCustomFee}
                disabled={!customFeeLabel.trim() || !customFeePercent}
                style={{ borderRadius: 8 }}
              >
                Tambah
              </Button>
            </div>
          </div>
        </Space>

        {displayItems.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <Divider style={{ margin: "0 0 12px" }} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Subtotal
                </Text>
                <Text style={{ fontSize: 13 }}>{fmtRp(subtotal)}</Text>
              </div>
              {activeFees.map((f) => (
                <div
                  key={f.id}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {f.label} ({f.percent}%)
                  </Text>
                  <Text style={{ fontSize: 13, color: "#f5a623" }}>
                    +{fmtRp(getFeeAmount(f.percent))}
                  </Text>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff7e6",
                  border: "1px solid #ffd591",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginTop: 4,
                }}
              >
                <Text strong style={{ fontSize: 14 }}>
                  💰 Grand Total
                </Text>
                <Text strong style={{ fontSize: 18, color: "#f5a623" }}>
                  {fmtRp(grandTotal)}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Card>

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
          disabled={displayItems.length === 0}
          onClick={handleNext}
          style={{ borderRadius: 10, flex: 1 }}
        >
          Lanjut ke Orang <ArrowRightOutlined />
        </Button>
      </div>
    </Space>
  );
}
