import { NextResponse } from "next/server";
import { calculateAudit, AuditInput } from "../../../lib/audit";
import { buildFallbackSummary, buildSummaryPrompt } from "../../../lib/summary";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { input?: AuditInput };
    if (!body.input) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const audit = calculateAudit(body.input);
    const fallback = buildFallbackSummary({ audit, input: body.input });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log("No OPENROUTER_API_KEY found in process.env");
      return NextResponse.json({ summary: fallback, source: "fallback" });
    }

    const prompt = buildSummaryPrompt({ audit, input: body.input });
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": "SignalSpend",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 180,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter Fetch Error:", response.status, errText);
      return NextResponse.json({ summary: fallback, source: "fallback" });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ summary: fallback, source: "fallback" });
    }

    return NextResponse.json({ summary: text.trim(), source: "openai" });
  } catch {
    return NextResponse.json(
      { summary: "Audit summary unavailable.", source: "error" },
      { status: 500 }
    );
  }
}
