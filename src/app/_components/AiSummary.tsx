"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuditInput, AuditResult } from "../../lib/audit";
import { buildFallbackSummary } from "../../lib/summary";

type AiSummaryProps = {
  input: AuditInput;
  audit: AuditResult;
  initialSummary?: string;
  onSummaryReady?: (summary: string) => void;
};

type SummaryState = {
  status: "idle" | "loading" | "ready" | "fallback";
  text: string;
};

export default function AiSummary({ input, audit, initialSummary, onSummaryReady }: AiSummaryProps) {
  const fallback = useMemo(
    () => buildFallbackSummary({ audit, input }),
    [audit, input]
  );
  const [state, setState] = useState<SummaryState>({
    status: initialSummary ? "ready" : "idle",
    text: initialSummary || "Generating summary...",
  });

  useEffect(() => {
    if (initialSummary) {
      if (onSummaryReady) onSummaryReady(initialSummary);
      return;
    }

    let cancelled = false;
    const fetchSummary = async () => {
      setState({ status: "loading", text: "Generating summary..." });

      try {
        const response = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });
        const data = (await response.json()) as {
          summary?: string;
          source?: string;
        };

        if (!cancelled && data.summary) {
          setState({
            status: data.source !== "fallback" ? "ready" : "fallback",
            text: data.summary,
          });
          if (onSummaryReady) onSummaryReady(data.summary);
        }
      } catch {
        if (!cancelled) {
          setState({ status: "fallback", text: fallback });
          if (onSummaryReady) onSummaryReady(fallback);
        }
      }
    };

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [fallback, input, initialSummary, onSummaryReady]);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">AI summary</div>
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
          {state.status === "loading" || state.status === "idle" ? "Generating..." : state.status === "ready" ? "AI generated" : "Summary"}
        </span>
      </div>
      <p className="mt-3 text-sm text-[color:var(--muted)]">{state.text}</p>
    </div>
  );
}
