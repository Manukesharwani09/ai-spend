import { PRICING_DATA, PricingPlan } from "./PRICING_DATA";

type ToolEntryInput = {
  toolId: string;
  plan: string;
  monthlySpend?: string;
  seats?: string;
};

type AuditInput = {
  teamSize?: string;
  useCase?: string;
  tools: ToolEntryInput[];
};

type AuditLine = {
  toolId: string;
  toolName: string;
  currentPlan: string;
  currentMonthlyUsd: number | null;
  recommendedPlan: string | null;
  recommendedMonthlyUsd: number | null;
  savingsMonthlyUsd: number | null;
  confidence: "high" | "medium" | "low";
  reason: string;
};

type AuditSummary = {
  totalMonthlyUsd: number;
  totalAnnualUsd: number;
  totalSavingsMonthlyUsd: number;
  totalSavingsAnnualUsd: number;
  savingsPctOfSpend: number;
  overlapSavingsMonthlyUsd: number;
  credexRecommended: boolean;
  credexReason: string;
};

type AuditResult = {
  summary: AuditSummary;
  lines: AuditLine[];
  overlaps: string[];
  benchmarks: {
    spendPerDeveloperMonthlyUsd: number | null;
    typicalRangeMonthlyUsd: { low: number; high: number } | null;
    note: string;
  };
};

type UseCase = "coding" | "writing" | "data" | "research" | "mixed" | "";

type CandidatePlan = {
  toolId: string;
  toolName: string;
  plan: PricingPlan;
  monthly: number | null;
};

const PLAN_LABEL_MAP: Record<string, Record<string, string>> = {
  cursor: {
    Hobby: "cursor-hobby",
    Pro: "cursor-pro",
    Business: "cursor-business",
    Enterprise: "cursor-enterprise",
  },
  "github-copilot": {
    Individual: "copilot-individual",
    Business: "copilot-business",
    Enterprise: "copilot-enterprise",
  },
  claude: {
    Free: "claude-free",
    Pro: "claude-pro",
    Max: "claude-max",
    Team: "claude-team",
    Enterprise: "claude-enterprise",
    "API direct": "claude-api",
  },
  chatgpt: {
    Plus: "chatgpt-plus",
    Team: "chatgpt-team",
    Enterprise: "chatgpt-enterprise",
    "API direct": "chatgpt-api",
  },
  "anthropic-api": {
    "Claude Sonnet 4.6": "anthropic-sonnet-46",
  },
  "openai-api": {
    "GPT-5.4": "openai-gpt-54",
  },
  gemini: {
    Pro: "gemini-pro",
    Ultra: "gemini-ultra",
    API: "gemini-api",
  },
  windsurf: {
    Free: "windsurf-free",
    Pro: "windsurf-pro",
    Max: "windsurf-max",
    Teams: "windsurf-teams",
    Enterprise: "windsurf-enterprise",
  },
};

const EXCLUDED_PLANS = ["Enterprise", "Custom"];

const TOOL_CATEGORIES: Record<string, UseCase> = {
  cursor: "coding",
  "github-copilot": "coding",
  windsurf: "coding",
  claude: "writing",
  chatgpt: "writing",
  gemini: "writing",
  "anthropic-api": "writing",
  "openai-api": "writing",
};

const CATEGORY_ALTERNATIVES: Record<UseCase, string[]> = {
  coding: ["cursor", "github-copilot", "windsurf"],
  writing: ["claude", "chatgpt", "gemini"],
  data: ["chatgpt", "gemini", "claude"],
  research: ["claude", "chatgpt", "gemini"],
  mixed: [
    "cursor",
    "github-copilot",
    "windsurf",
    "claude",
    "chatgpt",
    "gemini",
  ],
  "": [],
};

const OVERLAP_RULES = [
  {
    label: "Cursor + GitHub Copilot",
    toolIds: ["cursor", "github-copilot"],
    reason:
      "Two coding assistants overlap on completions and chat. Standardize on one to avoid double-paying for the same workflow.",
  },
  {
    label: "Claude Team + ChatGPT Team",
    toolIds: ["claude", "chatgpt"],
    reason:
      "Both team chat suites cover similar writing and research workloads. Consolidating seats typically trims spend without reducing capability.",
  },
  {
    label: "Multiple premium coding assistants",
    toolIds: ["cursor", "github-copilot", "windsurf"],
    reason:
      "Multiple premium coding copilots are usually redundant. Pick the one with the best adoption and drop the rest.",
  },
];

const BENCHMARKS_BY_TEAM_SIZE = [
  { max: 5, low: 15, high: 60 },
  { max: 20, low: 25, high: 90 },
  { max: 50, low: 35, high: 120 },
  { max: 200, low: 50, high: 160 },
  { max: 1000, low: 60, high: 200 },
];

const parseNumber = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
};

const formatUsd = (value: number | null) => {
  if (value === null) {
    return "unknown";
  }

  return `$${value.toFixed(0)}`;
};

const getToolPricing = (toolId: string) => {
  return PRICING_DATA.find((tool) => tool.toolId === toolId) ?? null;
};

const resolvePlan = (toolId: string, planLabel: string) => {
  const planId = PLAN_LABEL_MAP[toolId]?.[planLabel];
  if (!planId) {
    return null;
  }

  const toolPricing = getToolPricing(toolId);
  return toolPricing?.plans.find((plan) => plan.id === planId) ?? null;
};

const estimatePlanCost = (
  plan: PricingPlan,
  seats: number,
  monthlySpend: number | null
) => {
  if (monthlySpend !== null) {
    return monthlySpend;
  }

  const seatCount = Math.max(seats, 1);

  if (plan.pricingModel === "free") {
    return 0;
  }

  if (plan.pricingModel === "usage") {
    return null;
  }

  if (plan.pricingModel === "per-seat") {
    return plan.perSeatMonthlyUsd ? plan.perSeatMonthlyUsd * seatCount : null;
  }

  if (plan.pricingModel === "flat") {
    return plan.monthlyUsd ? plan.monthlyUsd * seatCount : null;
  }

  return null;
};

const isTeamPlan = (plan: PricingPlan) =>
  /(team|business|teams)/i.test(plan.label);

const isEnterprisePlan = (plan: PricingPlan) =>
  /(enterprise|custom)/i.test(plan.label);

const isApiPlan = (plan: PricingPlan) =>
  plan.pricingModel === "usage" || /api/i.test(plan.label);

const buildCandidates = (toolId: string, seats: number) => {
  const toolPricing = getToolPricing(toolId);
  if (!toolPricing) {
    return [];
  }

  const seatCount = Math.max(seats, 1);
  return toolPricing.plans
    .filter((plan) => !isEnterprisePlan(plan))
    .map((plan) => ({
      toolId,
      toolName: toolPricing.toolName,
      plan,
      monthly: estimatePlanCost(plan, seatCount, null),
    }))
    .filter((candidate) => candidate.monthly !== null);
};

const findCheapestPlan = (toolId: string, seats: number) => {
  const candidates = buildCandidates(toolId, seats);
  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((a, b) => (a.monthly ?? 0) - (b.monthly ?? 0))[0];
};

const findCheaperPlan = (
  toolId: string,
  seats: number,
  currentMonthlyUsd: number | null
) => {
  const toolPricing = getToolPricing(toolId);
  if (!toolPricing || currentMonthlyUsd === null) {
    return null;
  }

  const seatCount = Math.max(seats, 1);
  const candidates = toolPricing.plans.filter((plan) => {
    if (plan.pricingModel === "custom") {
      return false;
    }

    if (EXCLUDED_PLANS.some((label) => plan.label.includes(label))) {
      return false;
    }

    if (seatCount <= 2 && isTeamPlan(plan)) {
      return false;
    }

    return true;
  });

  const ranked = candidates
    .map((plan) => ({
      plan,
      monthly: estimatePlanCost(plan, seatCount, null),
    }))
    .filter((item) => item.monthly !== null)
    .sort((a, b) => (a.monthly ?? 0) - (b.monthly ?? 0));

  const best = ranked[0];
  if (!best || best.monthly === null) {
    return null;
  }

  if (best.monthly >= currentMonthlyUsd - 5) {
    return null;
  }

  return best;
};

const findAlternativePlan = (
  toolId: string,
  useCase: UseCase,
  seats: number,
  currentMonthlyUsd: number | null
) => {
  if (currentMonthlyUsd === null) {
    return null;
  }

  const category = useCase || TOOL_CATEGORIES[toolId] || "mixed";
  const alternatives = CATEGORY_ALTERNATIVES[category] ?? [];

  const candidates = alternatives
    .filter((altId) => altId !== toolId)
    .flatMap((altId) => buildCandidates(altId, seats))
    .filter((candidate) => !isApiPlan(candidate.plan));

  if (candidates.length === 0) {
    return null;
  }

  const best = candidates.sort(
    (a, b) => (a.monthly ?? 0) - (b.monthly ?? 0)
  )[0];

  if (!best || best.monthly === null) {
    return null;
  }

  const savings = currentMonthlyUsd - best.monthly;
  if (savings < 20 || savings / currentMonthlyUsd < 0.15) {
    return null;
  }

  return best;
};

const detectOverlaps = (tools: ToolEntryInput[]) => {
  const activeToolIds = new Set(
    tools.filter((tool) => tool.plan).map((tool) => tool.toolId)
  );

  return OVERLAP_RULES.filter((rule) =>
    rule.toolIds.every((toolId) => activeToolIds.has(toolId))
  );
};

const getBenchmarkRange = (teamSize: number | null) => {
  if (!teamSize || teamSize <= 0) {
    return null;
  }

  return (
    BENCHMARKS_BY_TEAM_SIZE.find((range) => teamSize <= range.max) ??
    BENCHMARKS_BY_TEAM_SIZE[BENCHMARKS_BY_TEAM_SIZE.length - 1]
  );
};

const buildApiSpendGuidance = (toolName: string) => {
  return `Usage-based pricing for ${toolName} is hard to optimize without monthly token volumes. Add input/output tokens so we can compare cost per 1M tokens and flag cheaper providers.`;
};

const confidenceForLine = (args: {
  hasExactPricing: boolean;
  usesMonthlySpend: boolean;
  recommendationType: "same-plan" | "cheaper-plan" | "alternative" | "overlap";
}) => {
  if (args.recommendationType === "overlap") {
    return "medium";
  }

  if (args.hasExactPricing && args.recommendationType === "cheaper-plan") {
    return "high";
  }

  if (args.usesMonthlySpend) {
    return "medium";
  }

  return "low";
};

export const calculateAudit = (input: AuditInput): AuditResult => {
  const lines: AuditLine[] = [];
  const useCase = (input.useCase ?? "") as UseCase;
  const teamSize = parseNumber(input.teamSize) ?? null;
  const overlaps = detectOverlaps(input.tools);

  input.tools.forEach((tool) => {
    if (!tool.plan && !tool.monthlySpend && !tool.seats) {
      return;
    }

    const toolPricing = getToolPricing(tool.toolId);
    const plan = tool.plan ? resolvePlan(tool.toolId, tool.plan) : null;
    if (!toolPricing || !plan) {
      return;
    }

    const seats = parseNumber(tool.seats) ?? 1;
    const monthlySpend = parseNumber(tool.monthlySpend);
    const currentMonthlyUsd = estimatePlanCost(plan, seats, monthlySpend);
    const cheaper = findCheaperPlan(tool.toolId, seats, currentMonthlyUsd);

    if (cheaper) {
      const reasonParts = [];
      if (isTeamPlan(plan) && seats <= 2) {
        reasonParts.push("Team pricing is overkill for a small seat count.");
      }
      if (currentMonthlyUsd !== null && cheaper.monthly !== null) {
        reasonParts.push(
          `List price for ${cheaper.plan.label} is ${formatUsd(
            cheaper.monthly
          )}/mo for ${Math.max(seats, 1)} seats.`
        );
      }

      lines.push({
        toolId: tool.toolId,
        toolName: toolPricing.toolName,
        currentPlan: plan.label,
        currentMonthlyUsd,
        recommendedPlan: cheaper.plan.label,
        recommendedMonthlyUsd: cheaper.monthly,
        savingsMonthlyUsd:
          currentMonthlyUsd !== null && cheaper.monthly !== null
            ? currentMonthlyUsd - cheaper.monthly
            : null,
        confidence: confidenceForLine({
          hasExactPricing: cheaper.monthly !== null,
          usesMonthlySpend: monthlySpend !== null,
          recommendationType: "cheaper-plan",
        }),
        reason: reasonParts.join(" ") ||
          `${cheaper.plan.label} is cheaper for your seat count at ${formatUsd(
            cheaper.monthly
          )}/mo.`,
      });
      return;
    }

    if (monthlySpend !== null && currentMonthlyUsd !== null) {
      const delta = monthlySpend - currentMonthlyUsd;
      if (delta > Math.max(10, currentMonthlyUsd * 0.1)) {
        lines.push({
          toolId: tool.toolId,
          toolName: toolPricing.toolName,
          currentPlan: plan.label,
          currentMonthlyUsd,
          recommendedPlan: plan.label,
          recommendedMonthlyUsd: currentMonthlyUsd,
          savingsMonthlyUsd: delta,
          confidence: confidenceForLine({
            hasExactPricing: true,
            usesMonthlySpend: true,
            recommendationType: "same-plan",
          }),
          reason: `Your billed spend is about ${formatUsd(
            delta
          )}/mo above the list price for ${plan.label}.`,
        });
        return;
      }
    }

    const alternative = findAlternativePlan(
      tool.toolId,
      useCase,
      seats,
      currentMonthlyUsd
    );

    if (alternative) {
      lines.push({
        toolId: tool.toolId,
        toolName: toolPricing.toolName,
        currentPlan: plan.label,
        currentMonthlyUsd,
        recommendedPlan: `${alternative.toolName} ${alternative.plan.label}`,
        recommendedMonthlyUsd: alternative.monthly,
        savingsMonthlyUsd:
          currentMonthlyUsd !== null && alternative.monthly !== null
            ? currentMonthlyUsd - alternative.monthly
            : null,
        confidence: confidenceForLine({
          hasExactPricing: alternative.monthly !== null,
          usesMonthlySpend: monthlySpend !== null,
          recommendationType: "alternative",
        }),
        reason: `Comparable ${useCase || "general"} capability at a lower list price (${formatUsd(
          alternative.monthly
        )}/mo).`,
      });
      return;
    }

    if (isApiPlan(plan)) {
      lines.push({
        toolId: tool.toolId,
        toolName: toolPricing.toolName,
        currentPlan: plan.label,
        currentMonthlyUsd,
        recommendedPlan: null,
        recommendedMonthlyUsd: null,
        savingsMonthlyUsd: 0,
        confidence: "low",
        reason:
          buildApiSpendGuidance(toolPricing.toolName),
      });
      return;
    }

    lines.push({
      toolId: tool.toolId,
      toolName: toolPricing.toolName,
      currentPlan: plan.label,
      currentMonthlyUsd,
      recommendedPlan: null,
      recommendedMonthlyUsd: null,
      savingsMonthlyUsd: 0,
      confidence: confidenceForLine({
        hasExactPricing: currentMonthlyUsd !== null,
        usesMonthlySpend: monthlySpend !== null,
        recommendationType: "same-plan",
      }),
      reason: "Current plan appears aligned with your team size.",
    });
  });

  overlaps.forEach((overlap) => {
    lines.push({
      toolId: "overlap",
      toolName: "Overlap",
      currentPlan: overlap.label,
      currentMonthlyUsd: null,
      recommendedPlan: "Consolidate",
      recommendedMonthlyUsd: null,
      savingsMonthlyUsd: null,
      confidence: confidenceForLine({
        hasExactPricing: false,
        usesMonthlySpend: false,
        recommendationType: "overlap",
      }),
      reason: overlap.reason,
    });
  });

  const totalMonthlyUsd = lines.reduce(
    (sum, line) => sum + (line.currentMonthlyUsd ?? 0),
    0
  );
  const totalSavingsMonthlyUsd = lines.reduce(
    (sum, line) => sum + (line.savingsMonthlyUsd ?? 0),
    0
  );
  const overlapSavingsMonthlyUsd = overlaps.length > 0
    ? Math.min(150, totalMonthlyUsd * 0.05)
    : 0;
  const savingsPctOfSpend = totalMonthlyUsd > 0
    ? totalSavingsMonthlyUsd / totalMonthlyUsd
    : 0;

  const benchmarkRange = getBenchmarkRange(teamSize);
  const spendPerDeveloperMonthlyUsd =
    teamSize && teamSize > 0 ? totalMonthlyUsd / teamSize : null;
  const benchmarkNote = benchmarkRange
    ? `Typical AI spend for teams your size sits between ${formatUsd(
        benchmarkRange.low
      )} and ${formatUsd(benchmarkRange.high)} per developer per month.`
    : "Add team size to benchmark your AI spend per developer.";

  const credexRecommended =
    totalSavingsMonthlyUsd >= 500 ||
    overlapSavingsMonthlyUsd >= 100 ||
    (totalMonthlyUsd >= 1000 && savingsPctOfSpend >= 0.2);
  const credexReason = credexRecommended
    ? "Savings are material enough to justify a Credex credit quote and procurement review."
    : "Savings are modest. Keep monitoring, and we will notify you when pricing changes unlock more value.";

  return {
    summary: {
      totalMonthlyUsd,
      totalAnnualUsd: totalMonthlyUsd * 12,
      totalSavingsMonthlyUsd,
      totalSavingsAnnualUsd: totalSavingsMonthlyUsd * 12,
      savingsPctOfSpend,
      overlapSavingsMonthlyUsd,
      credexRecommended,
      credexReason,
    },
    lines,
    overlaps: overlaps.map((overlap) => overlap.reason),
    benchmarks: {
      spendPerDeveloperMonthlyUsd,
      typicalRangeMonthlyUsd: benchmarkRange
        ? { low: benchmarkRange.low, high: benchmarkRange.high }
        : null,
      note: benchmarkNote,
    },
  };
};
