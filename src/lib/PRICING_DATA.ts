export type PricingModel = "free" | "flat" | "per-seat" | "usage" | "custom";

export type PricingPlan = {
  id: string;
  label: string;
  pricingModel: PricingModel;
  monthlyUsd?: number;
  perSeatMonthlyUsd?: number;
  inputPer1MTokensUsd?: number;
  outputPer1MTokensUsd?: number;
  sourceUrl: string;
  notes?: string;
};

export type ToolPricing = {
  toolId: string;
  toolName: string;
  plans: PricingPlan[];
};

export const PRICING_DATA: ToolPricing[] = [
  {
    toolId: "cursor",
    toolName: "Cursor",
    plans: [
      {
        id: "cursor-hobby",
        label: "Hobby",
        pricingModel: "free",
        monthlyUsd: 0,
        sourceUrl: "https://cursor.com/pricing",
      },
      {
        id: "cursor-pro",
        label: "Pro",
        pricingModel: "flat",
        monthlyUsd: 20,
        sourceUrl: "https://cursor.com/pricing",
      },
      {
        id: "cursor-business",
        label: "Business (Teams)",
        pricingModel: "per-seat",
        perSeatMonthlyUsd: 40,
        sourceUrl: "https://cursor.com/pricing",
      },
      {
        id: "cursor-enterprise",
        label: "Enterprise",
        pricingModel: "custom",
        sourceUrl: "https://cursor.com/pricing",
        notes: "Custom pricing (contact sales).",
      },
    ],
  },
  {
    toolId: "github-copilot",
    toolName: "GitHub Copilot",
    plans: [
      {
        id: "copilot-individual",
        label: "Individual (Pro)",
        pricingModel: "per-seat",
        perSeatMonthlyUsd: 10,
        sourceUrl:
          "https://docs.github.com/en/billing/concepts/product-billing/github-copilot-licenses",
      },
      {
        id: "copilot-business",
        label: "Business",
        pricingModel: "per-seat",
        perSeatMonthlyUsd: 19,
        sourceUrl:
          "https://docs.github.com/en/billing/concepts/product-billing/github-copilot-licenses",
      },
      {
        id: "copilot-enterprise",
        label: "Enterprise",
        pricingModel: "custom",
        sourceUrl:
          "https://docs.github.com/en/billing/concepts/product-billing/github-copilot-licenses",
        notes: "Pricing varies; contact sales.",
      },
    ],
  },
  {
    toolId: "claude",
    toolName: "Claude",
    plans: [
      {
        id: "claude-free",
        label: "Free",
        pricingModel: "free",
        monthlyUsd: 0,
        sourceUrl: "https://claude.com/pricing",
      },
      {
        id: "claude-pro",
        label: "Pro",
        pricingModel: "flat",
        monthlyUsd: 20,
        sourceUrl: "https://claude.com/pricing",
        notes: "$17/mo when billed annually.",
      },
      {
        id: "claude-max",
        label: "Max",
        pricingModel: "flat",
        monthlyUsd: 100,
        sourceUrl: "https://claude.com/pricing",
        notes: "Starts at $100/mo depending on usage tier.",
      },
      {
        id: "claude-team",
        label: "Team (Standard seat)",
        pricingModel: "per-seat",
        perSeatMonthlyUsd: 25,
        sourceUrl: "https://claude.com/pricing/team",
        notes: "$20/seat when billed annually.",
      },
      {
        id: "claude-enterprise",
        label: "Enterprise (self-serve)",
        pricingModel: "per-seat",
        perSeatMonthlyUsd: 20,
        sourceUrl: "https://claude.com/pricing/enterprise",
        notes: "Billed annually; usage billed at API rates; minimum seats apply.",
      },
      {
        id: "claude-api",
        label: "API direct (Claude Sonnet 4.6)",
        pricingModel: "usage",
        inputPer1MTokensUsd: 3,
        outputPer1MTokensUsd: 15,
        sourceUrl:
          "https://platform.claude.com/docs/en/docs/about-claude/pricing",
      },
    ],
  },
  {
    toolId: "chatgpt",
    toolName: "ChatGPT",
    plans: [
      {
        id: "chatgpt-plus",
        label: "Plus",
        pricingModel: "flat",
        monthlyUsd: 20,
        sourceUrl: "https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus",
      },
      {
        id: "chatgpt-team",
        label: "Team (Business)",
        pricingModel: "per-seat",
        perSeatMonthlyUsd: 25,
        sourceUrl: "https://help.openai.com/en/articles/8792828-what-is-chatgpt-business",
        notes: "$20/seat when billed annually.",
      },
      {
        id: "chatgpt-enterprise",
        label: "Enterprise",
        pricingModel: "custom",
        sourceUrl: "https://chatgpt.com/pricing",
        notes: "Custom pricing (contact sales).",
      },
      {
        id: "chatgpt-api",
        label: "API direct (GPT-5.4)",
        pricingModel: "usage",
        inputPer1MTokensUsd: 2.5,
        outputPer1MTokensUsd: 15,
        sourceUrl: "https://openai.com/api/pricing",
      },
    ],
  },
  {
    toolId: "anthropic-api",
    toolName: "Anthropic API direct",
    plans: [
      {
        id: "anthropic-sonnet-46",
        label: "Claude Sonnet 4.6",
        pricingModel: "usage",
        inputPer1MTokensUsd: 3,
        outputPer1MTokensUsd: 15,
        sourceUrl:
          "https://platform.claude.com/docs/en/docs/about-claude/pricing",
      },
    ],
  },
  {
    toolId: "openai-api",
    toolName: "OpenAI API direct",
    plans: [
      {
        id: "openai-gpt-54",
        label: "GPT-5.4",
        pricingModel: "usage",
        inputPer1MTokensUsd: 2.5,
        outputPer1MTokensUsd: 15,
        sourceUrl: "https://openai.com/api/pricing",
      },
    ],
  },
  {
    toolId: "gemini",
    toolName: "Gemini",
    plans: [
      {
        id: "gemini-pro",
        label: "Pro (Google AI Pro)",
        pricingModel: "flat",
        monthlyUsd: 19.99,
        sourceUrl: "https://one.google.com/intl/en_us/about/google-ai-plans/",
      },
      {
        id: "gemini-ultra",
        label: "Ultra (Google AI Ultra)",
        pricingModel: "flat",
        monthlyUsd: 249.99,
        sourceUrl: "https://one.google.com/intl/en_us/about/google-ai-plans/",
      },
      {
        id: "gemini-api",
        label: "API (Gemini 2.5 Pro)",
        pricingModel: "usage",
        inputPer1MTokensUsd: 1.25,
        outputPer1MTokensUsd: 10,
        sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
      },
    ],
  },
  {
    toolId: "windsurf",
    toolName: "Windsurf",
    plans: [
      {
        id: "windsurf-free",
        label: "Free",
        pricingModel: "free",
        monthlyUsd: 0,
        sourceUrl: "https://windsurf.com/pricing",
      },
      {
        id: "windsurf-pro",
        label: "Pro",
        pricingModel: "flat",
        monthlyUsd: 20,
        sourceUrl: "https://windsurf.com/pricing",
      },
      {
        id: "windsurf-max",
        label: "Max",
        pricingModel: "flat",
        monthlyUsd: 200,
        sourceUrl: "https://windsurf.com/pricing",
      },
      {
        id: "windsurf-teams",
        label: "Teams",
        pricingModel: "per-seat",
        perSeatMonthlyUsd: 40,
        sourceUrl: "https://windsurf.com/pricing",
      },
      {
        id: "windsurf-enterprise",
        label: "Enterprise",
        pricingModel: "custom",
        sourceUrl: "https://windsurf.com/pricing",
        notes: "Custom pricing (contact sales).",
      },
    ],
  },
];
