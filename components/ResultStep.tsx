"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  List,
} from "antd";
import {
  CopyOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { BillState } from "@/lib/types";

const { Title, Text, Paragraph } = Typography;

interface Props {
  bill: BillState;
  goStep: (step: number) => void;
  resetAll: () => void;
}

interface PersonResult {
  person: BillState["people"][0];
  total: number;
  items: {
    name: string;
    share: number;
    qty: number;
    splitCount: number;
  }[];
}

export default function ResultStep({ bill, goStep, resetAll }: Props) {
  const [copied, setCopied] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();

  const fmtRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

  const results: PersonResult[] = useMemo(() => {
    return bill.people.map((person) => {
      const items: PersonResult["items"] = [];
      let total = 0;
      for (const item of bill.items) {
        const assigned = bill.assignments[item.id] ?? [];
        if (!assigned.includes(person.id)) continue;
        const share = (item.price * item.qty) / assigned.length;
        total += share;
        items.push({
          name: item.name,
          share,
          qty: item.qty,
          splitCount: assigned.length,
        });
      }
      return { person, total, items };
    });
  }, [bill]);

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);

  const shareText = useMemo(() => {
    const lines: string[] = [];
    lines.push("🧾 SPLIT BILL");
    lines.push("=".repeat(28));
    for (const r of results) {
      lines.push(`\n${r.person.avatar} ${r.person.name}`);
      for (const it of r.items) {
        const note = it.splitCount > 1 ? ` (÷${it.splitCount})` : "";
        lines.push(`  • ${it.name}${note}: ${fmtRp(it.share)}`);
      }
      lines.push(`  ➡ TOTAL: ${fmtRp(r.total)}`);
    }
    lines.push("\n" + "=".repeat(28));
    lines.push(`💰 Grand Total: ${fmtRp(grandTotal)}`);
    lines.push("\nDibuat dengan SplitBill App 🧾");
    return lines.join("\n");
  }, [results, grandTotal]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      msgApi.success("Berhasil disalin!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      msgApi.error("Gagal menyalin");
    }
  };

  return (
    <>
      {contextHolder}
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        {/* Header Summary */}
        <Card style={{ background: "#fff7e6", border: "1px solid #ffd591" }}>
          <Row gutter={16} justify="center">
            <Col>
              <Statistic
                title="Total Struk"
                value={grandTotal}
                prefix="Rp"
                formatter={(v) => Number(v).toLocaleString("id-ID")}
                styles={{
                  content: { color: "#f5a623", fontWeight: 800 },
                }}
              />
            </Col>
            <Col>
              <Statistic
                title="Jumlah Orang"
                value={bill.people.length}
                suffix="orang"
                styles={{
                  content: { fontWeight: 800 },
                }}
              />
            </Col>
            <Col>
              <Statistic
                title="Item"
                value={bill.items.length}
                suffix="item"
                styles={{
                  content: { fontWeight: 800 },
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* Per Person Cards */}
        <Card title="💰 Tagihan Per Orang">
          <Row gutter={[12, 12]}>
            {results.map((r) => (
              <Col xs={24} sm={12} key={r.person.id}>
                <div
                  className="result-person-card"
                  style={{
                    background: r.person.color + "18",
                    border: `2px solid ${r.person.color}44`,
                  }}
                >
                  {/* Person Header */}
                  <Space style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{r.person.avatar}</span>
                    <Text
                      strong
                      style={{ fontSize: 16, color: r.person.color }}
                    >
                      {r.person.name}
                    </Text>
                  </Space>

                  {/* Items */}
                  <div style={{ marginBottom: 10 }}>
                    {r.items.length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Tidak ada item
                      </Text>
                    ) : (
                      r.items.map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: "#595959",
                            padding: "2px 0",
                          }}
                        >
                          <span>
                            {it.name}
                            {it.splitCount > 1 && (
                              <Tag
                                style={{
                                  marginLeft: 4,
                                  fontSize: 10,
                                  padding: "0 5px",
                                }}
                                color="default"
                              >
                                ÷{it.splitCount}
                              </Tag>
                            )}
                          </span>
                          <span style={{ fontWeight: 600 }}>
                            {fmtRp(it.share)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <Divider style={{ margin: "10px 0" }} />

                  {/* Total */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text strong>Total</Text>
                    <Text
                      strong
                      style={{
                        fontSize: 20,
                        color: r.person.color,
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtRp(r.total)}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Share Section */}
        <Card
          title={
            <Space>
              <ShareAltOutlined />
              <span>Share Hasil</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              style={{
                background: copied ? "#52c41a" : undefined,
                borderColor: copied ? "#52c41a" : undefined,
              }}
            >
              {copied ? "Tersalin!" : "Copy"}
            </Button>
          }
        >
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 10,
              fontSize: 12,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#595959",
              margin: 0,
              lineHeight: 1.8,
            }}
          >
            {shareText}
          </pre>
        </Card>

        {/* Actions */}
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Button
            size="large"
            onClick={() => goStep(3)}
            style={{ borderRadius: 10 }}
          >
            ← Edit Assign
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={resetAll}
            style={{ borderRadius: 10 }}
          >
            Split Baru
          </Button>
        </Space>
      </Space>
    </>
  );
}
