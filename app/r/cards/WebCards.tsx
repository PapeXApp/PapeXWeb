// app/r/cards/WebCards.tsx
//
// Production `/r`'s card stack: the server-resolved cards for a real receipt
// (surface=web, lib/cards/fetchCards.ts), drawn by the same CardList the demo
// routes use. Server components only, like everything under app/r/cards: no
// client JS ships for cards.
//
// TWO WAYS IN, ONE STACK (app/r/page.tsx picks):
//   - INLINE. The cards call finished before the receipt was ready, so the
//     page places `WebCardStack` directly: above the receipt for
//     `cards-first`, below it (before the CTA row) for `receipt-first`. No
//     Suspense, no streaming, no layout shift.
//   - STREAMED. The receipt was ready first, so the receipt renders without
//     waiting and the page leaves one `StreamedCards` slot above the receipt
//     and one below it, each in its own <Suspense fallback={null}>. When the
//     cards call settles, the slot matching `layout.order` fills (once, with
//     the enter fade) and the other stays empty. Nothing is reserved while
//     waiting: the fallback is null.
// Either way, zero valid cards renders nothing at all.

import type { NormalizedCards } from "@/lib/cards/normalize";
import type { LayoutOrder } from "@/lib/cards/types";
import type { WebCardsTask } from "@/lib/cards/fetchCards";
import { CardList } from "./CardList";
import styles from "./cards.module.css";

export function WebCardStack({ cards, now, entering = false }: { cards: NormalizedCards; now: Date; entering?: boolean }) {
  if (cards.cards.length === 0) return null;
  return <CardList cards={cards} now={now} className={entering ? styles.enter : undefined} />;
}

/**
 * One of the two streamed slots. Awaits the already-running cards request
 * (never started here) and draws the stack only if this slot is where
 * `layout.order` puts it.
 */
export async function StreamedCards({ task, position, now }: { task: WebCardsTask; position: LayoutOrder; now: Date }) {
  const { cards } = await task.promise;
  if (cards.cards.length === 0 || cards.layout.order !== position) return null;
  return <WebCardStack cards={cards} now={now} entering />;
}
