// app/r/cards/CardList.tsx
//
// Renders a NORMALIZED card list (lib/cards/normalize.ts), in order, under
// the receipt. The type only accepts normalizer output, so nothing reaches a
// card view without having been validated field by field.
//
// Each card is rendered through a guarded call: the view function runs
// inside try/catch here rather than as a deferred element, so a throw in one
// card's own code costs that card and never the page (and never the receipt
// above it). Anything that renders nothing leaves no trace; an empty list
// renders nothing at all, exactly the page that shipped before cards existed.
//
// Server component, no client islands (see ./shared.tsx).

import { Fragment, type ReactNode } from "react";
import type { Card } from "@/lib/cards/types";
import type { NormalizedCards } from "@/lib/cards/normalize";
import { CtaCardView } from "./CtaCard";
import { DisclosureCardView } from "./DisclosureCard";
import { EmailCaptureCardView } from "./EmailCaptureCard";
import { InsightCardView } from "./InsightCard";
import { LoyaltyCardView } from "./LoyaltyCard";
import { OfferCardView } from "./OfferCard";
import { SavingsCardView } from "./SavingsCard";
import { TextCardView } from "./TextCard";

interface RenderContext {
  now: Date;
  partner: boolean;
}

function renderCard(card: Card, ctx: RenderContext): ReactNode {
  switch (card.type) {
    case "text":
      return TextCardView({ card });
    case "offer":
      return OfferCardView({ card, now: ctx.now });
    case "cta":
      return CtaCardView({ card });
    case "savings":
      return SavingsCardView({ card });
    case "loyalty":
      return LoyaltyCardView({ card });
    case "insight":
      return InsightCardView({ card });
    case "emailCapture":
      return EmailCaptureCardView({ card, partner: ctx.partner });
    case "disclosure":
      return DisclosureCardView({ card });
    default:
      // Unreachable for normalizer output; an unknown type is skipped, never guessed at.
      return null;
  }
}

function renderCardSafely(card: Card, ctx: RenderContext): ReactNode {
  try {
    return renderCard(card, ctx);
  } catch {
    return null;
  }
}

export function CardList({ cards, now }: { cards: NormalizedCards; now: Date }) {
  const ctx: RenderContext = { now, partner: cards.merchant.partner === true };
  const rendered = cards.cards
    .map((card) => ({ id: card.id, node: renderCardSafely(card, ctx) }))
    .filter((r) => r.node != null && r.node !== false);
  if (rendered.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {rendered.map((r) => (
        <Fragment key={r.id}>{r.node}</Fragment>
      ))}
    </div>
  );
}
