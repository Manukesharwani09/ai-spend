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
  usageIntensity?: "light" | "moderate" | "heavy";
  optimizationMode?: "conservative" | "balanced";
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
type TeamMaturity = "solo" | "early" | "growing" | "mature";
type DowngradeDecision = "safe" | "aggressive" | "not-recommended";

type CandidatePlan = {
  toolId: string;
  toolName: string;
  plan: PricingPlan;
  monthly: number | null;
  tier: CapabilityTier;
};

type CapabilityTier = 0 | 1 | 2 | 3;

type TierRule = {
  tier: CapabilityTier;
  labels: string[];
};

const CAPABILITY_TIERS: TierRule[] = [
  { tier: 0, labels: ["free", "hobby"] },
  { tier: 1, labels: ["pro", "plus", "individual"] },
  { tier: 2, labels: ["team", "business", "teams"] },
  { tier: 3, labels: ["enterprise", "custom"] },
];

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
    severity: 3,
    category: "coding",
    reason:
      "Two coding assistants overlap on completions and chat. Standardize on one to avoid double-paying for the same workflow.",
  },
  {
    label: "Cursor + Windsurf",
    toolIds: ["cursor", "windsurf"],
    severity: 3,
    category: "coding",
    reason:
      "Multiple premium coding assistants may duplicate core completion and chat workflows across the same engineering team.",
  },
  {
    label: "Claude Team + ChatGPT Team",
    toolIds: ["claude", "chatgpt"],
    severity: 2,
    category: "writing",
    reason:
      "Both team chat suites cover similar writing and research workloads. Consolidating seats typically trims spend without reducing capability.",
  },
  {
    label: "Multiple premium coding assistants",
    toolIds: ["cursor", "github-copilot", "windsurf"],
    severity: 2,
    category: "coding",
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

const estimatePlanCost = (plan: PricingPlan, seats: number) => {

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

const estimateReportedOrList = (
  plan: PricingPlan,
  seats: number,
  reportedSpend: number | null
) => {
  if (reportedSpend !== null) {
    return reportedSpend;
  }

  return estimatePlanCost(plan, seats);
};

const isTeamPlan = (plan: PricingPlan) =>
  /(team|business|teams)/i.test(plan.label);

const isEnterprisePlan = (plan: PricingPlan) =>
  /(enterprise|custom)/i.test(plan.label);

const isApiPlan = (plan: PricingPlan) =>
  plan.pricingModel === "usage" || /api/i.test(plan.label);

const getTierForLabel = (label: string): CapabilityTier => {
  const normalized = label.toLowerCase();
  for (const rule of CAPABILITY_TIERS) {
    if (rule.labels.some((token) => normalized.includes(token))) {
      return rule.tier;
    }
  }

  return 1;
};

const getTeamMaturity = (teamSize: number | null): TeamMaturity => {
  if (!teamSize || teamSize <= 1) return "solo";
  if (teamSize <= 4) return "early";
  if (teamSize <= 12) return "growing";
  return "mature";
};

const isLowRiskFreeTier = (args: {
  seats: number;
  teamSize: number | null;
  usageIntensity: "light" | "moderate" | "heavy";
  useCase: UseCase;
}) => {
  const { seats, teamSize, usageIntensity, useCase } = args;
  if (seats !== 1) return false;
  if (teamSize !== null && teamSize > 1) return false;
  if (usageIntensity !== "light") return false;
  if (useCase === "coding") return false;
  return true;
};

const shouldKeepTeamPlan = (args: {
  seats: number;
  teamSize: number | null;
  usageIntensity: "light" | "moderate" | "heavy";
  useCase: UseCase;
}) => {
  const { seats, teamSize, usageIntensity, useCase } = args;
  if (seats >= 10) return true;
  if (seats >= 5) return true;
  if (teamSize !== null && teamSize >= 8) return true;
  if (usageIntensity === "heavy" && useCase === "coding") return true;
  return false;
};

const downgradeDecision = (args: {
  currentTier: CapabilityTier;
  seats: number;
  teamSize: number | null;
  usageIntensity: "light" | "moderate" | "heavy";
  useCase: UseCase;
}) => {
  const { currentTier, seats, teamSize, usageIntensity, useCase } = args;
  if (currentTier < 2) return "safe" as DowngradeDecision;
  if (shouldKeepTeamPlan({ seats, teamSize, usageIntensity, useCase })) {
    return "not-recommended";
  }
  if (seats <= 2) return "safe";
  if (seats <= 5 && usageIntensity !== "heavy") return "safe";
  return "aggressive";
};

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
      monthly: estimatePlanCost(plan, seatCount),
      tier: getTierForLabel(plan.label),
    }))
    .filter((candidate) => candidate.monthly !== null);
};

const findComparablePlan = (
  toolId: string,
  seats: number,
  currentMonthlyUsd: number | null,
  currentTier: CapabilityTier,
  usageIntensity: "light" | "moderate" | "heavy",
  allowFreeTier: boolean
) => {
  const toolPricing = getToolPricing(toolId);
  if (!toolPricing || currentMonthlyUsd === null) {
    return null;
  }

  const seatCount = Math.max(seats, 1);
  const minimumTier: CapabilityTier = currentTier === 3
    ? 2
    : currentTier === 0
    ? 0
    : ((currentTier - 1) as CapabilityTier);
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

    const tier = getTierForLabel(plan.label);
    if (!allowFreeTier && tier === 0 && currentTier >= 1) {
      return false;
    }

    if (tier < minimumTier) {
      return false;
    }

    return true;
  });

  const ranked = candidates
    .map((plan) => ({
      plan,
      monthly: estimatePlanCost(plan, seatCount),
      tier: getTierForLabel(plan.label),
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
  currentMonthlyUsd: number | null,
  currentTier: CapabilityTier
) => {
  if (currentMonthlyUsd === null) {
    return null;
  }

  const category = useCase || TOOL_CATEGORIES[toolId] || "mixed";
  const alternatives = CATEGORY_ALTERNATIVES[category] ?? [];

  const candidates = alternatives
    .filter((altId) => altId !== toolId)
    .flatMap((altId) => buildCandidates(altId, seats))
    .filter((candidate) =>
      !isApiPlan(candidate.plan) && candidate.tier >= currentTier - 1
    );

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
  const minSavings = useCase === "mixed" ? 40 : 20;
  const minPct = useCase === "mixed" ? 0.25 : 0.15;
  if (savings < minSavings || savings / currentMonthlyUsd < minPct) {
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

const groupOverlaps = (overlaps: typeof OVERLAP_RULES) => {
  const hasCoding = overlaps.some((overlap) => overlap.category === "coding");
  const hasWriting = overlaps.some((overlap) => overlap.category === "writing");
  const grouped: typeof OVERLAP_RULES = [];

  if (hasCoding) {
    grouped.push({
      label: "Multiple premium coding assistants",
      toolIds: [],
      severity: 3,
      category: "coding",
      reason:
        "Multiple premium coding assistants may duplicate completion and chat workflows across the same engineering team.",
    });
  }

  if (hasWriting) {
    grouped.push({
      label: "Overlapping chat suites",
      toolIds: [],
      severity: 2,
      category: "writing",
      reason:
        "Multiple team chat suites can overlap for writing and research workflows. Consolidate seats where adoption is lowest.",
    });
  }

  return grouped.length > 0 ? grouped : overlaps;
};

const estimateOverlapSavings = (
  overlaps: typeof OVERLAP_RULES,
  toolMonthlySpend: Record<string, number | null>
) => {
  const overlapToolIds = new Set<string>();
  overlaps.forEach((overlap) => {
    overlap.toolIds.forEach((toolId) => overlapToolIds.add(toolId));
  });

  let overlapSpend = 0;
  overlapToolIds.forEach((toolId) => {
    overlapSpend += toolMonthlySpend[toolId] ?? 0;
  });

  const averageSeverity = overlaps.length
    ? overlaps.reduce((sum, overlap) => sum + overlap.severity, 0) /
      overlaps.length
    : 0;
  const severityMultiplier = averageSeverity >= 3 ? 0.55 : 0.4;

  return Math.round(overlapSpend * severityMultiplier);
};

const findEnterpriseDowngrade = (
  toolId: string,
  seats: number
) => {
  const toolPricing = getToolPricing(toolId);
  if (!toolPricing) {
    return null;
  }

  const seatCount = Math.max(seats, 1);
  const candidates = toolPricing.plans.filter((plan) => {
    const tier = getTierForLabel(plan.label);
    return tier === 2 && !isApiPlan(plan);
  });

  const ranked = candidates
    .map((plan) => ({
      plan,
      monthly: estimatePlanCost(plan, seatCount),
      tier: getTierForLabel(plan.label),
    }))
    .filter((item) => item.monthly !== null)
    .sort((a, b) => (a.monthly ?? 0) - (b.monthly ?? 0));

  return ranked[0] ?? null;
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
  return `Usage-based pricing for ${toolName} is hard to optimize without monthly token volumes. Capture input/output tokens and peak concurrency so we can compare blended $/1M tokens and check enterprise rate tiers.`;
};

const buildApiSpendReason = (args: {
  toolName: string;
  monthlySpend: number | null;
}) => {
  const { toolName, monthlySpend } = args;
  if (monthlySpend !== null && monthlySpend >= 1000) {
    return `Spend is material for ${toolName}. Lock in token volume ranges to compare provider rates and evaluate enterprise pricing.`;
  }

  return buildApiSpendGuidance(toolName);
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
  const usageIntensity = input.usageIntensity ?? "moderate";
  const optimizationMode = input.optimizationMode ?? "balanced";
  const teamSize = parseNumber(input.teamSize) ?? null;
  const teamMaturity = getTeamMaturity(teamSize);
  const overlaps = detectOverlaps(input.tools);
  const groupedOverlaps = groupOverlaps(overlaps);
  const toolMonthlySpend: Record<string, number | null> = {};
  const chatSeatTools = new Set(["claude", "chatgpt"]);
  const hasChatSeats = input.tools.some(
    (tool) => tool.plan && chatSeatTools.has(tool.toolId)
  );

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
    const listMonthlyUsd = estimatePlanCost(plan, seats);
    const currentMonthlyUsd = estimateReportedOrList(
      plan,
      seats,
      monthlySpend
    );
    const currentTier = getTierForLabel(plan.label);
    const allowFreeTier = isLowRiskFreeTier({
      seats,
      teamSize,
      usageIntensity,
      useCase,
    });
    const decision = downgradeDecision({
      currentTier,
      seats,
      teamSize,
      usageIntensity,
      useCase,
    });
    toolMonthlySpend[tool.toolId] = currentMonthlyUsd;

    if (
      teamSize !== null &&
      seats > Math.ceil(teamSize * 1.2) &&
      seats >= 3
    ) {
      lines.push({
        toolId: tool.toolId,
        toolName: toolPricing.toolName,
        currentPlan: plan.label,
        currentMonthlyUsd,
        recommendedPlan: plan.label,
        recommendedMonthlyUsd: currentMonthlyUsd,
        savingsMonthlyUsd: null,
        confidence: "medium",
        reason:
          "Seat allocation materially exceeds reported team size. Review unused seats before changing plans.",
      });
      return;
    }

    if (
      isEnterprisePlan(plan) &&
      !isApiPlan(plan) &&
      (seats <= 10 || (teamSize !== null && teamSize <= 20)) &&
      usageIntensity !== "heavy"
    ) {
      const enterpriseDowngrade = findEnterpriseDowngrade(tool.toolId, seats);
      if (enterpriseDowngrade) {
        lines.push({
          toolId: tool.toolId,
          toolName: toolPricing.toolName,
          currentPlan: plan.label,
          currentMonthlyUsd,
          recommendedPlan: enterpriseDowngrade.plan.label,
          recommendedMonthlyUsd: enterpriseDowngrade.monthly,
          savingsMonthlyUsd: null,
          confidence: "medium",
          reason:
            "Enterprise governance features are typically justified at larger organizational scale. Consider a team plan unless advanced compliance requirements apply.",
        });
        return;
      }
    }

    if (
      plan.pricingModel === "free" &&
      (teamSize !== null && teamSize >= 8 ||
        seats >= 5 ||
        usageIntensity === "heavy")
    ) {
      lines.push({
        toolId: tool.toolId,
        toolName: toolPricing.toolName,
        currentPlan: plan.label,
        currentMonthlyUsd,
        recommendedPlan: null,
        recommendedMonthlyUsd: null,
        savingsMonthlyUsd: 0,
        confidence: "medium",
        reason:
          "Free-tier tooling may introduce usage-limit and reliability constraints for collaborative workflows at this scale.",
      });
      return;
    }

    const comparable = decision === "not-recommended"
      ? null
      : findComparablePlan(
        tool.toolId,
        seats,
        currentMonthlyUsd,
        currentTier,
        usageIntensity,
        allowFreeTier
      );

    if (comparable) {
      const reasonParts = [];
      if (isTeamPlan(plan) && seats <= 2) {
        reasonParts.push(
          "Your current plan includes admin and collaboration controls designed for larger teams."
        );
      }
      if (teamMaturity === "growing" || teamMaturity === "mature") {
        reasonParts.push(
          "We kept collaboration and seat-management features in mind for your team stage."
        );
      }
      reasonParts.push(
        `The ${comparable.plan.label} tier keeps core ${useCase || "productivity"} workflows while lowering seat overhead.`
      );
      if (currentMonthlyUsd !== null && comparable.monthly !== null) {
        reasonParts.push(
          `List price is ${formatUsd(comparable.monthly)}/mo for ${Math.max(
            seats,
            1
          )} seats.`
        );
      }

      const savingsPct =
        currentMonthlyUsd && comparable.monthly
          ? (currentMonthlyUsd - comparable.monthly) / currentMonthlyUsd
          : 0;
      const allowComparable =
        !(savingsPct > 0.6 && overlaps.length === 0) &&
        !(optimizationMode === "conservative" && decision === "aggressive");

      if (!allowComparable) {
        // Fall through to neutral recommendation to avoid unrealistic savings.
      } else {
        lines.push({
          toolId: tool.toolId,
          toolName: toolPricing.toolName,
          currentPlan: plan.label,
          currentMonthlyUsd,
          recommendedPlan: comparable.plan.label,
          recommendedMonthlyUsd: comparable.monthly,
          savingsMonthlyUsd:
            currentMonthlyUsd !== null && comparable.monthly !== null
              ? currentMonthlyUsd - comparable.monthly
              : null,
          confidence: confidenceForLine({
            hasExactPricing: comparable.monthly !== null,
            usesMonthlySpend: monthlySpend !== null,
            recommendationType: "cheaper-plan",
          }),
          reason: reasonParts.join(" "),
        });
        return;
      }
    }

    if (monthlySpend !== null && listMonthlyUsd !== null) {
      const delta = monthlySpend - listMonthlyUsd;
      if (delta > Math.max(10, listMonthlyUsd * 0.1)) {
        lines.push({
          toolId: tool.toolId,
          toolName: toolPricing.toolName,
          currentPlan: plan.label,
          currentMonthlyUsd,
          recommendedPlan: plan.label,
          recommendedMonthlyUsd: listMonthlyUsd,
          savingsMonthlyUsd: delta,
          confidence: confidenceForLine({
            hasExactPricing: true,
            usesMonthlySpend: true,
            recommendationType: "same-plan",
          }),
          reason:
            "Reported spend appears materially above standard pricing for this configuration.",
        });
        return;
      }

      if (delta < -Math.max(10, listMonthlyUsd * 0.35)) {
        lines.push({
          toolId: tool.toolId,
          toolName: toolPricing.toolName,
          currentPlan: plan.label,
          currentMonthlyUsd,
          recommendedPlan: plan.label,
          recommendedMonthlyUsd: listMonthlyUsd,
          savingsMonthlyUsd: null,
          confidence: "low",
          reason:
            "Reported spend appears materially below standard pricing for this configuration.",
        });
        return;
      }
    }

    const alternative = findAlternativePlan(
      tool.toolId,
      useCase,
      seats,
      currentMonthlyUsd,
      currentTier
    );

    if (alternative) {
      const savingsPct =
        currentMonthlyUsd && alternative.monthly
          ? (currentMonthlyUsd - alternative.monthly) / currentMonthlyUsd
          : 0;
      const allowAlternative = !(savingsPct > 0.6 && overlaps.length === 0);

      if (!allowAlternative) {
        // Fall through to neutral recommendation to avoid unrealistic savings.
      } else {
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
          reason:
            `Comparable ${useCase || "general"} capability without premium tier overhead. ` +
            `Estimated list price ${formatUsd(alternative.monthly)}/mo.`,
        });
        return;
      }
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
        reason: buildApiSpendReason({
          toolName: toolPricing.toolName,
          monthlySpend: currentMonthlyUsd,
        }),
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
      reason:
        "Your current configuration appears operationally appropriate for your team size and workflow profile.",
    });
  });

  groupedOverlaps.forEach((overlap) => {
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
  const overlapSavingsMonthlyUsd = groupedOverlaps.length > 0
    ? estimateOverlapSavings(groupedOverlaps, toolMonthlySpend)
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

  const hasUsageApi = input.tools.some((tool) => {
    const plan = tool.plan ? resolvePlan(tool.toolId, tool.plan) : null;
    return plan ? plan.pricingModel === "usage" : false;
  });
  const totalApiSpend = input.tools.reduce((sum, tool) => {
    const plan = tool.plan ? resolvePlan(tool.toolId, tool.plan) : null;
    if (!plan || plan.pricingModel !== "usage") return sum;
    const monthlySpend = parseNumber(tool.monthlySpend) ?? 0;
    return sum + monthlySpend;
  }, 0);
  const premiumCount = lines.filter((line) =>
    ["Team", "Business", "Teams", "Enterprise"].some((label) =>
      line.currentPlan.includes(label)
    )
  ).length;

  let credexScore = 0;
  if (totalSavingsMonthlyUsd >= 1000) credexScore += 3;
  else if (totalSavingsMonthlyUsd >= 500) credexScore += 2;
  if (overlapSavingsMonthlyUsd >= 200) credexScore += 2;
  if (totalMonthlyUsd >= 2000) credexScore += 2;
  if (teamSize !== null && teamSize >= 50) credexScore += 2;
  if (hasUsageApi) credexScore += 2;
  if (totalApiSpend >= 800) credexScore += 3;
  else if (totalApiSpend >= 500) credexScore += 2;
  if (premiumCount >= 2) credexScore += 1;

  const credexRecommended =
    credexScore >= 5 || (hasUsageApi && totalApiSpend >= 500);
  const credexReason = credexRecommended
    ? "Savings are material enough to justify a Credex credit quote and procurement review."
    : "Savings are modest. Keep monitoring, and we will notify you when pricing changes unlock more value.";

  if (hasUsageApi && hasChatSeats && totalApiSpend >= 500) {
    lines.push({
      toolId: "insight",
      toolName: "Insight",
      currentPlan: "API + seats",
      currentMonthlyUsd: null,
      recommendedPlan: null,
      recommendedMonthlyUsd: null,
      savingsMonthlyUsd: null,
      confidence: "medium",
      reason:
        "Your organization maintains both premium conversational AI seats and substantial API usage. Review whether all conversational workflows require separate seat licensing.",
    });
  }

  if (teamSize !== null && teamSize >= 5) {
    const hasTeamBilling = input.tools.some((tool) => {
      const plan = tool.plan ? resolvePlan(tool.toolId, tool.plan) : null;
      if (!plan) return false;
      return getTierForLabel(plan.label) === 2;
    });

    if (hasTeamBilling) {
      lines.push({
        toolId: "insight",
        toolName: "Insight",
        currentPlan: "Annual billing",
        currentMonthlyUsd: null,
        recommendedPlan: null,
        recommendedMonthlyUsd: null,
        savingsMonthlyUsd: null,
        confidence: "low",
        reason:
          "Annual billing may reduce effective per-seat pricing without operational changes.",
      });
    }
  }

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
