"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Layout, Typography, Spin } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { loadShareData, SharePayload } from "@/lib/shareStore";
import domtoimage from "dom-to-image";
import SharePoster from "@/components/SharePoster";
import { Grid } from "antd";

const { useBreakpoint } = Grid;
const { Content } = Layout;
const { Text } = Typography;

interface PersonResult {
  person: SharePayload["people"][0];
  total: number;
  items: { name: string; share: number; splitCount: number }[];
}

export default function SharePersonPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params?.personId as string;
  const posterRef = useRef<HTMLDivElement>(null);
  const screens = useBreakpoint();

  const isDesktop = screens.md;
  const [result, setResult] = useState<PersonResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const payload = loadShareData();
    if (!payload || !personId) return;
    const person = payload.people.find((p) => p.id === personId);
    if (!person) return;
    let total = 0;
    const items: PersonResult["items"] = [];
    for (const item of payload.items) {
      const assigned = payload.assignments[item.id] ?? [];
      if (!assigned.includes(person.id)) continue;
      const share = (item.price * item.qty) / assigned.length;
      total += share;
      items.push({ name: item.name, share, splitCount: assigned.length });
    }
    setResult({ person, total, items });
  }, [personId]);

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
      link.download = `bagibareng-${result?.person.name ?? "tagihan"}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setDownloading(false);
    }
  };

  if (!result) {
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
        style={{
          maxWidth: 420,
          margin: "0 auto",
          padding: "24px 16px",
          minWidth: isDesktop ? 400 : undefined,
        }}
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
          <Text style={{ color: "#888", fontSize: 12 }}>Share Personal</Text>
        </div>

        <div ref={posterRef}>
          <SharePoster type="person" result={result} />
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
              background: result.person.color,
              borderColor: result.person.color,
            }}
          >
            {downloading ? "Menyimpan..." : "⬇️ Download Gambar"}
          </Button>
          <Button
            size="large"
            block
            icon={<ShareAltOutlined />}
            onClick={handleDownload}
            style={{
              height: 48,
              borderRadius: 12,
              borderColor: result.person.color + "55",
              color: result.person.color,
              background: result.person.color + "0a",
            }}
          >
            Simpan & Share ke {result.person.name}
          </Button>
        </div>
      </Content>
    </Layout>
  );
}
