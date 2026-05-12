import { ImageResponse } from "next/og";
import { calculateAudit } from "../../../lib/audit";
import { decodeSharePayload } from "../../../lib/share";

export const size = {
  width: 1200,
  height: 630,
};

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

  try {
    const payload = decodeSharePayload(id);
    const audit = calculateAudit(payload);
    savings = formatUsd(audit.summary.totalSavingsMonthlyUsd);
    spend = formatUsd(audit.summary.totalMonthlyUsd);
  } catch {
    // Keep default values for invalid payloads.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(160deg, #f7f3ef, #e6f5f1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          fontSize: 48,
          color: "#1d1a17",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0f6b5f" }}>
          SignalSpend audit
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 24 }}>
          {savings}/mo savings
        </div>
        <div style={{ fontSize: 36, marginTop: 12 }}>
          Current spend: {spend}/mo
        </div>
        <div style={{ fontSize: 24, marginTop: 32, color: "#6b615a" }}>
          Shared report · PII stripped
        </div>
      </div>
    ),
    size
  );
}
