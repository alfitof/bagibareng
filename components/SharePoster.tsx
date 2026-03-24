"use client";

import { SharePayload } from "@/lib/shareStore";

interface PersonResult {
  person: SharePayload["people"][0];
  total: number;
  items: { name: string; share: number; splitCount: number }[];
}

interface GroupPosterProps {
  type: "group";
  results: PersonResult[];
  grandTotal: number;
  totalItems: number;
}

interface PersonPosterProps {
  type: "person";
  result: PersonResult;
}

type Props = GroupPosterProps | PersonPosterProps;

const fmtRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const today = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ── Group Poster ──────────────────────────────────────────────────────────────
function GroupPoster({ results, grandTotal, totalItems }: GroupPosterProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 24,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: 6,
          background:
            results.length >= 2
              ? `linear-gradient(90deg, ${results[0].person.color}, ${results[1].person.color})`
              : "#f5a623",
        }}
      />

      {/* Header */}
      <div
        style={{
          background: "#fff7e6",
          padding: "22px 22px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Deco circle */}
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#f5a623",
            opacity: 0.07,
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#f5a623",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              Split Bill Bareng
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>
              Bagi
              <span style={{ color: "#f5a623" }}>Bareng</span>
            </div>
          </div>

          {/* Grand total */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Grand Total
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#f5a623",
                fontFamily: "monospace",
              }}
            >
              {fmtRp(grandTotal)}
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {results.length} orang · {totalItems} item
            </div>
          </div>
        </div>
      </div>

      {/* 2 col grid */}
      <div
        style={{
          padding: "14px 16px 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {results.map((r) => (
          <div
            key={r.person.id}
            style={{
              background: r.person.color + "12",
              borderTopWidth: 3,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderLeftWidth: 1,
              borderStyle: "solid",
              borderColor: r.person.color + "33",
              borderTopColor: r.person.color,
              borderRadius: 12,
              padding: 12,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Avatar + name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{r.person.avatar}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  wordBreak: "break-word",
                }}
              >
                {r.person.name}
              </span>
            </div>

            {/* Items */}
            <div style={{ flex: 1, marginBottom: 8 }}>
              {r.items.map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "#595959",
                    padding: "2px 0",
                    gap: 4,
                  }}
                >
                  <span style={{ flex: 1, wordBreak: "break-word" }}>
                    {it.name}
                    {it.splitCount > 1 && (
                      <span
                        style={{
                          marginLeft: 4,
                          fontSize: 10,
                          background: "#f0f0f0",
                          borderRadius: 3,
                          padding: "1px 4px",
                          color: "#999",
                        }}
                      >
                        ÷{it.splitCount}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      color: "#262626",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {fmtRp(it.share)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div
              style={{
                borderTop: `1px solid ${r.person.color}33`,
                paddingTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, color: "#888" }}>Total</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: r.person.color,
                  fontFamily: "monospace",
                }}
              >
                {fmtRp(r.total)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 20px",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fafafa",
        }}
      >
        <span style={{ fontSize: 10, color: "#bbb" }}>{today}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#ccc" }}>
          BagiBareng
        </span>
      </div>
    </div>
  );
}

// ── Person Poster ─────────────────────────────────────────────────────────────
function PersonPoster({ result }: PersonPosterProps) {
  const color = result.person.color;

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 24,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
        }}
      />

      {/* Header */}
      <div
        style={{
          background: color + "12",
          padding: "24px 24px 18px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: color,
            opacity: 0.08,
          }}
        />

        {/* Name row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Tagihan untuk
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 30 }}>{result.person.avatar}</span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#1a1a2e",
                }}
              >
                {result.person.name}
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#1a1a2e",
              position: "relative",
              bottom: 6,
            }}
          >
            Bagi<span style={{ color: "#f5a623" }}>Bareng</span>
          </div>
        </div>

        {/* Total card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Total Tagihan
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color,
                fontFamily: "monospace",
                lineHeight: 1,
              }}
            >
              {fmtRp(result.total)}
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: color + "18",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            💳
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: "18px 24px" }}>
        <div
          style={{
            fontSize: 10,
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Rincian Pesanan
        </div>

        {result.items.map((it, idx) => (
          <div key={idx}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "8px 0",
                gap: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1a1a2e",
                    marginBottom: 2,
                  }}
                >
                  {it.name}
                </div>
                {it.splitCount > 1 && (
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    Dibagi {it.splitCount} orang
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#262626",
                  flexShrink: 0,
                }}
              >
                {fmtRp(it.share)}
              </div>
            </div>
            {idx < result.items.length - 1 && (
              <div style={{ height: 1, background: "#f5f5f5" }} />
            )}
          </div>
        ))}

        {/* Total row */}
        <div
          style={{
            marginTop: 12,
            background: color + "0f",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: color + "33",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
            Total Kamu
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color,
              fontFamily: "monospace",
            }}
          >
            {fmtRp(result.total)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 24px",
          borderTop: "1px solid #f5f5f5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fafafa",
        }}
      >
        <span style={{ fontSize: 10, color: "#bbb" }}>{today}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#ccc" }}>
          BagiBareng
        </span>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function SharePoster(props: Props) {
  if (props.type === "group") return <GroupPoster {...props} />;
  return <PersonPoster {...props} />;
}
