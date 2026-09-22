// app/r/cards/EmailCaptureCard.tsx
//
// "Share my email with <merchant>". Two rules from Noah decide everything
// about this component:
//
// 1. PARTNER-ONLY. The card exists only for merchants flagged as partners.
//    The schema makes a non-partner capture card an invalid response, the
//    normalizer drops it, and this view refuses to draw without `partner`
//    as a last line. Three independent checks, because this is the one card
//    that asks a stranger for personal data.
//
// 2. NO REAL COLLECTION YET. A legal review (design D4) comes first. So in P0
//    this is INERT, whatever the card's `mode` says, and verifiably so from
//    this file:
//      - no <form>, and no `name` on any control: there is nothing for the
//        browser to submit, to any URL, ever;
//      - the email field (when the card has one) is `disabled` and
//        `readOnly`: nothing can be typed into it, so nothing is held;
//      - the submit control is a disabled `type="button"`;
//      - no client component, no handler, no script: nothing observes the
//        checkboxes, so nothing can report them. The browser toggles them
//        natively, which is exactly the behaviour they should have;
//      - no address is displayed, prefilled, requested or inferred.
//    When the card carries an email field it also says, in fixed copy, that
//    nothing entered is sent. P2 replaces this with the real client island
//    (consent record, double opt-in, the POST in design §2.4).
//
// The consent box is unchecked because the format has no way to say
// otherwise: there is no `checked` field to set.

import type { EmailCaptureCard } from "@/lib/cards/types";
import { safeHttpsUrl } from "@/lib/cards/url";
import { GlassCard, T } from "../chrome";
import styles from "./cards.module.css";
import { Mail } from "./icons";
import { WithHeading } from "./shared";

/** Shown under an inert email field. Fixed copy: it describes the renderer, not the merchant. */
export const INERT_CAPTURE_NOTE = "Preview only. Nothing you enter here is sent or stored.";

function InertCheckbox({ label, note }: { label: string; note?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer"
        /* `colorScheme: dark` so the native control paints for a dark surface:
           the card is always dark glass even when the page shell is light. */
        style={{ accentColor: T.orange, colorScheme: "dark" }}
      />
      <span className="min-w-0">
        <span className="block text-sm leading-snug" style={{ color: T.text }}>
          {label}
        </span>
        {note && (
          <span className="mt-1 block text-xs" style={{ color: T.textMuted }}>
            {note}
          </span>
        )}
      </span>
    </label>
  );
}

export function EmailCaptureCardView({ card, partner }: { card: EmailCaptureCard; partner: boolean }) {
  if (partner !== true) return null;
  const privacyHref = card.privacyUrl ? safeHttpsUrl(card.privacyUrl) : null;
  if (card.privacyUrl && privacyHref == null) return null;

  return (
    <WithHeading heading={card.heading}>
      <GlassCard emphasis="none" className="p-5">
        {card.kicker && (
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" style={{ color: T.textMuted }} strokeWidth={2} />
            <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: T.textMuted }}>
              {card.kicker}
            </span>
          </div>
        )}
        {card.title && (
          <p className="font-barlow mb-3 text-lg font-medium leading-snug" style={{ color: T.text }}>
            {card.title}
          </p>
        )}
        {card.input && (
          <div className="mb-3 flex gap-2">
            <input
              type="email"
              disabled
              readOnly
              aria-disabled="true"
              aria-label={card.input.placeholder}
              placeholder={card.input.placeholder}
              autoComplete="off"
              className={`${styles.inertField} min-w-0 flex-1 px-3 py-2.5 text-sm`}
            />
            <button type="button" disabled aria-disabled="true" className={`${styles.inertButton} shrink-0 px-4 text-sm font-semibold`}>
              {card.input.submitLabel}
            </button>
          </div>
        )}
        <InertCheckbox label={card.consentLabel} note={card.consentNote} />
        {card.ageAffirmationLabel && (
          <div className="mt-3">
            <InertCheckbox label={card.ageAffirmationLabel} />
          </div>
        )}
        {privacyHref && (
          <a
            href={privacyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-medium underline underline-offset-2"
            style={{ color: T.textSecondary }}
          >
            Privacy policy
          </a>
        )}
        {card.input && (
          <p className="mt-3 text-xs" style={{ color: T.textMuted }}>
            {INERT_CAPTURE_NOTE}
          </p>
        )}
      </GlassCard>
    </WithHeading>
  );
}
