import type { AuditInput, AuditResult } from "./audit";

const formatUsd = (value: number | null) => {
  if (value === null) return "-";
  return `$${value.toFixed(0)}`;
};

const pickPrimaryLine = (audit: AuditResult) => {
  return (
    audit.recommendations[0] ||
    audit.warnings[0] ||
    audit.overlaps[0] ||
    audit.insights[0] ||
    null
  );
};

export const buildFallbackSummary = (args: {
  audit: AuditResult;
  input: AuditInput;
}) => {
  const { audit, input } = args;
  const primary = pickPrimaryLine(audit);
  const useCase = input.useCase || "mixed";
  const teamSize = input.teamSize ? `team of ${input.teamSize}` : "your team";
  const savings = formatUsd(audit.summary.totalSavingsMonthlyUsd);
  const spend = formatUsd(audit.summary.totalMonthlyUsd);
  const benchmark = audit.benchmarks.note;

  const opener = `SignalSpend analyzed ${teamSize}'s ${useCase} AI stack and found an estimated ${savings}/mo in actionable savings against ${spend}/mo in spend.`;
  const primaryLine = primary
    ? `Key focus area: ${primary.reason}`
    : "Your current configuration appears operationally appropriate with limited near-term optimization.";
  const credex = audit.summary.credexRecommended
    ? "Credex can help capture additional savings through discounted credits."
    : "Keep monitoring pricing changes for future optimization opportunities.";

  return `${opener} ${primaryLine} ${benchmark} ${credex}`.trim();
};

export const buildSummaryPrompt = (args: {
  audit: AuditResult;
  input: AuditInput;
}) => {
  const { audit, input } = args;
  const payload = {
    input,
    summary: audit.summary,
    benchmarks: audit.benchmarks,
    recommendations: audit.recommendations.slice(0, 3),
    warnings: audit.warnings.slice(0, 2),
    overlaps: audit.overlaps.slice(0, 2),
    insights: audit.insights.slice(0, 2),
  };

  return {
    system:
      "You are an AI finance assistant. Write a 90-120 word, founder-friendly audit summary for a SaaS procurement tool. Be concise, grounded in the data, and avoid hype. Mention savings, spend, and one key recommendation or warning. If no savings, say the setup is reasonable. Do not invent numbers.",
    user: `Audit payload:\n${JSON.stringify(payload, null, 2)}`,
  };
};
