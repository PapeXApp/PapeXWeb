// app/r/cards/SavingsCard.tsx
//
// "You saved $X", as a ledger. The composition rows are the point: an
// unbroken total reads like marketing, itemised components read like a
// ledger. Every figure arrives formatted from the resolver.

import type { SavingsCard } from "@/lib/cards/types";
import { GlassCard, T } from "../chrome";
import { TrendingDown } from "./icons";
import { WithHeading } from "./shared";

export function SavingsCardView({ card }: { card: SavingsCard }) {
  const components = card.components ?? [];
  return (
    <WithHeading heading={card.heading}>
      <GlassCard emphasis="standard" className="p-6">
        <div className="flex items-baseline gap-2">
          <TrendingDown className="h-5 w-5 shrink-0 self-center" style={{ color: T.success }} strokeWidth={2} />
          <span className="font-barlow text-2xl font-medium" style={{ color: T.success }}>
            {card.total}
          </span>
          <span className="text-base" style={{ color: T.textSecondary }}>
            {card.totalLabel}
          </span>
        </div>
        {components.length > 0 && (
          <div className="mt-4 flex flex-col">
            {components.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 py-2"
                style={i === components.length - 1 ? undefined : { borderBottom: `1px solid ${T.divider}` }}
              >
                <span className="min-w-0 flex-1 truncate text-sm" style={{ color: T.textSecondary }}>
                  {c.label}
                </span>
                <span className="font-barlow shrink-0 text-sm font-medium" style={{ color: T.success }}>
                  {c.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </WithHeading>
  );
}
