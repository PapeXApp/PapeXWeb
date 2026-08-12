"use client";

// app/merchant/intelligence/ui.tsx
//
// Shared primitives for the `/merchant/intelligence` page (plan.md §6).
// Deliberately separate from app/merchant/ui/primitives.tsx — that file is
// the whole dashboard's shared shell; these four are specific to the panel
// product's honesty contract and shouldn't leak into (or collide with)
// other workstreams touching this repo concurrently.
//
// The core rule enforced here: `basis.label` (and `OwnBasis.label`) are
// server-rendered sentences. BasisLine is the ONLY component allowed to
// render that text, and it renders it verbatim — nothing in this file (or
// any card that uses it) is allowed to compose its own basis wording from
// the underlying numbers (plan.md §3/§4).

import { useState, type ReactNode } from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { Card } from "../ui/primitives";
import { T } from "../ui/tokens";
import type { PanelCategory, SuppressionReason } from "@/lib/merchantApi";

// ---- BasisLine ---------------------------------------------------------------

/**
 * Renders a basis sentence VERBATIM. Accepts anything with a `label: string`
 * so both `PanelBasis` and the deliberately-different-shaped `OwnBasis`
 * (traffic index's own-side basis) can render through the same component —
 * the point of keeping the two types distinct upstream is that a metric's
 * numbers can never be swapped between them, not that their `label` needs
 * two rendering paths.
 */
export function BasisLine({ basis, className = "" }: { basis: { label: string }; className?: string }) {
  return (
    <p className={`text-xs leading-snug ${className}`} style={{ color: T.textMuted }}>
      {basis.label}
    </p>
  );
}

// ---- SuppressedCard ------------------------------------------------------------

// Generic, reason-keyed explanation of PapeX's suppression floors. This is
// NOT basis wording and never mentions the actual sub-floor count for this
// merchant (plan.md §4: "contain no numbers — 'we need 9 more' leaks the
// sub-floor count the rule exists to protect") — it states the fixed,
// merchant-independent policy (25 shoppers / 5 merchants) as a rule, the
// same way it'd read on a help page.
const WHY_COPY: Record<SuppressionReason, string> = {
  below_shopper_floor:
    "PapeX only shows a category comparison once at least 25 shoppers have contributed to it, so no individual customer's habits can ever be singled out. This unlocks automatically as more of your customers link a receipt with PapeX.",
  below_merchant_floor:
    "PapeX only shows a category comparison once at least 5 other businesses are represented in it, so no single competitor's numbers are ever exposed through your dashboard. This unlocks as more businesses in your category join the panel.",
  no_data:
    "There isn't enough category data for your business yet. This fills in automatically as more customers link a PapeX receipt at your business and elsewhere in your category.",
};

/**
 * The suppressed state is a first-class product state, not an error — it
 * reads as "here's why, and what unlocks it," never as a hole in the page.
 * `message` is the server's own copy (plan.md §4's message field, no
 * numbers); the "Why?" affordance below it is generic, static UI copy about
 * the policy, not anything reconstructed from this merchant's figures.
 */
export function SuppressedCard({
  title,
  message,
  reason,
}: {
  title: string;
  message: string;
  reason: SuppressionReason;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
        {title}
      </span>
      <p className="text-sm" style={{ color: T.textSecondary }}>
        {message}
      </p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-0.5 inline-flex w-fit items-center gap-1 text-xs font-medium underline underline-offset-2 transition"
        style={{ color: T.textMuted }}
      >
        <HelpCircle className="h-3 w-3" strokeWidth={2} />
        Why is this hidden?
      </button>
      {open && (
        <p className="rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.04)", color: T.textMuted }}>
          {WHY_COPY[reason]}
        </p>
      )}
    </Card>
  );
}

// ---- PanelSectionBanner --------------------------------------------------------

/**
 * The persistent basis strip at the TOP of "Beyond your four walls"
 * (use-cases doc §4: "Persistent basis line at the top of the section, not
 * buried at the bottom"). `category` is rendered as provided by the server;
 * `basis`, when given, goes through BasisLine so its label is verbatim too.
 *
 * The full disclosure paragraph is a SEPARATE render (this section's own
 * footer, plan.md §6 order item 5) rather than duplicated up here too — the
 * API gives one `disclosure` string per response, and this banner's job is
 * the short, always-visible basis reminder, not the long-form legal text.
 */
export function PanelSectionBanner({
  category,
  basis,
}: {
  category: PanelCategory | null;
  basis?: { label: string } | null;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-2xl border px-4 py-3.5"
      style={{ background: "rgba(43, 127, 198, 0.08)", borderColor: "rgba(43, 127, 198, 0.28)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0" style={{ color: T.blue }} strokeWidth={2} />
        <span className="text-sm font-medium" style={{ color: T.text }}>
          Beyond your four walls
        </span>
        {category && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
            style={{ background: "rgba(43, 127, 198, 0.16)", color: T.blue }}
          >
            {category.label}
          </span>
        )}
      </div>
      {basis && <BasisLine basis={basis} />}
    </div>
  );
}

// ---- DemoRibbon ------------------------------------------------------------

/**
 * Visible only when the panel response says `dataSource === "demo_panel"`
 * (plan.md risk #1: the cross-shopping views imply a scale the 10-merchant
 * pilot doesn't have — this keeps that fact on-screen, not in a footnote).
 * Callers pass the literal comparison result, not a hardcoded `true`, so
 * this genuinely turns off the moment a real panel-backed response ships.
 */
export function DemoRibbon({ children }: { children?: ReactNode }) {
  return (
    <div
      className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
      style={{ borderColor: "rgba(245, 165, 36, 0.35)", background: "rgba(245, 165, 36, 0.1)", color: T.warning }}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
      {children ?? "Demo data — a synthetic category panel, not real competitor data"}
    </div>
  );
}
