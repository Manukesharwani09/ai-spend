import { describe, expect, it } from "vitest";
import { calculateAudit } from "../audit";

describe("calculateAudit", () => {
  it("recommends a cheaper plan for small teams", () => {
    const result = calculateAudit({
      teamSize: "3",
      useCase: "coding",
      tools: [{ toolId: "cursor", plan: "Business", seats: "1" }],
    });

    const line = result.lines.find((item) => item.toolId === "cursor");
    expect(line?.currentMonthlyUsd).toBe(40);
    expect(line?.recommendedPlan).toBe("Hobby");
    expect(line?.recommendedMonthlyUsd).toBe(0);
    expect(line?.savingsMonthlyUsd).toBe(40);
  });

  it("detects overlap rules", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", seats: "2" },
        { toolId: "github-copilot", plan: "Business", seats: "2" },
      ],
    });

    expect(result.overlaps).toHaveLength(1);
    expect(result.overlaps[0]).toContain("coding assistants");
  });

  it("adds guidance for API spend", () => {
    const result = calculateAudit({
      tools: [
        {
          toolId: "anthropic-api",
          plan: "Claude Sonnet 4.6",
        },
      ],
    });

    const line = result.lines.find((item) => item.toolId === "anthropic-api");
    expect(line?.recommendedPlan).toBeNull();
    expect(line?.reason).toContain("Usage-based pricing");
  });

  it("includes benchmark ranges when team size is provided", () => {
    const result = calculateAudit({
      teamSize: "10",
      tools: [{ toolId: "chatgpt", plan: "Plus", seats: "1" }],
    });

    expect(result.benchmarks.typicalRangeMonthlyUsd).toEqual({
      low: 25,
      high: 90,
    });
    expect(result.benchmarks.spendPerDeveloperMonthlyUsd).toBeCloseTo(2);
  });
});
