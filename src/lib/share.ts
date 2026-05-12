import type { AuditInput } from "./audit";

type ShareableAuditInput = Pick<
  AuditInput,
  "teamSize" | "useCase" | "usageIntensity" | "optimizationMode" | "tools"
>;

const toBase64Url = (value: string) => {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const padded = value.length % 4 === 0
    ? value
    : value + "=".repeat(4 - (value.length % 4));
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");

  if (typeof window === "undefined") {
    return Buffer.from(base64, "base64").toString("utf-8");
  }

  return atob(base64);
};

export const encodeSharePayload = (payload: ShareableAuditInput) => {
  return toBase64Url(JSON.stringify(payload));
};

export const decodeSharePayload = (encoded: string) => {
  const json = fromBase64Url(encoded);
  return JSON.parse(json) as ShareableAuditInput;
};

export type { ShareableAuditInput };
