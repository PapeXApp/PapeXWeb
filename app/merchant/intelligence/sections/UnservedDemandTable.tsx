// app/merchant/intelligence/sections/UnservedDemandTable.tsx
//
// "Demand you don't currently serve" (use-cases doc §4, Family B1 — "the
// best translation of the seed idea into something that burns nobody. Same
// emotional payload, no named victim."). Category-level rows only; never a
// merchant name (plan.md fixed constraint #1 and #5 below).
//
// `rows` has ALREADY had every sub-floor category removed server-side
// (plan.md §4) — `hiddenRowCount` is the only trace a suppressed row
// leaves, and it renders unconditionally when > 0 (property 3), never
// silently dropped. Each row carries its OWN basis (rows aggregate over
// different cohorts, so the section-level basis wouldn't be honest for any
// one row) — rendered small, under the row, still verbatim via BasisLine.

import { Card } from "../../ui/primitives";
import { T } from "../../ui/tokens";
import { BasisLine, InfoPopover, SuppressedCard, type InfoSection } from "../ui";
import type { PanelMetric, UnservedDemand } from "@/lib/merchantApi";

const INFO: InfoSection[] = [
  {
    heading: "How this is calculated",
    body:
      "Categories your customers spend in elsewhere, minus the ones your own receipts show you already sell. The dollar figure is a per-customer monthly average across the customers we can see; the percentage is how many of those customers buy in that category at all. Neither is a projection of a market's total size — we don't publish those, because a projection from a sample this shape would be confidently wrong.",
  },
  {
    heading: "What it means",
    body:
      "Adjacency, not a forecast. It says the appetite already exists among people who walk through your door — not that you would capture it if you stocked it. Categories are deliberately unnamed at the business level: we never tell you where your customers shop, and we never tell another business where yours do.",
  },
  {
    heading: "How to act on it",
    body:
      "Read the percentage before the dollars. A category 45% of your customers buy is a habit you can intercept; one with a high average but low penetration is a handful of heavy spenders and much harder to win. Then filter by what you could actually make or stock without new equipment, new training or a new supplier — the cheapest win is the one that runs off the counter you already have.",
  },
];

export function UnservedDemandTable({ metric }: { metric: PanelMetric<UnservedDemand> }) {
  if (metric.status === "suppressed") {
    return <SuppressedCard title="Demand you don't currently serve" message={metric.message} reason={metric.reason} />;
  }

  const { rows, hiddenRowCount } = metric.value;
  const maxSpend = Math.max(1, ...rows.map((r) => r.spendPerShopperMonth));

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <InfoPopover
          title="Demand you don't currently serve"
          label="How demand you don't serve works"
          sections={INFO}
        />
        <BasisLine basis={metric.basis} />
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm" style={{ color: T.textMuted }}>
          No adjacent-category demand to report yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map((row) => (
            <div key={row.categoryId} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-sm font-medium" style={{ color: T.text }}>
                  {row.categoryLabel}
                </span>
                <span className="text-sm whitespace-nowrap" style={{ color: T.textSecondary }}>
                  <span style={{ color: T.text }}>${row.spendPerShopperMonth.toFixed(2)}</span>/mo ·{" "}
                  <span style={{ color: T.text }}>{row.shopperPenetrationPct.toFixed(0)}%</span> of your customers buy
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max((row.spendPerShopperMonth / maxSpend) * 100, 4)}%`, background: T.blue }}
                />
              </div>
              <BasisLine basis={row.basis} className="!text-[10.5px]" />
            </div>
          ))}
        </div>
      )}

      {hiddenRowCount > 0 && (
        <p className="border-t pt-2.5 text-xs" style={{ borderColor: T.divider, color: T.textMuted }}>
          {hiddenRowCount} more categor{hiddenRowCount === 1 ? "y was" : "ies were"} too small to report.
        </p>
      )}
    </Card>
  );
}
