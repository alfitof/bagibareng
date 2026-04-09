"use client";

import {
  CameraOutlined,
  EditOutlined,
  TeamOutlined,
  SwapOutlined,
  TrophyOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

interface Props {
  current: number;
}

const STEPS = [
  { label: "Upload", icon: <CameraOutlined /> },
  { label: "Edit Item", icon: <EditOutlined /> },
  { label: "Orang", icon: <TeamOutlined /> },
  { label: "Assign", icon: <SwapOutlined /> },
  { label: "Hasil", icon: <TrophyOutlined /> },
];

export default function CustomSteps({ current }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 520);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        marginBottom: 28,
      }}
    >
      {STEPS.map((step, idx) => {
        const isActive = idx === current;
        const isDone = idx < current;

        const iconStyle: React.CSSProperties = {
          width: isMobile ? 28 : 32,
          height: isMobile ? 28 : 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMobile ? 11 : 13,
          flexShrink: 0,
          transition: "all 0.25s",
          border: isActive
            ? "2px solid #f5a623"
            : isDone
              ? "2px solid #f5a623"
              : "2px solid #e0e0e0",
          background: isActive ? "#f5a623" : isDone ? "#fff7e6" : "#fff",
          color: isActive ? "#fff" : isDone ? "#f5a623" : "#bfbfbf",
          boxShadow: isActive ? "0 0 0 3px rgba(245,166,35,0.18)" : "none",
        };

        const labelStyle: React.CSSProperties = {
          fontSize: 12,
          fontWeight: isActive ? 800 : isDone ? 500 : 400,
          color: isActive ? "#1a1a2e" : isDone ? "#f5a623" : "#bfbfbf",
          whiteSpace: "nowrap",
          transition: "all 0.25s",
          lineHeight: 1.2,
          display: isMobile ? "none" : "block",
          marginLeft: 8,
        };

        const lineStyle: React.CSSProperties = {
          flex: 1,
          flexShrink: 1,
          minWidth: isMobile ? 6 : 8,
          height: 2,
          background: isDone ? "#f5a623" : "#e0e0e0",
          margin: isMobile ? "0 4px" : "0 6px",
          transition: "background 0.25s",
          display: "block",
        };

        return (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <div style={iconStyle}>
                {isDone ? <CheckOutlined /> : step.icon}
              </div>
              <span style={labelStyle}>{step.label}</span>
            </div>

            {idx < STEPS.length - 1 && <div style={lineStyle} />}
          </div>
        );
      })}
    </div>
  );
}
