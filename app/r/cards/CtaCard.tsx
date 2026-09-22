// app/r/cards/CtaCard.tsx
//
// A link out: menu, order online, leave a review. The href is the one card
// string that reaches an attribute, and it only gets here after
// lib/cards/url.ts allowed it (https, dotted ASCII host, no userinfo, no
// port). The check runs again at render time: a URL that fails it renders no
// card at all, never a dead or downgraded link.

import type { CtaCard } from "@/lib/cards/types";
import { safeHttpsUrl } from "@/lib/cards/url";
import { GlassCard, T } from "../chrome";
import styles from "./cards.module.css";
import { VOUCHER_INK, VOUCHER_INK_SOFT, WithHeading } from "./shared";

export function CtaCardView({ card }: { card: CtaCard }) {
  const href = safeHttpsUrl(card.url);
  if (href == null) return null;
  const merchant = card.voice === "merchant";
  const primary = card.style === "primary";

  const linkStyle = merchant
    ? primary
      ? { background: VOUCHER_INK, color: "#FFFFFF" }
      : { border: `1px solid ${VOUCHER_INK}`, color: VOUCHER_INK }
    : primary
      ? { background: T.orange, color: T.navy }
      : { border: `1px solid ${T.divider}`, color: T.text };

  const content = (
    <>
      {card.title && (
        <p className="font-barlow text-lg font-medium leading-snug" style={{ color: merchant ? VOUCHER_INK : T.text }}>
          {card.title}
        </p>
      )}
      {card.body && (
        <p className="mt-1 text-sm leading-relaxed" style={{ color: merchant ? VOUCHER_INK_SOFT : T.textSecondary }}>
          {card.body}
        </p>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${card.title || card.body ? "mt-4 " : ""}block rounded-xl px-4 py-3 text-center text-sm font-semibold`}
        style={linkStyle}
      >
        {card.label}
      </a>
    </>
  );

  return (
    <WithHeading heading={card.heading}>
      {merchant ? (
        <div className={`${styles.merchantPanel} p-5`}>{content}</div>
      ) : (
        <GlassCard emphasis="neutral" className="p-5">
          {content}
        </GlassCard>
      )}
    </WithHeading>
  );
}
