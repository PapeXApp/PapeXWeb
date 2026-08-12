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
import { BasisLine, InfoPopover, SuppressedCard, type InfoSection } from "../ui";
import type { CompetitiveSetBreadth, PanelMetric } from "@/lib/merchantApi";

function infoSections(moreLoyal: boolean): InfoSection[] {
  return [
    {
      heading: "How this is calculated",
      body:
        "How many different businesses in your category your customers visit in a typical month, next to the same figure for a typical business's customers in your category. Both sides are measured the same way — a business's own customers — so it is like for like. Comparing your customers against all shoppers instead would make every business look below average, because the customers of any given business are, by definition, people who go out more often.",
    },
    {
      heading: "What it means",
      body:
        "Lower is better here. It measures how concentrated your customers' habits are, not how much they like you — someone who visits three places a month is not unhappy with any of them. It also says nothing about which businesses those were; we never identify them.",
    },
    {
      heading: "When your customers visit fewer places than typical",
      body:
        "You have habitual customers. That is worth protecting more than growing: consistency of opening hours, of staff, and of the specific thing they come for. Habits break on one bad experience far faster than they build on a good one.",
      emphasis: moreLoyal,
    },
    {
      heading: "When your customers visit more places than typical",
      body:
        "Your customers shop around. That is usually a routine problem rather than a quality one — being the default on a Tuesday morning matters more than being the best in town. Reliable opening, a standing regular's offer, and anything that makes you part of a commute are the levers that move it.",
      emphasis: !moreLoyal,
    },
  ];
}

export function CompetitiveSetCard({ metric }: { metric: PanelMetric<CompetitiveSetBreadth> }) {
  if (metric.status === "suppressed") {
    return <SuppressedCard title="Competitive set" message={metric.message} reason={metric.reason} />;
  }

  const { yourShoppersVenuesPerMonth, categoryAvgVenuesPerMonth } = metric.value;
  const moreLoyal = yourShoppersVenuesPerMonth < categoryAvgVenuesPerMonth;

  return (
    <Card className="flex flex-col gap-2">
      <InfoPopover title="Competitive set" label="How competitive set works" sections={infoSections(moreLoyal)} />
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
