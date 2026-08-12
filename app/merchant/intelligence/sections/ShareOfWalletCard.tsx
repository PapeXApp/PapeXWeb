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
import { BasisLine, SuppressedCard } from "../ui";
import type { PanelMetric, ShareOfWallet } from "@/lib/merchantApi";

export function ShareOfWalletCard({ metric }: { metric: PanelMetric<ShareOfWallet> }) {
  if (metric.status === "suppressed") {
    return <SuppressedCard title="Share of wallet" message={metric.message} reason={metric.reason} />;
  }

  const { currentPct, priorPct, deltaPct } = metric.value;
  const up = deltaPct > 0;
  const flat = deltaPct === 0;

  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
        Share of wallet
      </span>
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
