"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Input,
  Space,
  Typography,
  Avatar,
  Tooltip,
  Empty,
  Tag,
} from "antd";
import {
  UserAddOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { BillState, Person } from "@/lib/types";
import { PERSON_COLORS, PERSON_AVATARS } from "@/lib/colors";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;

interface Props {
  bill: BillState;
  updateBill: (patch: Partial<BillState>) => void;
  goStep: (step: number) => void;
}

const QUICK_NAMES = [
  "Aku",
  "Kamu",
  "Budi",
  "Ani",
  "Citra",
  "Doni",
  "Eka",
  "Fajar",
];

export default function PeopleStep({ bill, updateBill, goStep }: Props) {
  const [inputName, setInputName] = useState("");

  const addPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (bill.people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
      return;
    const idx = bill.people.length;
    const person: Person = {
      id: uuidv4(),
      name: trimmed,
      color: PERSON_COLORS[idx % PERSON_COLORS.length],
      avatar: PERSON_AVATARS[idx % PERSON_AVATARS.length],
    };
    updateBill({ people: [...bill.people, person] });
    setInputName("");
  };

  const removePerson = (id: string) => {
    const assignments = { ...bill.assignments };
    for (const key in assignments) {
      assignments[key] = assignments[key].filter((pid) => pid !== id);
    }
    updateBill({
      people: bill.people.filter((p) => p.id !== id),
      assignments,
    });
  };

  const availableQuick = QUICK_NAMES.filter(
    (n) => !bill.people.some((p) => p.name.toLowerCase() === n.toLowerCase()),
  );

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          👥 Siapa yang ikut makan?
        </Title>

        {/* Add Person Input */}
        <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
          <Input
            placeholder="Masukkan nama..."
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onPressEnter={() => {
              addPerson(inputName);
            }}
            prefix={<UserAddOutlined style={{ color: "#bbb" }} />}
            size="large"
          />
          <Button
            type="primary"
            size="large"
            onClick={() => addPerson(inputName)}
            disabled={!inputName.trim()}
          >
            Tambah
          </Button>
        </Space.Compact>

        {/* Quick Add */}
        {availableQuick.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <Text
              type="secondary"
              style={{ fontSize: 12, marginBottom: 8, display: "block" }}
            >
              Tambah cepat:
            </Text>
            <Space wrap size={8}>
              {availableQuick.slice(0, 6).map((name) => (
                <Button
                  key={name}
                  size="small"
                  onClick={() => addPerson(name)}
                  style={{ borderRadius: 99 }}
                >
                  + {name}
                </Button>
              ))}
            </Space>
          </div>
        )}

        {/* People List */}
        {bill.people.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada orang. Tambahkan di atas!"
          />
        ) : (
          <div>
            <Text
              type="secondary"
              style={{ fontSize: 12, marginBottom: 12, display: "block" }}
            >
              {bill.people.length} orang ditambahkan:
            </Text>
            <Space wrap size={10}>
              {bill.people.map((person) => (
                <div
                  key={person.id}
                  className="person-chip"
                  style={{
                    background: person.color + "22",
                    border: `2px solid ${person.color}44`,
                    color: person.color,
                  }}
                >
                  <span>{person.avatar}</span>
                  <span>{person.name}</span>
                  <Tooltip title="Hapus">
                    <CloseOutlined
                      style={{ fontSize: 11, cursor: "pointer", marginLeft: 2 }}
                      onClick={() => removePerson(person.id)}
                    />
                  </Tooltip>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Card>

      {/* Summary */}
      {bill.people.length > 0 && (
        <Card
          size="small"
          style={{ background: "#f6ffed", border: "1px solid #b7eb8f" }}
        >
          <Text style={{ fontSize: 13 }}>
            ✅ <strong>{bill.people.length} orang</strong> akan membagi{" "}
            <strong>{bill.items.length} item</strong>. Lanjut untuk assign item
            ke masing-masing orang.
          </Text>
        </Card>
      )}

      {/* Navigation */}
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => goStep(1)}
          style={{ borderRadius: 10 }}
        >
          Kembali
        </Button>
        <Button
          type="primary"
          size="large"
          disabled={bill.people.length === 0}
          onClick={() => goStep(3)}
          style={{ borderRadius: 10 }}
        >
          Assign Item <ArrowRightOutlined />
        </Button>
      </Space>
    </Space>
  );
}
