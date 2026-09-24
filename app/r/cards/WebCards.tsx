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
//
// SAVE-LINK (lib/offerSaveLink.ts, behind OFFER_SAVE_LINK). `saveLinkHref`
// is app/r/page.tsx's one decision (flag + iOS UA); this file's only job is
// to place `SaveInAppLink` directly under the stack — never on its own,
// since a save hand-off with no card to save makes no sense, and never when
// there is no OFFER card specifically (a text/cta/savings-only stack has
// nothing the app's Save button would act on). Passing `undefined` (the
// flag-off / non-iOS case) renders exactly what shipped before this file
// knew about save links — byte-identical, checked by
// app/r/offerSaveLink.test.tsx against the existing parity/cards goldens.

import type { NormalizedCards } from "@/lib/cards/normalize";
import type { LayoutOrder } from "@/lib/cards/types";
import type { WebCardsTask } from "@/lib/cards/fetchCards";
import { CardList } from "./CardList";
import { SaveInAppLink } from "../ui";
import styles from "./cards.module.css";

export function WebCardStack({
  cards,
  now,
  entering = false,
  saveLinkHref,
}: {
  cards: NormalizedCards;
  now: Date;
  entering?: boolean;
  saveLinkHref?: string;
}) {
  if (cards.cards.length === 0) return null;
  const showSaveLink = saveLinkHref != null && cards.cards.some((c) => c.type === "offer");
  return (
    <>
      <CardList cards={cards} now={now} className={entering ? styles.enter : undefined} />
      {showSaveLink ? <SaveInAppLink href={saveLinkHref!} /> : null}
    </>
  );
}

/**
 * One of the two streamed slots. Awaits the already-running cards request
 * (never started here) and draws the stack only if this slot is where
 * `layout.order` puts it.
 */
export async function StreamedCards({
  task,
  position,
  now,
  saveLinkHref,
}: {
  task: WebCardsTask;
  position: LayoutOrder;
  now: Date;
  saveLinkHref?: string;
}) {
  const { cards } = await task.promise;
  if (cards.cards.length === 0 || cards.layout.order !== position) return null;
  return <WebCardStack cards={cards} now={now} entering saveLinkHref={saveLinkHref} />;
}
