// app/r/cards/DisclosureCard.tsx
//
// One calm, muted sentence on the page background, no card: the same
// treatment as DemoDisclosure in ../ui.tsx, which this replaces on the demo
// routes. First in the list, so it sits directly under the receipt.

import type { DisclosureCard } from "@/lib/cards/types";
import { S } from "../chrome";
import { WithHeading } from "./shared";

export function DisclosureCardView({ card }: { card: DisclosureCard }) {
  return (
    <WithHeading heading={card.heading}>
      <p className="px-1 text-center text-xs" style={{ color: S.textMuted }}>
        {card.text}
      </p>
    </WithHeading>
  );
}
