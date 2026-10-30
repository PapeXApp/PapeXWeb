"use client";

// app/merchant/receipts/WhoGetsWhat.tsx
//
// The Doobie Nights model as one table: each customer type, and which offers it
// gets. Every chip edits that offer's `when` list. Picking a row also points the
// preview at that customer. A share appears only when it was counted from this
// merchant's real receipts (GET /merchant/cards/reach), never as an estimate.

import { Card, Chip } from "../ui/primitives";
import { T } from "../ui/tokens";
import { offerName, type OfferDraft } from "@/lib/merchantReceipts/draft";
import { LOYALTY_SEGMENTS, type CardReach, type LoyaltySegment } from "@/lib/merchantReceipts/types";
import { SEGMENT_COPY } from "./copy";

function percent(n: number, total: number): string {
  const p = (n / total) * 100;
  return p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`;
}

export function WhoGetsWhat({
  offers,
  reach,
  segment,
  disabled,
  onPreview,
  onToggle,
}: {
  offers: OfferDraft[];
  reach: CardReach | null;
  segment: LoyaltySegment;
  disabled: boolean;
  onPreview: (s: LoyaltySegment) => void;
  onToggle: (offerId: string, s: LoyaltySegment) => void;
}) {
  const on = offers.filter((o) => o.on);
  const hasReach = reach !== null && reach.total > 0;
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="font-barlow text-lg font-medium" style={{ color: T.text }}>
          Who gets what
        </h2>
        <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
          PapeX reads the customer type from the loyalty lines your POS prints on each receipt.
        </p>
      </div>
      <div className="flex flex-col">
        {LOYALTY_SEGMENTS.map((s) => {
          const active = s === segment;
          return (
            <div
              key={s}
              className="flex flex-col gap-2 border-t py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              style={{ borderColor: T.divider }}
            >
              <button
                type="button"
                onClick={() => onPreview(s)}
                aria-current={active ? "true" : undefined}
                className="min-w-0 flex-1 text-left outline-none focus-visible:underline"
              >
                <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium" style={{ color: active ? T.orange : T.text }}>
                  {SEGMENT_COPY[s].label}
                  {hasReach && (
                    <span className="text-xs font-normal" style={{ color: T.textMuted }} data-testid={`reach-${s}`}>
                      {percent(reach.segments[s], reach.total)} of receipts
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: T.textMuted }}>
                  {SEGMENT_COPY[s].detail}
                </span>
              </button>
              <div className="flex flex-wrap gap-1.5 sm:justify-end" role="group" aria-label={`Offers for ${SEGMENT_COPY[s].label}`}>
                {on.length === 0 && (
                  <span className="text-xs" style={{ color: T.textMuted }}>
                    No offers on
                  </span>
                )}
                {on.map((o) => (
                  <Chip key={o.id} selected={o.segments.includes(s)} disabled={disabled} onClick={() => onToggle(o.id, s)}>
                    {offerName(o)}
                  </Chip>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {hasReach && (
        <p className="text-xs" style={{ color: T.textMuted }}>
          Counted from your {reach.total.toLocaleString("en-US")} receipts in the last 30 days.
        </p>
      )}
    </Card>
  );
}
