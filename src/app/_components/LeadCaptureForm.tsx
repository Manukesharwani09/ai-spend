"use client";

import { useState } from "react";
import type { AuditResult } from "../../lib/audit";

type LeadCaptureFormProps = {
  auditResult: AuditResult;
};

export default function LeadCaptureForm({ auditResult }: LeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  
  // Honeypot field
  const [websiteUrl, setWebsiteUrl] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          companyName,
          role,
          teamSize,
          website_url: websiteUrl, // honeypot
          auditData: auditResult,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit lead");
      }

      setStatus("success");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-8 rounded-[32px] border border-black/5 bg-[color:var(--accent-strong)]/5 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent-strong)] text-white">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 font-[var(--font-display)] text-xl font-semibold text-[color:var(--foreground)]">
          Audit sent to your inbox!
        </h3>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          We've sent a copy of your results to {email}.
          {auditResult.summary.credexRecommended && " Our team will review your high-savings profile and reach out shortly."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_20px_60px_rgba(29,26,23,0.06)]">
      <div className="max-w-xl">
        <h3 className="font-[var(--font-display)] text-2xl font-semibold">
          Save your audit & get a custom review
        </h3>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Get this report sent to your email. If you have significant savings potential, Credex will reach out with direct inventory deals.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* HONEYPOT FIELD - DO NOT REMOVE */}
          <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
            <label htmlFor="website_url">Leave this field blank if you are human</label>
            <input
              type="text"
              id="website_url"
              name="website_url"
              tabIndex={-1}
              autoComplete="off"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold">
              Work email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="founder@startup.com"
              className="w-full rounded-2xl border border-black/10 bg-[#faf7f4] px-4 py-3 text-sm transition-colors focus:border-[color:var(--accent-strong)] focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-semibold">Company (Optional)</label>
              <input
                id="company"
                type="text"
                placeholder="Acme Inc"
                className="w-full rounded-2xl border border-black/10 bg-[#faf7f4] px-4 py-3 text-sm transition-colors focus:border-[color:var(--accent-strong)] focus:outline-none"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-semibold">Role (Optional)</label>
              <input
                id="role"
                type="text"
                placeholder="CTO / Founder"
                className="w-full rounded-2xl border border-black/10 bg-[#faf7f4] px-4 py-3 text-sm transition-colors focus:border-[color:var(--accent-strong)] focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-[color:var(--accent-strong)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,107,95,0.25)] transition-all hover:bg-[color:var(--accent-strong)]/90 disabled:opacity-70 sm:w-auto"
          >
            {status === "loading" ? "Sending..." : "Send me this report"}
          </button>
        </form>
      </div>
    </div>
  );
}
