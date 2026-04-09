"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Layout, Typography, Spin } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { loadShareData, SharePayload } from "@/lib/shareStore";
import domtoimage from "dom-to-image";
import SharePoster from "@/components/SharePoster";

const { Content } = Layout;
const { Text } = Typography;

interface PersonResult {
  person: SharePayload["people"][0];
  total: number;
  items: { name: string; share: number; splitCount: number }[];
}

export default function ShareGroupPage() {
  const router = useRouter();
  const posterRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<PersonResult[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState<SharePayload | null>(null);

  useEffect(() => {
    const payload = loadShareData();
    if (!payload) return;
    setData(payload);
    const computed = payload.people.map((person) => {
      let total = 0;
      const items: PersonResult["items"] = [];
      for (const item of payload.items) {
        const assigned = payload.assignments[item.id] ?? [];
        if (!assigned.includes(person.id)) continue;
        const share = (item.price * item.qty) / assigned.length;
        total += share;
        items.push({ name: item.name, share, splitCount: assigned.length });
      }
      return { person, total, items };
    });
    setResults(computed);
    setGrandTotal(computed.reduce((s, r) => s + r.total, 0));
  }, []);

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const el = posterRef.current;
      const scale = 3;
      const blob = await domtoimage.toBlob(el, {
        width: el.offsetWidth * scale,
        height: el.offsetHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${el.offsetWidth}px`,
          height: `${el.offsetHeight}px`,
        },
      });
      const link = document.createElement("a");
      link.download = "bagibareng-grup.png";
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setDownloading(false);
    }
  };

  if (!data) {
    return (
      <Layout
        style={{
          minHeight: "100vh",
          background: "#f7f8fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <Content
        style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => router.push("/")}
          >
            Kembali
          </Button>
          <Text style={{ color: "#888", fontSize: 12 }}>Share Grup</Text>
        </div>

        <div ref={posterRef}>
          <SharePoster
            type="group"
            results={results}
            grandTotal={grandTotal}
            totalItems={data.items.length}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Button
            type="primary"
            size="large"
            block
            icon={downloading ? <Spin size="small" /> : <DownloadOutlined />}
            onClick={handleDownload}
            disabled={downloading}
            style={{
              height: 52,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              background: "#f5a623",
              borderColor: "#f5a623",
            }}
          >
            {downloading ? "Menyimpan..." : "Download Gambar"}
          </Button>
          <Button
            size="large"
            block
            icon={<ShareAltOutlined />}
            onClick={handleDownload}
            style={{
              height: 48,
              borderRadius: 12,
              borderColor: "#f5a62355",
              color: "#f5a623",
              background: "#fff7e6",
            }}
          >
            Simpan & Share ke Grup
          </Button>
        </div>
      </Content>
    </Layout>
  );
}
