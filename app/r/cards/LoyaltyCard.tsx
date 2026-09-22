// app/r/cards/LoyaltyCard.tsx
//
// The merchant's points programme, display-only. `note` is required by the
// format and always drawn: it is the line that keeps this block clear of
// anything that reads as PapeX holding value at somebody else's register.

import type { CSSProperties } from "react";
import type { LoyaltyCard } from "@/lib/cards/types";
import { GlassCard, T } from "../chrome";
import voucher from "../voucher.module.css";
import { Award } from "./icons";
import { WithHeading } from "./shared";

export function LoyaltyCardView({ card }: { card: LoyaltyCard }) {
  // The normalizer guarantees 0..1; clamp again so a style value can never be
  // anything but a percentage.
  const pct = card.progress ? Math.round(Math.min(1, Math.max(0, card.progress.fraction)) * 100) : 0;
  return (
    <WithHeading heading={card.heading}>
      <GlassCard emphasis="neutral" className="p-6">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 shrink-0" style={{ color: T.orange }} strokeWidth={2} />
          <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: T.orange }}>
            {card.programName}
          </span>
          {card.earned && (
            <span className="ml-auto font-barlow text-base font-medium" style={{ color: T.success }}>
              {card.earned}
            </span>
          )}
        </div>

        {(card.balance || card.balanceWorth) && (
          <div className="mt-4 flex items-baseline gap-2">
            {card.balance && (
              <>
                <span className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
                  {card.balance.value}
                </span>
                <span className="text-base" style={{ color: T.textSecondary }}>
                  {card.balance.label}
                </span>
              </>
            )}
            {card.balanceWorth && (
              <span className="ml-auto font-barlow text-base font-medium" style={{ color: T.blue }}>
                {card.balanceWorth}
              </span>
            )}
          </div>
        )}

        {card.progress && (
          <>
            <div className={`mt-3 ${voucher.loyaltyTrack}`} aria-hidden>
              <div className={voucher.loyaltyFill} style={{ "--pct": `${pct}%` } as CSSProperties} />
            </div>
            <p className="mt-2 text-sm" style={{ color: T.textSecondary }}>
              {card.progress.text}
            </p>
          </>
        )}

        <p className="mt-3 text-xs" style={{ color: T.textMuted }}>
          {card.note}
        </p>
      </GlassCard>
    </WithHeading>
  );
}
