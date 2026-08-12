// app/merchant/intelligence/sections/CompetitiveSetCard.tsx
//
// "Your typical customer visits 2.4 other coffee shops a month. Category
// norm is 3.1 — your customers are unusually loyal." (use-cases doc §4,
// Family A3 — "arguably the safest framing of the entire seed concept and a
// strong demo line"). Per-shopper averages, both sides of the same
// denominator — allowed under plan.md's "no projected absolute figures"
// constraint because neither number is a headcount.

import { Card } from "../../ui/primitives";
import { T } from "../../ui/tokens";
import { BasisLine, SuppressedCard } from "../ui";
import type { CompetitiveSetBreadth, PanelMetric } from "@/lib/merchantApi";

export function CompetitiveSetCard({ metric }: { metric: PanelMetric<CompetitiveSetBreadth> }) {
  if (metric.status === "suppressed") {
    return <SuppressedCard title="Competitive set" message={metric.message} reason={metric.reason} />;
  }

  const { yourShoppersVenuesPerMonth, categoryAvgVenuesPerMonth } = metric.value;
  const moreLoyal = yourShoppersVenuesPerMonth < categoryAvgVenuesPerMonth;

  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
        Competitive set
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-barlow text-[28px] font-medium leading-none" style={{ color: T.text }}>
          {yourShoppersVenuesPerMonth.toFixed(1)}
        </span>
        <span className="text-xs" style={{ color: T.textSecondary }}>
          other venues/month, your customers
        </span>
      </div>
      <p className="text-sm" style={{ color: T.textSecondary }}>
        Category norm is <span style={{ color: T.text }}>{categoryAvgVenuesPerMonth.toFixed(1)}</span>
        {" — "}
        <span style={{ color: moreLoyal ? T.success : T.warning }}>
          {moreLoyal ? "your customers are unusually loyal" : "your customers shop around more than average"}
        </span>
        .
      </p>
      <BasisLine basis={metric.basis} className="mt-1" />
    </Card>
  );
}
