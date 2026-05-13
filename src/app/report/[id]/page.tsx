import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { calculateAudit } from "../../../lib/audit";
import { decodeSharePayload, PublicReportSnapshot } from "../../../lib/share";
import ReportActions from "./ReportActions";
import AiSummary from "../../_components/AiSummary";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const formatUsd = (value: number | null) => {
  if (value === null) return "-";
  return `$${value.toFixed(0)}`;
};

const formatPct = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

export async function generateMetadata(
  props: PageProps
): Promise<Metadata> {
  const { id } = await props.params;

  try {
    let audit;
    
    if (id.startsWith("rpt_")) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseKey) throw new Error("Missing DB config");

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("public_reports")
        .select("public_report_json")
        .eq("report_id", id)
        .single();
        
      if (error || !data) throw new Error("Report not found");
      const snapshot = data.public_report_json as PublicReportSnapshot;
      audit = snapshot.audit;
    } else {
      // Legacy Base64 parsing
      const payload = decodeSharePayload(id);
      audit = calculateAudit(payload);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    return {
      title: `SignalSpend Report · ${formatUsd(
        audit.summary.totalSavingsMonthlyUsd
      )}/mo saved`,
      description: `Audit summary: ${formatUsd(
        audit.summary.totalSavingsMonthlyUsd
      )}/mo savings and ${formatUsd(
        audit.summary.totalAnnualUsd
      )}/yr spend.`,
      openGraph: {
        title: "SignalSpend AI Spend Audit",
        description: `Potential savings: ${formatUsd(
          audit.summary.totalSavingsMonthlyUsd
        )}/mo`,
        url: `${baseUrl}/report/${id}`,
        images: [
          {
            url: `${baseUrl}/report/${id}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: "SignalSpend audit summary",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "SignalSpend AI Spend Audit",
        description: `Potential savings: ${formatUsd(
          audit.summary.totalSavingsMonthlyUsd
        )}/mo`,
        images: [`${baseUrl}/report/${id}/opengraph-image`],
      },
    };
  } catch {
    return {
      title: "SignalSpend Report",
      description: "AI spend audit report.",
    };
  }
}

export default async function ReportPage(props: PageProps) {
  const { id } = await props.params;
  const searchParams = props.searchParams
    ? await props.searchParams
    : {};
  const shouldPrint = searchParams.print === "1";

  let audit;
  let payload;
  let initialSummary;

  try {
    if (id.startsWith("rpt_")) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseKey) throw new Error("Missing DB config");

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("public_reports")
        .select("public_report_json")
        .eq("report_id", id)
        .single();
        
      if (error || !data) throw new Error("Report not found");
      const snapshot = data.public_report_json as PublicReportSnapshot;
      
      audit = snapshot.audit;
      payload = snapshot.payload;
      initialSummary = snapshot.aiSummary || undefined;
    } else {
      // Legacy Base64 decoding
      payload = decodeSharePayload(id);
      audit = calculateAudit(payload);
      initialSummary = payload.aiSummary;
    }
  } catch {
    notFound();
  }

  return (
    <div className="print-page min-h-screen bg-[radial-gradient(circle_at_top,_#fff2e6,_transparent_45%),radial-gradient(circle_at_15%_30%,_#d7f4ee,_transparent_42%),linear-gradient(180deg,_#f7f3ef,_#f1ebe6_60%,_#ede6df)] px-6 pb-20 pt-10 text-[color:var(--foreground)]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 print-hidden">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[color:var(--accent-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Credex
            </span>
            <span className="text-sm text-[color:var(--muted)]">
              SignalSpend public report
            </span>
          </div>
          <div className="text-xs text-[color:var(--muted)]">
            Shared report · PII stripped
          </div>
        </header>

        <section className="print-card print-section rounded-[32px] border border-black/10 bg-white/90 p-8 shadow-[0_30px_80px_rgba(29,26,23,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-[var(--font-display)] text-3xl font-semibold">
                Audit summary
              </h1>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Snapshot of the current AI spend configuration.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 print-hidden">
              <div className="rounded-full bg-[color:var(--accent-strong)]/10 px-4 py-2 text-sm text-[color:var(--accent-strong)]">
                {audit.summary.credexRecommended
                  ? "Credex-ready savings detected"
                  : "Credex review not required yet"}
              </div>
              <ReportActions autoPrint={shouldPrint} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-[#faf7f4] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Current spend
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatUsd(audit.summary.totalMonthlyUsd)}/mo
              </div>
              <div className="text-sm text-[color:var(--muted)]">
                {formatUsd(audit.summary.totalAnnualUsd)}/yr
              </div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#faf7f4] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Estimated savings
              </div>
              <div className="mt-2 text-2xl font-semibold text-[color:var(--accent-strong)]">
                {formatUsd(audit.summary.totalSavingsMonthlyUsd)}/mo
              </div>
              <div className="text-sm text-[color:var(--muted)]">
                {formatUsd(audit.summary.totalSavingsAnnualUsd)}/yr · {formatPct(
                  audit.summary.savingsPctOfSpend
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {[
            { title: "Recommendations", items: audit.recommendations },
            { title: "Warnings", items: audit.warnings },
            { title: "Overlap flags", items: audit.overlaps },
            { title: "Insights", items: audit.insights },
          ].map((block) => (
            <div
              key={block.title}
              className="print-card print-section rounded-2xl border border-black/10 bg-white/90 p-5 shadow-[0_20px_40px_rgba(29,26,23,0.08)]"
            >
              <div className="text-sm font-semibold">{block.title}</div>
              {block.items.length === 0 ? (
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Nothing to report right now.
                </p>
              ) : (
                <div className="mt-3 space-y-3 text-sm text-[color:var(--muted)]">
                  {block.items.map((line, index) => (
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
                        Current: {line.currentPlan} · {formatUsd(
                          line.currentMonthlyUsd
                        )}/mo
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        Recommended: {line.recommendedPlan ?? "No change"} · {formatUsd(
                          line.recommendedMonthlyUsd
                        )}/mo
                      </div>
                      <div className="mt-2 text-sm text-[color:var(--foreground)]">
                        {line.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <AiSummary audit={audit} input={payload} initialSummary={initialSummary} />
      </main>
    </div>
  );
}
