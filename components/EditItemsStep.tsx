"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Input,
  InputNumber,
  Space,
  Typography,
  Table,
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
import { parseReceiptText } from "@/lib/mockParser";
import { v4 as uuidv4 } from "uuid";

const { Title, Text, Paragraph } = Typography;
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
    const item: BillItem = {
      id: uuidv4(),
      name: newName.trim(),
      price: newPrice,
      qty: newQty,
    };
    updateBill({ items: [...bill.items, item] });
    setNewName("");
    setNewPrice(null);
    setNewQty(1);
  };

  const updateItem = (id: string, patch: Partial<BillItem>) => {
    updateBill({
      items: bill.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  };

  const deleteItem = (id: string) => {
    updateBill({
      items: bill.items.filter((i) => i.id !== id),
      assignments: Object.fromEntries(
        Object.entries(bill.assignments).filter(([k]) => k !== id),
      ),
    });
  };

  const reparse = () => {
    const items = parseReceiptText(bill.ocrRawText);
    updateBill({ items });
  };

  const columns = [
    {
      title: "Nama Item",
      dataIndex: "name",
      key: "name",
      ellipsis: false,
      render: (val: string, record: BillItem) => (
        <Input
          value={val}
          onChange={(e) => updateItem(record.id, { name: e.target.value })}
          variant="borderless"
          style={{
            fontWeight: 600,
            fontSize: 14,
            padding: "4px 0",
            whiteSpace: "normal",
          }}
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 80,
      render: (val: number, record: BillItem) => (
        <InputNumber
          value={val}
          min={1}
          max={99}
          onChange={(v) => updateItem(record.id, { qty: v ?? 1 })}
          style={{ width: 60 }}
          size="small"
        />
      ),
    },
    {
      title: "Harga Satuan",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (val: number, record: BillItem) => (
        <InputNumber
          value={val}
          min={0}
          step={500}
          formatter={(v) => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          parser={(v) => Number(v!.replace(/[Rp\s.]/g, "")) as 0}
          onChange={(v) => updateItem(record.id, { price: v ?? 0 })}
          style={{ width: 130 }}
          size="small"
        />
      ),
    },
    {
      title: "Subtotal",
      key: "subtotal",
      width: 120,
      render: (_: unknown, record: BillItem) => (
        <Text strong style={{ color: "#f5a623" }}>
          {fmtRp(record.price * record.qty)}
        </Text>
      ),
    },
    {
      title: "",
      key: "action",
      width: 48,
      render: (_: unknown, record: BillItem) => (
        <Popconfirm
          title="Hapus item ini?"
          onConfirm={() => deleteItem(record.id)}
          okText="Hapus"
          cancelText="Batal"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Hapus item">
            <Button
              danger
              ghost
              size="small"
              shape="circle"
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      {/* OCR Raw Text (collapsible) */}
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
              <Button size="small" icon={<ReloadOutlined />} onClick={reparse}>
                Parse Ulang
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Items Table */}
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
            Edit nama & harga jika kurang akurat
          </Text>
        }
      >
        {bill.items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada item. Tambahkan di bawah."
          />
        ) : (
          <Table
            dataSource={bill.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 480 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>Total Struk</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong style={{ color: "#f5a623", fontSize: 15 }}>
                    {fmtRp(totalBill)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
              </Table.Summary.Row>
            )}
          />
        )}

        <Divider style={{ margin: "16px 0" }} />

        {/* Add Item Row */}
        <div>
          <Text
            strong
            style={{ display: "block", marginBottom: 8, fontSize: 13 }}
          >
            ➕ Tambah Item Manual
          </Text>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Nama item..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={addItem}
              style={{ flex: 1 }}
            />
            <InputNumber
              placeholder="Qty"
              value={newQty}
              min={1}
              onChange={(v) => setNewQty(v ?? 1)}
              style={{ width: 65 }}
            />
            <InputNumber
              placeholder="Harga"
              value={newPrice}
              min={0}
              step={500}
              formatter={(v) =>
                v ? `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
              }
              parser={(v) => Number(v!.replace(/[Rp\s.]/g, "")) as 0}
              onChange={(v) => setNewPrice(v)}
              style={{ width: 130 }}
              onPressEnter={addItem}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addItem}
              disabled={!newName.trim() || !newPrice}
            >
              Tambah
            </Button>
          </Space.Compact>
        </div>
      </Card>

      {/* Navigation */}
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => goStep(0)}
          style={{ borderRadius: 10 }}
        >
          Kembali
        </Button>
        <Button
          type="primary"
          size="large"
          disabled={bill.items.length === 0}
          onClick={() => goStep(2)}
          style={{ borderRadius: 10 }}
        >
          Lanjut ke Orang <ArrowRightOutlined />
        </Button>
      </Space>
    </Space>
  );
}
