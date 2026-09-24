// app/r/cards/InsightCard.tsx
//
// PapeX's own speech: dark glass under the PapeX mark, deliberately unlike the
// merchant's voucher. Headline and body arrive already rendered from the same
// evidence the rows below show, so prose and figures cannot disagree.

import type { InsightCard } from "@/lib/cards/types";
import { GlassCard, T } from "../chrome";
import { WithHeading } from "./shared";

export function InsightCardView({ card }: { card: InsightCard }) {
  const rows = card.evidence;
  return (
    <WithHeading heading={card.heading}>
      <GlassCard emphasis="standard" className="p-6">
        <div className="flex items-center gap-2">
          {/* The PapeX mark: this is the card where PapeX is the speaker. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/main_logo.png" alt="PapeX" className="h-4 w-auto shrink-0" style={{ objectFit: "contain" }} />
          {card.kicker && (
            <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: T.textMuted }}>
              {card.kicker}
            </span>
          )}
        </div>

        <h2 className="font-barlow mt-3 text-xl font-medium leading-snug" style={{ color: T.text }}>
          {card.headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          {card.body}
        </p>

        <div className="mt-4 flex flex-col" style={{ borderTop: `1px solid ${T.divider}` }}>
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-2"
              style={i === rows.length - 1 ? undefined : { borderBottom: `1px solid ${T.divider}` }}
            >
              <span className="min-w-0 flex-1 text-sm" style={{ color: T.textMuted }}>
                {row.label}
              </span>
              <span className="font-barlow shrink-0 text-sm font-medium" style={{ color: T.text }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {card.footnote && (
          <p className="mt-3 text-xs" style={{ color: T.textMuted }}>
            {card.footnote}
          </p>
        )}
      </GlassCard>
    </WithHeading>
  );
}
