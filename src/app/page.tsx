"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateAudit } from "../lib/audit";
import AiSummary from "./_components/AiSummary";
import LeadCaptureForm from "./_components/LeadCaptureForm";
import { encodeSharePayload } from "../lib/share";

const TOOLS = [
  {
    id: "cursor",
    label: "Cursor",
    plans: ["Hobby", "Pro", "Business", "Enterprise"],
  },
  {
    id: "github-copilot",
    label: "GitHub Copilot",
    plans: ["Individual", "Business", "Enterprise"],
  },
  {
    id: "claude",
    label: "Claude",
    plans: ["Free", "Pro", "Max", "Team", "Enterprise", "API direct"],
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    plans: ["Plus", "Team", "Enterprise", "API direct"],
  },
  {
    id: "anthropic-api",
    label: "Anthropic API direct",
    plans: ["Claude Sonnet 4.6"],
  },
  {
    id: "openai-api",
    label: "OpenAI API direct",
    plans: ["GPT-5.4"],
  },
  {
    id: "gemini",
    label: "Gemini",
    plans: ["Pro", "Ultra", "API"],
  },
  {
    id: "windsurf",
    label: "Windsurf",
    plans: ["Free", "Pro", "Max", "Teams", "Enterprise"],
  },
];

const USE_CASES = [
  "Coding",
  "Writing",
  "Data",
  "Research",
  "Mixed",
];

const STORAGE_KEY = "signalspend.form";

type ToolEntry = {
  plan: string;
  monthlySpend: string;
  seats: string;
};

type FormState = {
  teamSize: string;
  useCase: string;
  usageIntensity: "light" | "moderate" | "heavy";
  optimizationMode: "conservative" | "balanced";
  tools: Record<string, ToolEntry>;
};

export default function Home() {
  const emptyTools = useMemo(() => {
    return TOOLS.reduce<Record<string, ToolEntry>>((acc, tool) => {
      acc[tool.id] = { plan: "", monthlySpend: "", seats: "" };
      return acc;
    }, {});
  }, []);

  const [formState, setFormState] = useState<FormState>({
    teamSize: "",
    useCase: "",
    usageIntensity: "moderate",
    optimizationMode: "balanced",
    tools: emptyTools,
  });

  const [auditResult, setAuditResult] = useState<ReturnType<
    typeof calculateAudit
  > | null>(null);
  const [submittedInput, setSubmittedInput] = useState<any>(null);
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareToastVisible, setShareToastVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as FormState;
      setFormState({
        teamSize: parsed.teamSize ?? "",
        useCase: parsed.useCase ?? "",
        usageIntensity: parsed.usageIntensity ?? "moderate",
        optimizationMode: parsed.optimizationMode ?? "balanced",
        tools: { ...emptyTools, ...(parsed.tools ?? {}) },
      });
    } catch (error) {
      console.warn("Failed to load saved audit data.", error);
    }
  }, [emptyTools]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
  }, [formState]);

  const updateTool = (
    toolId: string,
    field: keyof ToolEntry,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        [toolId]: {
          ...prev.tools[toolId],
          [field]: value,
        },
      },
    }));
  };

  const hasInputs = useMemo(() => {
    return Object.values(formState.tools).some(
      (entry) => entry.plan || entry.monthlySpend || entry.seats
    );
  }, [formState.tools]);

  const formatUsd = (value: number | null) => {
    if (value === null) {
      return "-";
    }

    return `$${value.toFixed(0)}`;
  };

  const formatPct = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const renderLines = (
    title: string,
    items: ReturnType<typeof calculateAudit>["recommendations"]
  ) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-black/5 bg-white p-4">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-3 space-y-4 text-sm text-[color:var(--muted)]">
          {items.map((line, index) => (
            <div
              key={`${line.toolId}-${index}`}
              className="rounded-xl border border-black/5 bg-[#faf7f4] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[color:var(--foreground)]">
                <span className="font-semibold">{line.toolName}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {line.confidence} confidence
                </span>
              </div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">
                Current: {line.currentPlan} · {formatUsd(line.currentMonthlyUsd)}/mo
              </div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">
                Recommended: {line.recommendedPlan ?? "No change"} · {formatUsd(line.recommendedMonthlyUsd)}/mo
              </div>
              <div className="mt-2 text-sm text-[color:var(--foreground)]">
                {line.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const runAudit = () => {
    if (!hasInputs) {
      setHasSubmitted(true);
      setAuditResult(null);
      setSubmittedInput(null);
      setAiSummaryText(null);
      setShareMessage(null);
      return;
    }

    const inputPayload = {
      teamSize: formState.teamSize,
      useCase: formState.useCase,
      usageIntensity: formState.usageIntensity,
      optimizationMode: formState.optimizationMode,
      tools: TOOLS.map((tool) => ({
        toolId: tool.id,
        plan: formState.tools[tool.id]?.plan ?? "",
        monthlySpend: formState.tools[tool.id]?.monthlySpend ?? "",
        seats: formState.tools[tool.id]?.seats ?? "",
      })).filter((tool) => tool.plan || tool.monthlySpend || tool.seats),
    };

    const result = calculateAudit(inputPayload);

    setSubmittedInput(inputPayload);
    setAiSummaryText(null); // reset AI summary on new run
    setAuditResult(result);
    setHasSubmitted(true);
    setShareMessage(null);
  };

  const resetForm = () => {
    setFormState({
      teamSize: "",
      useCase: "",
      usageIntensity: "moderate",
      optimizationMode: "balanced",
      tools: emptyTools,
    });
    setAuditResult(null);
    setHasSubmitted(false);
    setShareMessage(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const shareReport = async () => {
    if (!auditResult) {
      return;
    }

    const payload = {
      teamSize: formState.teamSize || undefined,
      useCase: formState.useCase || undefined,
      usageIntensity: formState.usageIntensity,
      optimizationMode: formState.optimizationMode,
      tools: TOOLS.map((tool) => ({
        toolId: tool.id,
        plan: formState.tools[tool.id]?.plan ?? "",
        monthlySpend: formState.tools[tool.id]?.monthlySpend ?? "",
        seats: formState.tools[tool.id]?.seats ?? "",
      })).filter((tool) => tool.plan || tool.monthlySpend || tool.seats),
    };

    setShareMessage("Saving report snapshot...");
    setShareToastVisible(true);

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          audit: auditResult,
          aiSummary: aiSummaryText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save report.");
      }

      const data = await response.json();
      const url = `${window.location.origin}/report/${data.id}`;

      await navigator.clipboard.writeText(url);
      setShareMessage("Audit link copied!");
    } catch {
      // Fallback to legacy encoded payload if the DB isn't configured
      const legacyPayload = {
        ...payload,
        ...(aiSummaryText ? { aiSummary: aiSummaryText } : {}),
      };
      const id = encodeSharePayload(legacyPayload);
      const url = `${window.location.origin}/report/${id}`;
      
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage("Audit link copied (offline mode)");
      } catch {
        setShareMessage("Copy failed. Check console.");
        console.log("Share URL:", url);
      }
    }

    window.setTimeout(() => {
      setShareToastVisible(false);
    }, 2500);
  };

  const exportPdf = () => {
    if (!auditResult) {
      return;
    }

    const payload = {
      teamSize: formState.teamSize || undefined,
      useCase: formState.useCase || undefined,
      usageIntensity: formState.usageIntensity,
      optimizationMode: formState.optimizationMode,
      tools: TOOLS.map((tool) => ({
        toolId: tool.id,
        plan: formState.tools[tool.id]?.plan ?? "",
        monthlySpend: formState.tools[tool.id]?.monthlySpend ?? "",
        seats: formState.tools[tool.id]?.seats ?? "",
      })).filter((tool) => tool.plan || tool.monthlySpend || tool.seats),
      ...(aiSummaryText ? { aiSummary: aiSummaryText } : {}),
    };

    const id = encodeSharePayload(payload);
    const url = `${window.location.origin}/report/${id}?print=1`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      setShareMessage("Pop-up blocked. Use Share audit to copy the link.");
      setShareToastVisible(true);
      window.setTimeout(() => {
        setShareToastVisible(false);
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff2e6,_transparent_45%),radial-gradient(circle_at_15%_30%,_#d7f4ee,_transparent_42%),linear-gradient(180deg,_#f7f3ef,_#f1ebe6_60%,_#ede6df)] px-6 pb-20 pt-10 text-[color:var(--foreground)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[color:var(--accent-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Credex
            </span>
            <span className="text-sm text-[color:var(--muted)]">
              SignalSpend audit
            </span>
          </div>
          <div className="text-xs text-[color:var(--muted)]">
            No login. Results first. Email after.
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-5xl">
              Find the hidden leaks in your AI tool spend.
            </h1>
            <p className="max-w-xl text-lg text-[color:var(--muted)]">
              SignalSpend compares your plans, seat counts, and usage patterns
              against current pricing to surface better fits and real savings.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,106,61,0.2)]">
                Start free audit
              </button>
              <button className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                See sample report
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,107,95,0.15)]">
            <h2 className="font-[var(--font-display)] text-2xl font-semibold">
              What you get in 90 seconds
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
              <li>Plan fit check for every tool.</li>
              <li>Cheaper alternatives with comparable capability.</li>
              <li>Credits vs retail savings if Credex can source it.</li>
              <li>Instant monthly + annual savings estimate.</li>
            </ul>
            <div className="mt-6 rounded-2xl bg-[color:var(--accent-strong)]/10 p-4 text-sm text-[color:var(--accent-strong)]">
              High-savings reports get a direct line to Credex inventory.
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-white/90 p-8 shadow-[0_30px_80px_rgba(29,26,23,0.08)]">
          <h2 className="font-[var(--font-display)] text-2xl font-semibold">
            Tell us what you pay for
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Fill this out once. We keep it on this device so you do not lose
            your work.
          </p>

          <form
            className="mt-8 space-y-8"
            onSubmit={(event) => {
              event.preventDefault();
              runAudit();
            }}
          >
            <div className="grid gap-6 md:grid-cols-3">
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Team size</span>
                <input
                  type="number"
                  min={1}
                  placeholder="12"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  value={formState.teamSize}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      teamSize: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm md:col-span-2">
                <span className="font-semibold">Primary use case</span>
                <select
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  value={formState.useCase}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      useCase: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a use case</option>
                  {USE_CASES.map((item) => (
                    <option key={item} value={item.toLowerCase()}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Usage intensity</span>
                <select
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  value={formState.usageIntensity}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      usageIntensity: event.target.value as
                        | "light"
                        | "moderate"
                        | "heavy",
                    }))
                  }
                >
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Optimization mode</span>
                <select
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  value={formState.optimizationMode}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      optimizationMode: event.target.value as
                        | "conservative"
                        | "balanced",
                    }))
                  }
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                </select>
              </label>
            </div>

            <div className="space-y-5">
              {TOOLS.map((tool) => (
                <div
                  key={tool.id}
                  className="grid gap-4 rounded-2xl border border-black/5 bg-[#faf7f4] p-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.6fr]"
                >
                  <div className="font-semibold text-[color:var(--foreground)]">
                    {tool.label}
                  </div>
                  <label className="space-y-2 text-sm">
                    <span className="text-[color:var(--muted)]">Plan</span>
                    <select
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                      value={formState.tools[tool.id]?.plan ?? ""}
                      onChange={(event) =>
                        updateTool(tool.id, "plan", event.target.value)
                      }
                    >
                      <option value="">Select plan</option>
                      {tool.plans.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[color:var(--muted)]">
                      Monthly spend
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      placeholder="$0"
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                      value={formState.tools[tool.id]?.monthlySpend ?? ""}
                      onChange={(event) =>
                        updateTool(tool.id, "monthlySpend", event.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[color:var(--muted)]">Seats</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      placeholder="0"
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                      value={formState.tools[tool.id]?.seats ?? ""}
                      onChange={(event) =>
                        updateTool(tool.id, "seats", event.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,106,61,0.2)]"
              >
                Generate audit report
              </button>
              <button
                type="button"
                className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-[color:var(--foreground)]"
                onClick={resetForm}
              >
                Reset form
              </button>
              <span className="text-sm text-[color:var(--muted)]">
                Report updates only when you submit.
              </span>
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-white/90 p-8 shadow-[0_30px_80px_rgba(29,26,23,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-[var(--font-display)] text-2xl font-semibold">
                Audit summary
              </h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Generated after you submit your inputs.
              </p>
              {auditResult && (
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Anyone with the link can view this audit.
                </p>
              )}
            </div>
            {auditResult && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full bg-[color:var(--accent-strong)]/10 px-4 py-2 text-sm text-[color:var(--accent-strong)]">
                  {auditResult.summary.credexRecommended
                    ? "Credex-ready savings detected"
                    : "Credex review not required yet"}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={shareReport}
                    disabled={!aiSummaryText}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] disabled:opacity-50"
                  >
                    Share audit
                  </button>
                  <button
                    type="button"
                    onClick={exportPdf}
                    disabled={!aiSummaryText}
                    className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--muted)] disabled:opacity-50"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          {shareMessage && shareToastVisible && (
            <div className="pointer-events-none fixed bottom-6 right-6 z-50">
              <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-[0_12px_30px_rgba(15,107,95,0.18)]">
                {shareMessage}
              </div>
            </div>
          )}

          {!hasSubmitted ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-sm text-[color:var(--muted)]">
              Fill out the form, then generate a report.
            </div>
          ) : !hasInputs || !auditResult ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-sm text-[color:var(--muted)]">
              Add at least one tool to generate a savings summary.
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/5 bg-[#faf7f4] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      Current spend
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatUsd(auditResult.summary.totalMonthlyUsd)}/mo
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">
                      {formatUsd(auditResult.summary.totalAnnualUsd)}/yr
                    </div>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-[#faf7f4] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      Estimated savings
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[color:var(--accent-strong)]">
                      {formatUsd(auditResult.summary.totalSavingsMonthlyUsd)}/mo
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">
                      {formatUsd(auditResult.summary.totalSavingsAnnualUsd)}/yr · {formatPct(auditResult.summary.savingsPctOfSpend)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-4">
                  <div className="text-sm font-semibold">Benchmarks</div>
                  <div className="mt-2 text-sm text-[color:var(--muted)]">
                    {auditResult.benchmarks.note}
                  </div>
                  {auditResult.benchmarks.spendPerDeveloperMonthlyUsd !== null && (
                    <div className="mt-3 text-sm">
                      Spend per developer: {formatUsd(auditResult.benchmarks.spendPerDeveloperMonthlyUsd)}/mo
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm">
                  <div className="font-semibold">Credex guidance</div>
                  <p className="mt-2 text-[color:var(--muted)]">
                    {auditResult.summary.credexReason}
                  </p>
                </div>
                <AiSummary
                  audit={auditResult}
                  input={submittedInput}
                  onSummaryReady={setAiSummaryText}
                />
              </div>

              <div className="space-y-4">
                {renderLines("Recommendations", auditResult.recommendations)}
                {renderLines("Warnings", auditResult.warnings)}
                {renderLines("Overlap flags", auditResult.overlaps)}
                {renderLines("Insights", auditResult.insights)}
              </div>
              
              <LeadCaptureForm auditResult={auditResult} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
