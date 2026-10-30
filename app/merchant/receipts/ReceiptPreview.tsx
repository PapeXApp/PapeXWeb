"use client";

// app/merchant/receipts/ReceiptPreview.tsx
//
// The live preview. Nothing here draws a card or a receipt: the config goes
// through the resolver mirror (lib/merchantReceipts/resolve.ts), then the same
// decoder and the same views a real tap uses (lib/cards/normalize.ts,
// app/r/cards/CardList.tsx, app/r/ui.tsx ReceiptView, app/r/chrome.tsx Shell).
// The receipt is this merchant's own most recent one.

import { useEffect, useMemo, useRef } from "react";
import { Tabs, Chip } from "../ui/primitives";
import { T } from "../ui/tokens";
import { Shell } from "@/app/r/chrome";
import { ReceiptView } from "@/app/r/ui";
import { CardList } from "@/app/r/cards/CardList";
import { MERCHANT_MOCK } from "@/lib/merchantApi";
import { parseEscPos } from "@/lib/escpos";
import { hasStructure as computeHasStructure, summarizeReceipt } from "@/lib/receiptSummary";
import { sampleReceiptLines } from "@/lib/sampleReceipt";
import { normalizeResolvedCards } from "@/lib/cards/normalize";
import { resolveConfig } from "@/lib/merchantReceipts/resolve";
import { LIVE_SURFACES, LOYALTY_SEGMENTS, type CardConfig, type LiveSurface, type LoyaltySegment } from "@/lib/merchantReceipts/types";
import { SEGMENT_COPY, SURFACE_COPY } from "./copy";

/** What the real tap would draw: the mirror's envelope through the real decoder. */
function cardsFor(config: CardConfig, state: PreviewState, segment: LoyaltySegment, surface: LiveSurface, sid: string, now: Date) {
  const { envelope } = resolveConfig({ config, sid, now, surface, segment, uploadedAt: now, state });
  return normalizeResolvedCards(envelope, sid, { now });
}

type PreviewState = { enabled: boolean; revokedCardIds: string[] };

/** Tailwind's xl, where the editor and preview sit side by side. */
const WIDE = "(min-width: 1280px)";

export function PreviewBody({
  config,
  state,
  segment,
  surface,
  receiptBytes,
  sid,
  now,
}: {
  config: CardConfig;
  state: PreviewState;
  segment: LoyaltySegment;
  surface: LiveSurface;
  receiptBytes: Uint8Array | null;
  sid: string;
  now: Date;
}) {
  const receipt = useMemo(() => {
    if (!receiptBytes) {
      const summary = summarizeReceipt(sampleReceiptLines);
      return { summary, hasStructure: computeHasStructure(summary), rasterPage: undefined, isSample: true };
    }
    const parsed = parseEscPos(receiptBytes);
    const summary = summarizeReceipt(parsed.lines);
    return { summary, hasStructure: computeHasStructure(summary), rasterPage: parsed.rasterPage?.fullPage ? parsed.rasterPage : undefined, isSample: false };
  }, [receiptBytes]);

  const cards = cardsFor(config, state, segment, surface, sid, now);
  const stack = cards.cards.length > 0 ? <div data-preview-stack><CardList cards={cards} now={now} /></div> : null;
  const paper = (
    <ReceiptView summary={receipt.summary} hasStructure={receipt.hasStructure} rasterPage={receipt.rasterPage} isSample={receipt.isSample} />
  );

  return (
    <Shell contained>
      {cards.layout.order === "cards-first" ? (
        <>
          {stack}
          {paper}
        </>
      ) : (
        <>
          {paper}
          {stack}
        </>
      )}
    </Shell>
  );
}

export function ReceiptPreview({
  config,
  state,
  segment,
  surface,
  onSegment,
  onSurface,
  receiptBytes,
  sid,
  offerCount,
  active,
}: {
  config: CardConfig;
  state: PreviewState;
  segment: LoyaltySegment;
  surface: LiveSurface;
  onSegment: (s: LoyaltySegment) => void;
  onSurface: (s: LiveSurface) => void;
  receiptBytes: Uint8Array | null;
  sid: string;
  offerCount: number;
  /** Below the wide layout, the preview is a tab: true while it's the one showing. */
  active: boolean;
}) {
  const now = new Date();
  const who = SEGMENT_COPY[segment].who;

  // Offers sit below a whole receipt by default, out of sight. A merchant editing
  // one has to see it change, so bring the stack into view whenever what it shows
  // could have changed. Wide screens scroll the framed box; narrower ones have no
  // inner scroller (a box inside a phone-sized page is miserable), so they scroll
  // the page, stopping under the sticky controls.
  const scroller = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const watched = JSON.stringify([config, segment, surface, receiptBytes?.length, active]);
  useEffect(() => {
    const box = scroller.current;
    const stack = box?.querySelector<HTMLElement>("[data-preview-stack]");
    if (!box || !stack || stack.offsetParent === null) return;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (window.matchMedia(WIDE).matches) {
      box.scrollTo({ top: stack.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 12, behavior });
    } else if (controls.current) {
      window.scrollTo({ top: window.scrollY + stack.getBoundingClientRect().top - controls.current.getBoundingClientRect().bottom - 12, behavior });
    }
  }, [watched]);

  // `offerCount` is what the draft asks for; `drawn` is what really came out. They
  // differ while a field is invalid, because the decoder drops a bad card whole.
  const drawn = cardsFor(config, state, segment, surface, sid, now).cards.filter((c) => c.type === "offer").length;
  const summary =
    !config.enabled || !state.enabled
      ? "Offers are off, so this customer sees only the receipt."
      : drawn < offerCount
        ? "This offer can't be drawn until the fields marked in red are fixed."
        : offerCount === 0
          ? `${who} gets no offer on the ${SURFACE_COPY[surface].label}.`
          : `${who} gets ${offerCount === 1 ? "this offer" : `these ${offerCount} offers`} on the ${SURFACE_COPY[surface].label}.`;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={controls}
        className="sticky top-[56px] z-10 -mx-4 flex flex-col gap-2 px-4 py-2 md:top-0 md:mx-0 md:px-0 xl:static xl:py-0"
        style={{ background: T.pageBg }}
      >
        <span className="hidden text-xs font-medium xl:block" style={{ color: T.textSecondary }}>
          Preview as
        </span>
        <div
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0"
          style={{ scrollbarWidth: "none" }}
          role="group"
          aria-label="Customer type"
        >
          {LOYALTY_SEGMENTS.map((s) => (
            <Chip key={s} className="shrink-0" selected={s === segment} onClick={() => onSegment(s)}>
              {SEGMENT_COPY[s].short}
            </Chip>
          ))}
        </div>
        <Tabs
          label="Where the customer opens it"
          value={surface}
          onChange={onSurface}
          tabs={LIVE_SURFACES.map((s) => ({ id: s, label: SURFACE_COPY[s].label }))}
        />
        <p className="text-sm" style={{ color: T.textSecondary }} aria-live="polite" data-testid="preview-caption">
          {summary}
        </p>
      </div>
      {/* Edge to edge on a phone, so the receipt is exactly the width a customer's is. */}
      <div
        className="-mx-4 overflow-hidden border-y md:mx-0 md:rounded-[28px] md:border"
        style={{ borderColor: T.glassBorder }}
        data-testid="receipt-preview"
      >
        <div ref={scroller} className="xl:max-h-[720px] xl:overflow-y-auto" data-testid="preview-scroller">
          <PreviewBody config={config} state={state} segment={segment} surface={surface} receiptBytes={receiptBytes} sid={sid} now={now} />
        </div>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>
        {MERCHANT_MOCK
          ? "Mock receipt."
          : receiptBytes
            ? "This is your most recent receipt."
            : "Sample receipt: yours will appear here after your first sale."}{" "}
        {surface === "web"
          ? "The page's Save to PapeX and store buttons sit under this and aren't drawn here."
          : "Drawn with the web tap page's cards. The app draws the same content natively, so spacing can differ."}
      </p>
    </div>
  );
}
