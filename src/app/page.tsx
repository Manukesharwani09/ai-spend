"use client";

import { useEffect, useMemo, useState } from "react";

const TOOLS = [
  {
    id: "cursor",
    label: "Cursor",
    plans: ["Hobby", "Pro", "Business", "Enterprise"],
  },
  {
    id: "copilot",
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
    tools: emptyTools,
  });

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

          <form className="mt-8 space-y-8">
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
          </form>
        </section>
      </main>
    </div>
  );
}
