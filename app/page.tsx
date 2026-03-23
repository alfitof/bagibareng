"use client";

import { useState } from "react";
import { Steps, Typography, Layout, Space } from "antd";
import {
  CameraOutlined,
  EditOutlined,
  TeamOutlined,
  SwapOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

import UploadStep from "../components/UploadStep";
import EditItemsStep from "../components/EditItemsStep";
import PeopleStep from "../components/PeopleStep";
import AssignStep from "../components/AssignStep";
import ResultStep from "../components/ResultStep";

import { BillState } from "@/lib/types";

const { Title, Text } = Typography;
const { Content } = Layout;

const INITIAL_STATE: BillState = {
  step: 0,
  imageFile: null,
  imagePreviewUrl: null,
  ocrRawText: "",
  items: [],
  people: [],
  assignments: {},
};

const STEPS = [
  { title: "Upload", icon: <CameraOutlined /> },
  { title: "Edit Item", icon: <EditOutlined /> },
  { title: "Orang", icon: <TeamOutlined /> },
  { title: "Assign", icon: <SwapOutlined /> },
  { title: "Hasil", icon: <TrophyOutlined /> },
];

const getSteps = (current: number) => [
  {
    title: "Upload",
    icon: (
      <CameraOutlined
        style={{
          fontSize: 14,
          color: current === 0 ? "#fff" : "#bfbfbf",
        }}
      />
    ),
  },
  {
    title: "Edit Item",
    icon: (
      <EditOutlined
        style={{
          fontSize: 14,
          color: current === 1 ? "#fff" : "#bfbfbf",
        }}
      />
    ),
  },
  {
    title: "Orang",
    icon: (
      <TeamOutlined
        style={{
          fontSize: 14,
          color: current === 2 ? "#fff" : "#bfbfbf",
        }}
      />
    ),
  },
  {
    title: "Assign",
    icon: (
      <SwapOutlined
        style={{
          fontSize: 14,
          color: current === 3 ? "#fff" : "#bfbfbf",
        }}
      />
    ),
  },
  {
    title: "Hasil",
    icon: (
      <TrophyOutlined
        style={{
          fontSize: 14,
          color: current === 4 ? "#fff" : "#bfbfbf",
        }}
      />
    ),
  },
];

export default function HomePage() {
  const [bill, setBill] = useState<BillState>(INITIAL_STATE);

  const goStep = (step: number) => setBill((prev) => ({ ...prev, step }));

  const updateBill = (patch: Partial<BillState>) =>
    setBill((prev) => ({ ...prev, ...patch }));

  const resetAll = () => setBill(INITIAL_STATE);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <Content
        style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}
      >
        {/* Header */}
        <Space orientation="vertical" size={4} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 32 }}>🧾</span>
            <Title
              level={2}
              style={{
                margin: 0,
                fontFamily: "Plus Jakarta Sans",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: "#1a1a2e",
              }}
            >
              Split<span style={{ color: "#f5a623" }}>Bill</span>
            </Title>
          </div>
          <Text style={{ color: "#8c8c8c", fontSize: 13 }}>
            Upload foto struk → scan otomatis → bagi tagihan per orang
          </Text>
        </Space>

        {/* Steps */}
        <Steps
          current={bill.step}
          items={getSteps(bill.step)}
          size="small"
          style={{ marginBottom: 32 }}
        />

        {/* Step Content */}
        <div className="step-card-enter" key={bill.step}>
          {bill.step === 0 && (
            <UploadStep bill={bill} updateBill={updateBill} goStep={goStep} />
          )}
          {bill.step === 1 && (
            <EditItemsStep
              bill={bill}
              updateBill={updateBill}
              goStep={goStep}
            />
          )}
          {bill.step === 2 && (
            <PeopleStep bill={bill} updateBill={updateBill} goStep={goStep} />
          )}
          {bill.step === 3 && (
            <AssignStep bill={bill} updateBill={updateBill} goStep={goStep} />
          )}
          {bill.step === 4 && (
            <ResultStep bill={bill} goStep={goStep} resetAll={resetAll} />
          )}
        </div>
      </Content>
    </Layout>
  );
}
