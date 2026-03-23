"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Input,
  Space,
  Typography,
  Tooltip,
  Empty,
  Modal,
} from "antd";
import {
  UserAddOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { BillState, Person } from "@/lib/types";
import { PERSON_COLORS } from "@/lib/colors";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;

// Grouped avatars for picker
const AVATAR_GROUPS = {
  "👨 Pria": ["👨", "🧔", "👨‍💼", "👨‍🍳", "👨‍🎓", "🧑", "👦", "🧒"],
  "👩 Wanita": ["👩", "👩‍💼", "👩‍🍳", "👩‍🎓", "🧕", "👧", "👱‍♀️", "💁‍♀️"],
  "😀 Ekspresi": ["😀", "😎", "🤩", "😄", "🥳", "😏", "🤓", "😇"],
  "🐾 Hewan": ["🐶", "🐱", "🐼", "🦊", "🐸", "🐯", "🦁", "🐨"],
  "🎭 Karakter": ["🤖", "👻", "🎃", "🦸", "🧙", "🧛", "🧟", "🤠"],
};

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

interface Props {
  bill: BillState;
  updateBill: (patch: Partial<BillState>) => void;
  goStep: (step: number) => void;
}

export default function PeopleStep({ bill, updateBill, goStep }: Props) {
  const [inputName, setInputName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🧑");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState("🧑");

  // Per-person avatar edit
  const [editPersonId, setEditPersonId] = useState<string | null>(null);

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
      avatar: selectedAvatar,
    };
    updateBill({ people: [...bill.people, person] });
    setInputName("");
  };

  const removePerson = (id: string) => {
    const assignments = { ...bill.assignments };
    for (const key in assignments) {
      assignments[key] = assignments[key].filter((pid) => pid !== id);
    }
    updateBill({ people: bill.people.filter((p) => p.id !== id), assignments });
  };

  const openAvatarEdit = (personId: string) => {
    const person = bill.people.find((p) => p.id === personId);
    if (!person) return;
    setTempAvatar(person.avatar);
    setEditPersonId(personId);
    setAvatarPickerOpen(true);
  };

  const openNewPersonAvatarPicker = () => {
    setTempAvatar(selectedAvatar);
    setEditPersonId(null);
    setAvatarPickerOpen(true);
  };

  const confirmAvatar = () => {
    if (editPersonId) {
      updateBill({
        people: bill.people.map((p) =>
          p.id === editPersonId ? { ...p, avatar: tempAvatar } : p,
        ),
      });
    } else {
      setSelectedAvatar(tempAvatar);
    }
    setAvatarPickerOpen(false);
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

        {/* Add Person Row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            alignItems: "stretch",
          }}
        >
          {/* Avatar selector button */}
          <Tooltip title="Pilih avatar">
            <Button
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                fontSize: 20,
                flexShrink: 0,
                padding: 0,
                border: "1px dashed #d9d9d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={openNewPersonAvatarPicker}
            >
              {selectedAvatar}
            </Button>
          </Tooltip>
          <Input
            placeholder="Masukkan nama..."
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onPressEnter={() => addPerson(inputName)}
            prefix={<UserAddOutlined style={{ color: "#bbb" }} />}
            style={{ flex: 1, height: 40, borderRadius: 10 }}
          />
          <Button
            type="primary"
            onClick={() => addPerson(inputName)}
            disabled={!inputName.trim()}
            style={{ height: 40, borderRadius: 10, paddingInline: 16 }}
          >
            Tambah
          </Button>
        </div>

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
                  {/* Click avatar to edit */}
                  <Tooltip title="Ganti avatar">
                    <span
                      style={{ cursor: "pointer", fontSize: 18 }}
                      onClick={() => openAvatarEdit(person.id)}
                    >
                      {person.avatar}
                    </span>
                  </Tooltip>
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
      <div style={{ display: "flex", gap: 12 }}>
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => goStep(1)}
          style={{ borderRadius: 10, flex: 1 }}
        >
          Kembali
        </Button>
        <Button
          type="primary"
          size="large"
          disabled={bill.people.length === 0}
          onClick={() => goStep(3)}
          style={{ borderRadius: 10, flex: 1 }}
        >
          Assign Item <ArrowRightOutlined />
        </Button>
      </div>

      {/* Avatar Picker Modal */}
      <Modal
        title="Pilih Avatar"
        open={avatarPickerOpen}
        onOk={confirmAvatar}
        onCancel={() => setAvatarPickerOpen(false)}
        okText="Pilih"
        cancelText="Batal"
        width={380}
        styles={{ body: { maxHeight: 400, overflowY: "auto" } }}
      >
        {Object.entries(AVATAR_GROUPS).map(([group, emojis]) => (
          <div key={group} style={{ marginBottom: 16 }}>
            <Text
              type="secondary"
              style={{ fontSize: 11, display: "block", marginBottom: 8 }}
            >
              {group}
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setTempAvatar(emoji)}
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 24,
                    border:
                      tempAvatar === emoji
                        ? "2px solid #f5a623"
                        : "2px solid #f0f0f0",
                    borderRadius: 10,
                    background: tempAvatar === emoji ? "#fff7e6" : "#fafafa",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Modal>
    </Space>
  );
}
