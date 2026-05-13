import { ImageResponse } from "next/og";
import { calculateAudit } from "../../../lib/audit";
import { decodeSharePayload } from "../../../lib/share";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const formatUsd = (value: number | null) => {
  if (value === null) return "-";
  return `$${value.toFixed(0)}`;
};

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let savings = "$0";
  let spend = "$0";
  let toolsSummary = "AI Tool Stack";
  let isHighSavings = false;

  try {
    const payload = decodeSharePayload(id);
    const audit = calculateAudit(payload);
    savings = formatUsd(audit.summary.totalSavingsMonthlyUsd);
    spend = formatUsd(audit.summary.totalMonthlyUsd);
    isHighSavings = audit.summary.credexRecommended;

    // Generate a string like "Cursor · GitHub Copilot · Claude"
    const toolNames = audit.recommendations.map((r) => r.toolName);
    if (toolNames.length > 0) {
      toolsSummary = toolNames.slice(0, 4).join("  ·  ") + (toolNames.length > 4 ? "..." : "");
    }
  } catch {
    // Keep default values for invalid payloads.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #161412 0%, #2a2520 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                background: "#ff6a3d",
                color: "white",
                padding: "8px 24px",
                borderRadius: "9999px",
                fontSize: 24,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              Credex
            </div>
            <div style={{ marginLeft: "24px", fontSize: 28, color: "#a89f98" }}>
              SignalSpend Audit
            </div>
          </div>

          {isHighSavings && (
            <div
              style={{
                background: "rgba(15, 107, 95, 0.2)",
                color: "#20d1ba",
                padding: "12px 24px",
                borderRadius: "9999px",
                fontSize: 20,
                fontWeight: 600,
                border: "1px solid rgba(32, 209, 186, 0.3)",
              }}
            >
              High-Savings Profile
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: "auto", width: "100%" }}>
          <div style={{ fontSize: 32, color: "#a89f98", fontWeight: 500, marginBottom: "16px" }}>
            Potential Savings Found
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ fontSize: 130, fontWeight: 800, color: "#ffffff", lineHeight: 1, letterSpacing: "-0.02em" }}>
              {savings}
            </div>
            <div style={{ fontSize: 56, color: "#a89f98", fontWeight: 600, marginLeft: "8px" }}>
              /mo
            </div>
          </div>

          <div style={{ display: "flex", marginTop: "56px", gap: "80px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 20, color: "#a89f98", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Current Spend
              </span>
              <span style={{ fontSize: 40, fontWeight: 600, marginTop: "8px" }}>
                {spend}/mo
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 20, color: "#a89f98", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Tech Stack Analyzed
              </span>
              <span style={{ fontSize: 32, fontWeight: 500, marginTop: "12px", color: "#e6e0d8" }}>
                {toolsSummary}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "40px",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 24, color: "#a89f98" }}>
            PII Stripped · Secure Public Link
          </div>
          <div style={{ fontSize: 26, color: "#ff6a3d", fontWeight: 600 }}>
            Run your free audit &rarr;
          </div>
        </div>
      </div>
    ),
    size
  );
}
