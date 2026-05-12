import { describe, expect, it } from "vitest";
import { calculateAudit } from "../audit";

const allLines = (result: ReturnType<typeof calculateAudit>) => [
  ...result.recommendations,
  ...result.warnings,
  ...result.insights,
  ...result.overlaps,
];

describe("calculateAudit - regression scenarios", () => {
  it("1. Solo founder business plan downgrade", () => {
    const result = calculateAudit({
      teamSize: "1",
      useCase: "coding",
      usageIntensity: "light",
      tools: [{ toolId: "cursor", plan: "Business", seats: "1", monthlySpend: "40" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "cursor");
    expect(rec?.recommendedPlan).toBe("Pro");
    expect(rec?.recommendedPlan).not.toBe("Hobby");
  });

  it("2. Free tier allowed for solo light non-coding", () => {
    const result = calculateAudit({
      teamSize: "1",
      useCase: "writing",
      usageIntensity: "light",
      tools: [{ toolId: "claude", plan: "Pro", seats: "1", monthlySpend: "20" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "claude");
    expect(rec?.recommendedPlan).toBe("Free");
  });

  it("3. No free tier recommendation for multi-seat coding", () => {
    const result = calculateAudit({
      teamSize: "8",
      useCase: "coding",
      usageIntensity: "moderate",
      tools: [{ toolId: "cursor", plan: "Pro", seats: "5", monthlySpend: "100" }],
    });

    const recs = result.recommendations.filter((line) => line.toolId === "cursor");
    expect(recs.some((line) => line.recommendedPlan?.includes("Free"))).toBe(false);
  });

  it("4. Medium team business plan stays", () => {
    const result = calculateAudit({
      teamSize: "10",
      useCase: "coding",
      usageIntensity: "moderate",
      tools: [{ toolId: "cursor", plan: "Business", seats: "10", monthlySpend: "400" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "cursor");
    expect(rec).toBeUndefined();
  });

  it("5. Heavy usage business plan stays", () => {
    const result = calculateAudit({
      teamSize: "15",
      useCase: "coding",
      usageIntensity: "heavy",
      tools: [{ toolId: "cursor", plan: "Business", seats: "15", monthlySpend: "600" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "cursor");
    expect(rec).toBeUndefined();
  });

  it("6. Duplicate coding assistant overlap", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", seats: "5", monthlySpend: "100" },
        { toolId: "github-copilot", plan: "Business", seats: "5", monthlySpend: "95" },
      ],
    });

    expect(result.overlaps[0]?.reason).toContain("coding assistants");
  });

  it("7. Duplicate chat AI overlap", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "claude", plan: "Team", seats: "3" },
        { toolId: "chatgpt", plan: "Team", seats: "3" },
      ],
    });

    expect(result.overlaps[0]?.reason).toContain("chat suites");
  });

  it("8. High API spend triggers Credex", () => {
    const result = calculateAudit({
      tools: [{ toolId: "openai-api", plan: "GPT-5.4", monthlySpend: "4000" }],
    });

    expect(result.summary.credexRecommended).toBe(true);
  });

  it("9. Billing mismatch detection", () => {
    const result = calculateAudit({
      tools: [{ toolId: "cursor", plan: "Pro", seats: "5", monthlySpend: "320" }],
    });

    expect(result.warnings[0]?.reason).toContain("materially above standard pricing");
  });

  it("10. Already optimized small team", () => {
    const result = calculateAudit({
      tools: [{ toolId: "chatgpt", plan: "Plus", seats: "2", monthlySpend: "40" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "chatgpt");
    expect(rec).toBeUndefined();
  });

  it("11. Heavy usage prevents downgrade", () => {
    const result = calculateAudit({
      tools: [{ toolId: "claude", plan: "Max", seats: "1", monthlySpend: "100" }],
      usageIntensity: "heavy",
    });

    const rec = result.recommendations.find((line) => line.toolId === "claude");
    expect(rec).toBeUndefined();
  });

  it("12. Seat count vs team size waste", () => {
    const result = calculateAudit({
      teamSize: "5",
      tools: [{ toolId: "cursor", plan: "Pro", seats: "14", monthlySpend: "280" }],
    });

    expect(result.warnings[0]?.reason).toContain("Seat allocation materially exceeds");
  });

  it("13. Enterprise misuse handling", () => {
    const result = calculateAudit({
      teamSize: "3",
      tools: [{ toolId: "chatgpt", plan: "Enterprise", seats: "3" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "chatgpt");
    expect(rec?.reason).toContain("Enterprise governance features");
  });

  it("14. Alternative recommendation remains conservative", () => {
    const result = calculateAudit({
      tools: [{ toolId: "claude", plan: "Pro", seats: "2", monthlySpend: "40" }],
      usageIntensity: "moderate",
    });

    const rec = result.recommendations.find((line) => line.toolId === "claude");
    expect(rec).toBeUndefined();
  });

  it("15. Multiple premium stacks + APIs", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "cursor", plan: "Business", seats: "10", monthlySpend: "400" },
        { toolId: "claude", plan: "Team", seats: "10", monthlySpend: "250" },
        { toolId: "openai-api", plan: "GPT-5.4", monthlySpend: "1500" },
        { toolId: "anthropic-api", plan: "Claude Sonnet 4.6", monthlySpend: "1200" },
      ],
    });

    expect(result.summary.credexRecommended).toBe(true);
    expect(result.overlaps.length).toBeGreaterThan(0);
    expect(result.insights.some((line) => line.reason.includes("API usage"))).toBe(true);
  });

  it("16. Cursor + Windsurf overlap", () => {
    const result = calculateAudit({
      teamSize: "6",
      useCase: "coding",
      usageIntensity: "moderate",
      tools: [
        { toolId: "cursor", plan: "Pro", seats: "6", monthlySpend: "120" },
        { toolId: "windsurf", plan: "Pro", seats: "6", monthlySpend: "120" },
      ],
    });

    expect(result.overlaps[0]?.reason).toContain("premium coding assistants");
  });

  it("17. Small team enterprise edge case", () => {
    const result = calculateAudit({
      teamSize: "4",
      useCase: "research",
      usageIntensity: "heavy",
      tools: [{ toolId: "claude", plan: "Enterprise", seats: "4" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "claude");
    expect(rec).toBeUndefined();
  });

  it("18. High spend but justified", () => {
    const result = calculateAudit({
      teamSize: "40",
      useCase: "coding",
      usageIntensity: "heavy",
      tools: [{ toolId: "cursor", plan: "Business", seats: "40", monthlySpend: "1600" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "cursor");
    expect(rec).toBeUndefined();
  });

  it("19. API + chat subscription overlap insight", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "chatgpt", plan: "Team", seats: "5", monthlySpend: "125" },
        { toolId: "openai-api", plan: "GPT-5.4", monthlySpend: "1200" },
      ],
    });

    expect(result.insights.some((line) => line.reason.includes("API usage"))).toBe(true);
  });

  it("20. Very low spend already optimized", () => {
    const result = calculateAudit({
      tools: [{ toolId: "gemini", plan: "Pro", seats: "1", monthlySpend: "20" }],
      usageIntensity: "moderate",
    });

    const rec = result.recommendations.find((line) => line.toolId === "gemini");
    expect(rec).toBeUndefined();
  });

  it("21. Huge spend + multiple vendors", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "cursor", plan: "Business", seats: "20", monthlySpend: "800" },
        { toolId: "claude", plan: "Team", seats: "20", monthlySpend: "500" },
        { toolId: "openai-api", plan: "GPT-5.4", monthlySpend: "3000" },
        { toolId: "anthropic-api", plan: "Claude Sonnet 4.6", monthlySpend: "2500" },
      ],
    });

    expect(result.summary.credexRecommended).toBe(true);
    expect(result.overlaps.length).toBeGreaterThan(0);
  });

  it("22. Free tier abuse detection", () => {
    const result = calculateAudit({
      teamSize: "12",
      usageIntensity: "heavy",
      tools: [{ toolId: "windsurf", plan: "Free", seats: "12", monthlySpend: "0" }],
    });

    expect(result.warnings[0]?.reason).toContain("Free-tier tooling may introduce");
  });

  it("23. Small team heavy usage", () => {
    const result = calculateAudit({
      teamSize: "2",
      useCase: "coding",
      usageIntensity: "heavy",
      tools: [{ toolId: "cursor", plan: "Business", seats: "2", monthlySpend: "80" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "cursor");
    expect(rec).toBeUndefined();
  });

  it("24. API-only startup", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "openai-api", plan: "GPT-5.4", monthlySpend: "500" },
        { toolId: "anthropic-api", plan: "Claude Sonnet 4.6", monthlySpend: "600" },
      ],
    });

    expect(result.summary.credexRecommended).toBe(true);
    expect(result.recommendations.length).toBe(0);
  });

  it("25. Mixed workflow team keeps multi-tool stack", () => {
    const result = calculateAudit({
      teamSize: "7",
      useCase: "mixed",
      usageIntensity: "moderate",
      tools: [
        { toolId: "cursor", plan: "Pro", seats: "5", monthlySpend: "100" },
        { toolId: "claude", plan: "Team", seats: "7", monthlySpend: "175" },
      ],
    });

    const recs = result.recommendations.filter((line) => line.toolId === "cursor");
    expect(recs.length).toBe(0);
  });

  it("26. Unrealistically low reported spend", () => {
    const result = calculateAudit({
      tools: [{ toolId: "cursor", plan: "Business", seats: "10", monthlySpend: "20" }],
    });

    expect(result.warnings[0]?.reason).toContain("materially below standard pricing");
  });

  it("27. Overlap warnings are grouped", () => {
    const result = calculateAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", seats: "2" },
        { toolId: "github-copilot", plan: "Business", seats: "2" },
        { toolId: "windsurf", plan: "Pro", seats: "2" },
        { toolId: "claude", plan: "Team", seats: "2" },
        { toolId: "chatgpt", plan: "Team", seats: "2" },
        { toolId: "gemini", plan: "Pro", seats: "2" },
      ],
    });

    expect(result.overlaps.length).toBeLessThanOrEqual(2);
  });

  it("28. Annual billing opportunity", () => {
    const result = calculateAudit({
      teamSize: "15",
      tools: [{ toolId: "claude", plan: "Team", seats: "15" }],
    });

    expect(result.insights.some((line) => line.reason.includes("Annual billing"))).toBe(true);
  });

  it("29. Growing startup scenario", () => {
    const result = calculateAudit({
      teamSize: "9",
      useCase: "coding",
      usageIntensity: "moderate",
      tools: [{ toolId: "cursor", plan: "Business", seats: "9", monthlySpend: "360" }],
    });

    const rec = result.recommendations.find((line) => line.toolId === "cursor");
    expect(rec).toBeUndefined();
  });

  it("30. No recommendation still feels valuable", () => {
    const result = calculateAudit({
      tools: [{ toolId: "chatgpt", plan: "Plus", seats: "3", monthlySpend: "60" }],
    });

    expect(result.insights[0]?.reason).toContain("operationally appropriate");
  });
});
