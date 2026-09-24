// app/r/cards/OfferCard.tsx
//
// The merchant's offer, as a paper voucher: opaque warm paint, notched edges,
// a perforation, the deal figure set large. Different substrate from every
// PapeX card on purpose (the TWO VOICES note in ../enrichment.tsx).
//
// THE COUNTDOWN CHIP is the only thing on a card the client computes: days
// left from `validity.expiresAt` and the page's clock, by the rule in
// lib/cards/countdown.ts. Once the window closes the chip is simply absent.
// There is no "Expired" state.
//
// ACTIONS ARE INERT IN P0. "Save" renders as the voucher's printed action
// line, not a button: it is not focusable and does nothing. A demo must
// never offer an action that can fail, and real saving (claim + coupon
// ledger, design §7) is P2.

import type { OfferCard, OfferRedemption } from "@/lib/cards/types";
import { encodeBarcode, type BarcodeModules } from "@/lib/cards/barcode";
import { countdownDays, formatCountdown } from "@/lib/cards/countdown";
import voucher from "../voucher.module.css";
import styles from "./cards.module.css";
import { Barcode } from "./Barcode";
import { Ticket } from "./icons";
import { VOUCHER_INK, VOUCHER_INK_SOFT, WithHeading } from "./shared";

function Redemption({ redemption, barcode }: { redemption: OfferRedemption; barcode: BarcodeModules | null }) {
  return (
    <div className="mt-4">
      {redemption.caption && (
        <p className="mb-1.5 text-xs font-medium" style={{ color: VOUCHER_INK_SOFT }}>
          {redemption.caption}
        </p>
      )}
      {redemption.type === "code" ? (
        <div className={`${styles.codeBox} px-4 py-3 text-center`}>
          <span className="font-mono text-lg font-semibold tracking-[3px]" style={{ color: VOUCHER_INK }}>
            {redemption.code}
          </span>
        </div>
      ) : barcode ? (
        <Barcode barcode={barcode} text={redemption.text ?? redemption.value} />
      ) : null}
    </div>
  );
}

/** The inert Save action: a printed instruction on the stub, not a control. */
function InertSaveAction({ label }: { label: string }) {
  return (
    <div
      className="mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold uppercase tracking-[1px]"
      style={{ border: `1px dashed ${VOUCHER_INK}`, color: VOUCHER_INK }}
    >
      {label}
    </div>
  );
}

export function OfferCardView({ card, now }: { card: OfferCard; now: Date }) {
  const daysLeft = card.validity?.countdown ? countdownDays(card.validity.expiresAt, now) : null;
  // Encoded here, in the body CardList calls inside its guard: an encoder
  // throw drops this whole card instead of rendering a voucher minus its code.
  const barcode =
    card.redemption?.type === "barcode" ? encodeBarcode(card.redemption.symbology, card.redemption.value) : null;
  return (
    <WithHeading heading={card.heading}>
      <div className={voucher.ticket}>
        {/* ---- The field: the deal figure, large, with its qualifier ---- */}
        <div className={`${voucher.field} px-6 pb-6 pt-5`}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {card.kicker && (
                <div className="flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 shrink-0" style={{ color: VOUCHER_INK_SOFT }} strokeWidth={2} />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[1.2px]"
                    style={{ color: VOUCHER_INK_SOFT }}
                  >
                    {card.kicker}
                  </span>
                </div>
              )}
              <div className="font-barlow mt-1 text-5xl font-semibold leading-none" style={{ color: VOUCHER_INK }}>
                {card.valueLabel}
                {card.valueSuffix && <span className="ml-2 text-xl font-medium">{card.valueSuffix}</span>}
              </div>
              {card.qualifier && (
                <p className="mt-1.5 text-sm font-medium" style={{ color: VOUCHER_INK_SOFT }}>
                  {card.qualifier}
                </p>
              )}
            </div>
            {daysLeft != null && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${voucher.daysChip}`}>
                {formatCountdown(daysLeft)}
              </span>
            )}
          </div>
        </div>

        {/* ---- The stub: the offer, its terms, how to redeem, the printed action line ---- */}
        <div className={`${voucher.stub} px-6 pb-5 pt-5`}>
          <p className="text-sm font-medium leading-snug" style={{ color: VOUCHER_INK }}>
            {card.title}
          </p>
          {card.terms && (
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: VOUCHER_INK_SOFT }}>
              {card.terms}
            </p>
          )}
          {card.compliance && (
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: VOUCHER_INK_SOFT }}>
              {card.compliance.licenseLine}
            </p>
          )}
          {card.redemption && <Redemption redemption={card.redemption} barcode={barcode} />}
          {(card.actions ?? []).map((action, i) =>
            action.type === "save" ? <InertSaveAction key={i} label={action.label} /> : null,
          )}
        </div>
      </div>
    </WithHeading>
  );
}
