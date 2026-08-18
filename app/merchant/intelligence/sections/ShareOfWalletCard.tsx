// app/merchant/intelligence/sections/ShareOfWalletCard.tsx
//
// "You capture an estimated 41% of your customers' coffee spend. Six months
// ago: 47%." (use-cases doc §4, Family A1 — "arguably the safest framing of
// the entire seed concept"). Ratio + trend only, never a projected absolute
// dollar figure (plan.md fixed constraint #4).
//
// Takes `PanelMetric<ShareOfWallet>`, never a bare `ShareOfWallet` — a card
// physically cannot render this figure without also being handed its basis
// (plan.md §6).

import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../../ui/primitives";
import { T } from "../../ui/tokens";
import { BasisLine, InfoPopover, SuppressedCard, type InfoSection } from "../ui";
import type { PanelMetric, ShareOfWallet } from "@/lib/merchantApi";

/** `rising` is the only branch this card can identify on its own — telling a
 *  falling-share merchant WHICH kind of falling they have needs their traffic
 *  trend, which lives on the traffic index card. So the two falling branches
 *  point there rather than guessing. */
function infoSections(rising: boolean): InfoSection[] {
  return [
    {
      heading: "How this is calculated",
      body:
        "Of the category spending we can see from your customers — people who have linked a PapeX receipt both with you and elsewhere in your category — this is the share that happened at your business, weighted by money rather than by number of visits. The comparison figure is the same calculation over the equivalent earlier window.",
    },
    {
      heading: "What it means",
      body:
        "The level depends on how many of your customers happen to use PapeX elsewhere, so read it as approximate. The trend is the sturdier number: it is the same measurement taken twice, so whatever bias sits in the sample is largely in both readings and cancels out.",
    },
    {
      heading: "If share falls while your traffic holds",
      body:
        "The same customers are still coming and spending more of their category budget somewhere else. That is a basket problem rather than a footfall one — start with Demand you don't currently serve below. Check your traffic trend on the traffic index card to tell this apart from the next case.",
    },
    {
      heading: "If share and traffic fall together",
      body:
        "You are losing the customer, not the basket. Look at retention rather than range: Needs your attention above for anything operational, then who has stopped coming and when.",
    },
    {
      heading: "If share is rising",
      body:
        "Whatever you changed is working. Write down what it was and when you did it — this is the number that is hardest to reconstruct after the fact, and the easiest to stop doing by accident.",
      emphasis: rising,
    },
  ];
}

export function ShareOfWalletCard({ metric }: { metric: PanelMetric<ShareOfWallet> }) {
  if (metric.status === "suppressed") {
    return <SuppressedCard title="Share of wallet" message={metric.message} reason={metric.reason} />;
  }

  const { currentPct, priorPct, deltaPct } = metric.value;
  const up = deltaPct > 0;
  const flat = deltaPct === 0;

  return (
    <Card className="flex flex-col gap-2">
      <InfoPopover title="Share of wallet" label="How share of wallet works" sections={infoSections(up)} />
      <div className="flex items-baseline gap-2">
        <span className="font-barlow text-[28px] font-medium leading-none" style={{ color: T.text }}>
          {currentPct.toFixed(0)}%
        </span>
        <span className="text-xs" style={{ color: T.textSecondary }}>
          of your customers&apos; category spend
        </span>
      </div>
      {!flat && (
        <div className="flex items-center gap-1.5 text-sm">
          {up ? (
            <TrendingUp className="h-3.5 w-3.5" style={{ color: T.success }} strokeWidth={2.25} />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" style={{ color: T.error }} strokeWidth={2.25} />
          )}
          <span style={{ color: up ? T.success : T.error }}>
            {up ? "+" : ""}
            {deltaPct.toFixed(0)} pts
          </span>
          <span style={{ color: T.textMuted }}>vs. {priorPct.toFixed(0)}% previously</span>
        </div>
      )}
      <BasisLine basis={metric.basis} className="mt-1" />
    </Card>
  );
}
