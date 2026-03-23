"use client";

import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
  Progress,
  Alert,
  Badge,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { BillState } from "@/lib/types";

const { Title, Text } = Typography;

interface Props {
  bill: BillState;
  updateBill: (patch: Partial<BillState>) => void;
  goStep: (step: number) => void;
}

export default function AssignStep({ bill, updateBill, goStep }: Props) {
  const fmtRp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

  const toggleAssign = (itemId: string, personId: string) => {
    const current = bill.assignments[itemId] ?? [];
    const updated = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    updateBill({
      assignments: { ...bill.assignments, [itemId]: updated },
    });
  };

  const assignAll = (itemId: string) => {
    updateBill({
      assignments: {
        ...bill.assignments,
        [itemId]: bill.people.map((p) => p.id),
      },
    });
  };

  const assignedCount = bill.items.filter(
    (i) => (bill.assignments[i.id]?.length ?? 0) > 0,
  ).length;

  const progress = Math.round((assignedCount / bill.items.length) * 100);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      {/* Progress */}
      <Card size="small">
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text strong>Progress Assign</Text>
          <Text type="secondary">
            {assignedCount} / {bill.items.length} item
          </Text>
        </Space>
        <Progress
          percent={progress}
          strokeColor="#f5a623"
          railColor="#f0f0f0"
          showInfo={false}
        />
      </Card>

      {/* Assign Cards */}
      <Card
        title={
          <Space>
            <span>🍽️ Siapa makan apa?</span>
            <Tag color="orange">{bill.items.length} item</Tag>
          </Space>
        }
      >
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          {bill.items.map((item) => {
            const assigned = bill.assignments[item.id] ?? [];
            const isAssigned = assigned.length > 0;
            const sharePerPerson =
              assigned.length > 0
                ? (item.price * item.qty) / assigned.length
                : 0;

            return (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${isAssigned ? "#b7eb8f" : "#f0f0f0"}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  background: isAssigned ? "#f6ffed" : "#fafafa",
                  transition: "all 0.2s",
                }}
              >
                {/* Item Header */}
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: 10,
                    flexWrap: "wrap",
                    gap: 4,
                  }}
                >
                  <Space size={6}>
                    {isAssigned ? (
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                    )}
                    <Text strong style={{ fontSize: 14 }}>
                      {item.name}
                      {item.qty > 1 && (
                        <Tag
                          style={{ marginLeft: 6, fontSize: 11 }}
                          color="blue"
                        >
                          x{item.qty}
                        </Tag>
                      )}
                    </Text>
                  </Space>
                  <Space size={6}>
                    <Text style={{ color: "#f5a623", fontWeight: 700 }}>
                      {fmtRp(item.price * item.qty)}
                    </Text>
                    {assigned.length > 1 && (
                      <Tag color="geekblue" style={{ fontSize: 11 }}>
                        ÷{assigned.length} = {fmtRp(sharePerPerson)}/orang
                      </Tag>
                    )}
                  </Space>
                </Space>

                {/* Person Buttons */}
                <Space wrap size={6}>
                  {bill.people.map((person) => {
                    const sel = assigned.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        className={`assign-person-btn ${sel ? "selected" : ""}`}
                        style={
                          sel
                            ? {
                                background: person.color,
                                borderColor: person.color,
                                color: "#fff",
                              }
                            : {}
                        }
                        onClick={() => toggleAssign(item.id, person.id)}
                      >
                        <span>{person.avatar}</span>
                        <span>{person.name}</span>
                      </button>
                    );
                  })}
                  <Button
                    size="small"
                    type="link"
                    style={{ fontSize: 12, padding: "0 6px" }}
                    onClick={() => assignAll(item.id)}
                  >
                    Semua
                  </Button>
                </Space>
              </div>
            );
          })}
        </Space>
      </Card>

      {/* Warning for unassigned */}
      {assignedCount < bill.items.length && (
        <Alert
          title={`${bill.items.length - assignedCount} item belum di-assign`}
          description="Item yang tidak di-assign tidak akan masuk ke perhitungan siapapun."
          type="warning"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}

      {/* Navigation */}
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => goStep(2)}
          style={{ borderRadius: 10 }}
        >
          Kembali
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={() => goStep(4)}
          disabled={assignedCount === 0}
          style={{ borderRadius: 10 }}
        >
          Hitung Tagihan <ArrowRightOutlined />
        </Button>
      </Space>
    </Space>
  );
}
