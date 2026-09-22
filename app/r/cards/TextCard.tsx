// app/r/cards/TextCard.tsx
//
// A banner or message. `voice` picks the substrate, never the author's taste:
// PapeX speaks on dark glass, the merchant on the voucher's opaque warm paint.

import type { TextCard } from "@/lib/cards/types";
import { GlassCard, T } from "../chrome";
import styles from "./cards.module.css";
import { ICONS, VOUCHER_INK, VOUCHER_INK_SOFT, WithHeading } from "./shared";

export function TextCardView({ card }: { card: TextCard }) {
  const Icon = card.icon ? ICONS[card.icon] : undefined;
  const merchant = card.voice === "merchant";
  const ink = merchant ? VOUCHER_INK : T.text;
  const inkSoft = merchant ? VOUCHER_INK_SOFT : T.textSecondary;

  const content = (
    <>
      {(Icon || card.title) && (
        <div className="mb-2 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0" style={{ color: merchant ? VOUCHER_INK_SOFT : T.orange }} strokeWidth={2} />}
          {card.title && (
            <p className="font-barlow text-lg font-medium leading-snug" style={{ color: ink }}>
              {card.title}
            </p>
          )}
        </div>
      )}
      <p className="text-sm leading-relaxed" style={{ color: inkSoft }}>
        {card.body}
      </p>
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
