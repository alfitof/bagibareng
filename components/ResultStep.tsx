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
} from "antd";
import {
  ReloadOutlined,
  ShareAltOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { BillState } from "@/lib/types";
import { saveShareData } from "@/lib/shareStore";

const { Text } = Typography;

interface Props {
  bill: BillState;
  goStep: (step: number) => void;
  resetAll: () => void;
}

interface PersonResult {
  person: BillState["people"][0];
  total: number;
  items: { name: string; share: number; qty: number; splitCount: number }[];
}

export default function ResultStep({ bill, goStep, resetAll }: Props) {
  const router = useRouter();
  const [msgApi, contextHolder] = message.useMessage();

  const fmtRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

  const results: PersonResult[] = useMemo(() => {
    return bill.people.map((person) => {
      let total = 0;
      const items: PersonResult["items"] = [];
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

  const handleShareGroup = () => {
    saveShareData(bill);
    router.push("/share/group");
  };

  const handleSharePerson = (personId: string) => {
    saveShareData(bill);
    router.push(`/share/${personId}`);
  };

  return (
    <>
      {contextHolder}
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        {/* ── Summary Stats ── */}
        <Card
          style={{
            background: "linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)",
            border: "1px solid #ffd591",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  display: "block",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Struk
              </Text>
              <Text
                strong
                style={{
                  fontSize: 20,
                  color: "#f5a623",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                {fmtRp(grandTotal)}
              </Text>
            </div>
            <div
              style={{
                borderLeft: "1px solid #ffd591",
                borderRight: "1px solid #ffd591",
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  display: "block",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Jumlah Orang
              </Text>
              <Text
                strong
                style={{ fontSize: 20, display: "block", lineHeight: 1.2 }}
              >
                {bill.people.length}
                <span
                  style={{ fontSize: 13, fontWeight: 400, color: "#8c8c8c" }}
                >
                  {" "}
                  orang
                </span>
              </Text>
            </div>
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  display: "block",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Item
              </Text>
              <Text
                strong
                style={{ fontSize: 20, display: "block", lineHeight: 1.2 }}
              >
                {bill.items.length}
                <span
                  style={{ fontSize: 13, fontWeight: 400, color: "#8c8c8c" }}
                >
                  {" "}
                  item
                </span>
              </Text>
            </div>
          </div>
        </Card>

        {/* ── Per Person Cards ── */}
        <Card title="💰 Tagihan Per Orang">
          <Row gutter={[12, 12]} align="stretch">
            {results.map((r) => (
              <Col xs={24} sm={12} key={r.person.id}>
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 16,
                    padding: 20,
                    background: r.person.color + "18",
                    border: `2px solid ${r.person.color}44`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: r.person.color,
                      opacity: 0.12,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{r.person.avatar}</span>
                    <Text
                      strong
                      style={{ fontSize: 16, color: r.person.color }}
                    >
                      {r.person.name}
                    </Text>
                  </div>
                  <div style={{ flex: 1, marginBottom: 10 }}>
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
                            alignItems: "flex-start",
                            fontSize: 12,
                            color: "#595959",
                            padding: "2px 0",
                            gap: 8,
                          }}
                        >
                          <span style={{ flex: 1, wordBreak: "break-word" }}>
                            {it.name}
                            {it.splitCount > 1 && (
                              <Tag
                                style={{
                                  marginLeft: 4,
                                  fontSize: 10,
                                  padding: "0 4px",
                                }}
                                color="default"
                              >
                                ÷{it.splitCount}
                              </Tag>
                            )}
                          </span>
                          <span style={{ fontWeight: 600, flexShrink: 0 }}>
                            {fmtRp(it.share)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <Divider style={{ margin: "10px 0" }} />
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

        {/* ── Share ke Grup ── */}
        <Card
          title={
            <Space>
              <UsergroupAddOutlined style={{ color: "#f5a623" }} />
              <span>Share ke Grup</span>
            </Space>
          }
        >
          <Text
            type="secondary"
            style={{ fontSize: 13, display: "block", marginBottom: 12 }}
          >
            Lihat ringkasan lengkap semua orang dan salin untuk dikirim ke grup
            chat.
          </Text>
          <Button
            type="primary"
            block
            size="large"
            icon={<ShareAltOutlined />}
            onClick={handleShareGroup}
            style={{ borderRadius: 10, height: 48 }}
          >
            Lihat & Share Rincian Grup
          </Button>
        </Card>

        {/* ── Share Personal ── */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#f5a623" }} />
              <span>Share Personal</span>
            </Space>
          }
        >
          <Text
            type="secondary"
            style={{ fontSize: 13, display: "block", marginBottom: 12 }}
          >
            Kirim tagihan masing-masing ke personal chat.
          </Text>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
            }}
          >
            {results.map((r) => (
              <Button
                key={r.person.id}
                onClick={() => handleSharePerson(r.person.id)}
                style={{
                  height: "auto",
                  padding: "12px",
                  borderRadius: 10,
                  borderColor: r.person.color + "55",
                  background: r.person.color + "0f",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 24 }}>{r.person.avatar}</span>
                <Text strong style={{ fontSize: 12, color: r.person.color }}>
                  {r.person.name}
                </Text>
                <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                  {fmtRp(r.total)}
                </Text>
              </Button>
            ))}
          </div>
        </Card>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 12 }}>
          <Button
            size="large"
            onClick={() => goStep(3)}
            style={{ borderRadius: 10, flex: 1 }}
          >
            ← Edit Assign
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={resetAll}
            style={{ borderRadius: 10, flex: 1 }}
          >
            Split Baru
          </Button>
        </div>
      </Space>
    </>
  );
}
