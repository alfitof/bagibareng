"use client";

import { useState, useEffect } from "react";
import { Typography, Layout } from "antd";
import UploadStep from "../components/UploadStep";
import EditItemsStep from "../components/EditItemsStep";
import PeopleStep from "../components/PeopleStep";
import AssignStep from "../components/AssignStep";
import ResultStep from "../components/ResultStep";
import CustomSteps from "../components/CustomSteps";
import { BillState } from "@/lib/types";
import { loadShareData, loadSavedStep } from "@/lib/shareStore";

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

export default function HomePage() {
  const [bill, setBill] = useState<BillState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Restore state dari sessionStorage saat kembali dari share page
  useEffect(() => {
    const payload = loadShareData();
    const savedStep = loadSavedStep();
    if (payload && savedStep === 4) {
      setBill({
        step: 4,
        imageFile: null,
        imagePreviewUrl: null,
        ocrRawText: "",
        items: payload.items,
        people: payload.people,
        assignments: payload.assignments,
      });
    }
    setHydrated(true);
  }, []);

  const goStep = (step: number) => setBill((prev) => ({ ...prev, step }));
  const updateBill = (patch: Partial<BillState>) =>
    setBill((prev) => ({ ...prev, ...patch }));
  const resetAll = () => {
    sessionStorage.removeItem("bagibareng_share");
    sessionStorage.removeItem("bagibareng_step");
    setBill(INITIAL_STATE);
  };

  if (!hydrated) return null;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <Content
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "24px 16px",
          minWidth: 700,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 30 }}>🧾</span>
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
              Bagi<span style={{ color: "#f5a623" }}>Bareng</span>
            </Title>
          </div>
          <Text
            style={{
              color: "#8c8c8c",
              fontSize: 13,
              marginTop: 4,
              display: "block",
            }}
          >
            Upload foto struk → scan otomatis → bagi tagihan per orang
          </Text>
        </div>

        <CustomSteps current={bill.step} />

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
