"use client";

import { useEffect } from "react";

type ReportActionsProps = {
  autoPrint?: boolean;
};

export default function ReportActions({ autoPrint }: ReportActionsProps) {
  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]"
      >
        Export PDF
      </button>
    </div>
  );
}
