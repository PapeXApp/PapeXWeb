// app/r/cards/shared.tsx
//
// Pieces every card view shares. Server components only: nothing under
// app/r/cards may import a client island (same rule as ../chrome.tsx and
// ../ui.tsx), which keeps the demo routes' module graph free of the claim
// flow and the Firebase auth SDK.
//
// UNTRUSTED TEXT. Every string a card view draws came over the wire. It is
// only ever rendered as a React text child, which React escapes; no card view
// builds HTML, sets innerHTML, or puts a card string into a className, a
// style value or an event handler. The one card string that reaches an
// attribute is a link's href, and only after lib/cards/url.ts has allowed it.
// lib/cards/cards.test.ts and ./cards.test.tsx hold that line.

import type { ReactNode } from "react";
import { Bag, Clock, Gift, Info, Mail, Sparkles, Star, Tag, type LucideIcon } from "./icons";
import type { CardIcon } from "@/lib/cards/types";
import { S } from "../chrome";

/** Navy ink on the merchant's orange ramp: ~5.2:1, over the 3.0 floor brandContrast.ts sets. */
export const VOUCHER_INK = "#00121D";
export const VOUCHER_INK_SOFT = "rgba(0, 18, 29, 0.72)";

/** Section heading on the page background, matching ItemsCard / TotalsCard (design kit §8). */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-barlow mb-2 px-1 text-xl font-medium" style={{ color: S.text }}>
      {children}
    </p>
  );
}

/** A card with its optional section heading. No heading: the card alone, with no wrapper. */
export function WithHeading({ heading, children }: { heading?: string; children: ReactNode }) {
  if (!heading) return <>{children}</>;
  return (
    <div>
      <SectionTitle>{heading}</SectionTitle>
      {children}
    </div>
  );
}

export const ICONS: Record<CardIcon, LucideIcon> = {
  tag: Tag,
  gift: Gift,
  star: Star,
  mail: Mail,
  info: Info,
  sparkle: Sparkles,
  clock: Clock,
  bag: Bag,
};
