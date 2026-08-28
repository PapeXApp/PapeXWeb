"use client";

// app/merchant/intelligence/sections/AttentionSection.tsx
//
// Section 1 — "Needs your attention" (docs/COMPETITOR_INSIGHTS_USE_CASES.md
// §4, Family H). Own-transactions-only forensics findings — no panel, no
// cross-merchant data, no shopper identity. Leads the page on purpose:
// "provably true, from their own receipts, never seen before... establishes
// that PapeX sees what their POS doesn't, before a single panel number
// appears" (reading order: alarm -> identity -> opportunity -> context).
//
// COLLISION NOTE: plan.md §6 originally reserved this file for a separate
// forensics-focused workstream ("FORENSICS AGENT OWNS. We create nothing
// here.") and had this page render `<AttentionSection />` with no props,
// self-fetching. No such component existed anywhere in the repo when this
// milestone (M6) started, and this task's own build list explicitly
// includes this file — so it's built here, still to that same contract
// (self-fetches, no props, returns null on nothing-to-show) so a future
// forensics-specific pass can replace the internals without touching
// page.tsx or any other section.
//
// getForensics() (lib/merchantApi.ts) deliberately has NO mock branch: a
// synthetic forensics finding would be exactly the "unverifiable
// accusation" this feature exists to avoid, so it always hits the live API
// even under NEXT_PUBLIC_MERCHANT_MOCK=1. In mock mode (no real backend
// reachable, or a merchant with no `merchant_id` registry mapping) that
// call fails — and per this section's contract, a failure renders NOTHING,
// not an error banner. The rest of the page must never blank because this
// one fetch didn't come back (property 4: the three fetches are
// independent) and a merchant with a clean 30 days must not see a hole
// shaped like "we couldn't check."
//
// Deliberately no loading skeleton, either: this section is either there or
// it isn't, and a flash of a loading block above the real header content
// would be more distracting than a slightly delayed appearance.

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useMerchantAuth } from "../../AuthContext";
import { getForensics, type ForensicsFinding, type ForensicsSeverity } from "@/lib/merchantApi";
import { T } from "../../ui/tokens";

const SEVERITY_STYLE: Record<ForensicsSeverity, { color: string; bg: string; border: string }> = {
  high: { color: T.error, bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.28)" },
  medium: { color: T.warning, bg: "rgba(245, 165, 36, 0.08)", border: "rgba(245, 165, 36, 0.28)" },
  low: { color: T.textMuted, bg: "rgba(255, 255, 255, 0.03)", border: T.glassBorder },
};

// Not app/merchant/ui/primitives.tsx's <Card> — that component has no
// `style` prop, and each finding needs a per-severity tint on top of the
// dashboard's usual glass-card shell. Same rounded/border/blur treatment,
// just with the background+border swapped in per severity.
function FindingCard({ finding }: { finding: ForensicsFinding }) {
  const style = SEVERITY_STYLE[finding.severity];
  return (
    <div
      className="flex items-start gap-3 rounded-[20px] border p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: style.color }} strokeWidth={2.25} />
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium" style={{ color: T.text }}>
          {finding.headline}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          {finding.detail}
        </p>
      </div>
    </div>
  );
}

export default function AttentionSection() {
  const { getIdToken } = useMerchantAuth();
  const [findings, setFindings] = useState<ForensicsFinding[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      if (!token) return;
      try {
        const result = await getForensics(token);
        if (!cancelled) setFindings(result.findings);
      } catch {
        // No mock, no fallback data, no error UI — see header comment.
        // Leaving `findings` at [] is exactly the "render nothing" contract.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  if (findings.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-barlow text-lg font-medium" style={{ color: T.text }}>
        Needs your attention
      </h2>
      <div className="flex flex-col gap-2.5">
        {findings.map((f, i) => (
          <FindingCard key={i} finding={f} />
        ))}
      </div>
    </section>
  );
}
