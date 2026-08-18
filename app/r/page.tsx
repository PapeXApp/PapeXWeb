// app/r/page.tsx
//
// RDH receipt web fallback. A customer taps the countertop NFC device;
// iPhones with the App Clip installed launch it natively, but Android
// phones and non-App-Clip iPhones land here in a plain browser at
// `https://papex.app/r?sid=<16-hex>`. Before this page existed that was a
// raw 404 — see docs/RDH_WEB_FALLBACK_PLAN.md and docs/rdh_orchestrator.md.
//
// Deliberately a Server Component, not a client component with a
// browser-side fetch: the backend
// (Papex_RDH/lambdas/fetch/handler.js, GET /receipt/{sid}) has no CORS
// configured — it's designed for the App Clip's native URLSession, which
// isn't CORS-gated. A browser-side `fetch()` here would just fail silently.
// Fetching server-side sidesteps that entirely and matches the task's
// explicit instruction to never fetch from the browser.
//
// `loading.tsx` in this segment covers the "slow fetch" state automatically
// via the Suspense boundary Next.js creates around this async component.
//
// Fallback semantics — see lib/receiptState.ts for the full rationale. The
// short version: a sample receipt is only ever shown when NO sid was
// supplied. Previously an expired (404'd) receipt rendered the BLUEBIRD
// COFFEE sample under a banner that scrolled away, which a customer who had
// just tapped a real device could easily read as their own purchase. That is
// the defect this rewrite fixes.
//
//   no `sid` at all                      -> DEMO: sample, pinned banner,
//                                           watermarked body
//   `?demo=1` (with or without a sid)    -> DEMO, same as above — an
//                                           explicit opt-in, never a
//                                           fallback from a failed lookup
//                                           (the backend fetch is skipped
//                                           entirely in this case)
//   `sid` present but malformed          -> NOT_AVAILABLE (no sample)
//   `sid` valid, backend 404s            -> NOT_AVAILABLE (no sample)
//   `sid` valid, bytes parse to nothing  -> NOT_AVAILABLE (no sample)
//   any other backend/network error      -> retry screen, no sample
//   `sid` valid, real content            -> the real receipt
//   `sid` valid, whole-page raster image -> the real receipt. See below —
//                                           the bitmap leads only until OCR
//                                           lands, then the structured cards
//                                           do.
//
// BITMAP RECEIPTS AND THE ~46 SECOND WAIT.
//   Blaze POS prints the whole receipt as a picture (lib/starRaster.ts), so
//   the bytes this page fetches carry no text. The structured fields are
//   produced by an OCR pass in the RDH indexer and read back from
//   `GET /receipt/{sid}/parsed` (lib/rdhParsed.ts).
//
//   That pass takes ~46 s, measured against prod twice. The customer taps the
//   device ~15 s after the sale. The structured receipt therefore CANNOT exist
//   at first paint — so this page fetches whatever is ready, renders the image
//   immediately, and hands off to a client island (ReceiptUpgrade.tsx) that
//   polls and swaps in the designed cards the moment they exist. Waiting
//   server-side would mean a spinner for half a minute; not polling would mean
//   the extracted receipt is only visible to someone who reloads.
//
//   The parsed fetch is strictly an ENRICHMENT: if it fails, errors, or is
//   simply not ready, this page renders exactly what it rendered before OCR
//   existed. Nothing about the "Receipt not available" honesty rules above
//   depends on it — the raw byte fetch remains the sole authority on whether
//   a receipt exists at all.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchReceiptBytes, isValidSid } from "@/lib/rdh";
import { fetchParsedReceipt } from "@/lib/rdhParsed";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt, hasStructure as computeHasStructure } from "@/lib/receiptSummary";
import { hasVisibleContent, resolveReceiptState } from "@/lib/receiptState";
import { sampleReceiptLines } from "@/lib/sampleReceipt";
import {
  Shell,
  StateCard,
  DemoBanner,
  SampleFrame,
  ReceiptNotAvailable,
  ReceiptView,
  CtaRow,
  AppCta,
} from "./ui";
import RetryButton from "./RetryButton";
import ReceiptUpgrade from "./ReceiptUpgrade";

export const metadata: Metadata = {
  title: "Your PapeX Receipt",
  description: "View your digital receipt from PapeX.",
  robots: {
    index: false,
    follow: false,
  },
};

// Every render depends on a query param + a live upstream fetch — never
// prerender or cache this route.
export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[]; demo?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSid = Array.isArray(params.sid) ? params.sid[0] : params.sid;
  const rawDemo = Array.isArray(params.demo) ? params.demo[0] : params.demo;
  const uaHeader = (await headers()).get("user-agent") ?? "";
  const isAndroid = /android/i.test(uaHeader);
  const isIOS = /iphone|ipad|ipod/i.test(uaHeader);

  // Explicit demo opt-in (`?demo=1`) — Nico's ask so the sample stays
  // reachable on demand. Deliberately checked before any backend fetch: this
  // must never look like (or behave like) a fallback from a failed lookup.
  const demoRequested = rawDemo === "1";
  const sidIsValid = isValidSid(rawSid);

  // Only hit the backend for a well-formed sid, and never when the demo was
  // explicitly requested; every other case is decided locally by
  // resolveReceiptState.
  //
  // Both reads run CONCURRENTLY. They answer different questions (does this
  // receipt exist / has it been read yet) and serialising them would add the
  // parsed call's latency to a page whose whole design goal is showing
  // *something* fast.
  const [result, parsedResult] = sidIsValid && !demoRequested
    ? await Promise.all([fetchReceiptBytes(rawSid), fetchParsedReceipt(rawSid)])
    : [undefined, undefined];

  const receipt = result?.status === "ok" ? parseEscPos(result.bytes) : undefined;
  const parsed = receipt ? summarizeReceipt(receipt.lines) : undefined;

  // Enrichment only — never lets a receipt exist that the byte fetch says
  // doesn't, and never blocks one that it says does.
  const parsedPayload = parsedResult?.status === "ok" ? parsedResult.payload : null;

  // Blaze prints the entire receipt as a Star Line Mode raster bitmap
  // instead of sending text (see lib/starRaster.ts). When that's what
  // arrived, `parsed` is empty by construction and the bitmap IS the
  // receipt — so it has to count as visible content, or a real purchase
  // renders as "Receipt not available". A logo-sized band still doesn't
  // count; see lib/receiptState.ts's hasVisibleContent for the line.
  const rasterPage = receipt?.rasterPage?.fullPage ? receipt.rasterPage : undefined;

  const state = resolveReceiptState({
    rawSid,
    demoRequested,
    sidIsValid,
    fetchStatus: result?.status,
    parsedHasVisibleContent: parsed
      ? hasVisibleContent(parsed, { hasFullPageImage: rasterPage != null })
      : undefined,
  });

  // --- DEMO: bare /r. Nobody tapped anything, so no real receipt is being
  // impersonated and a sample is honest — but it is marked three redundant
  // ways (pinned banner, dashed frame with a persistent chip, repeating
  // diagonal watermark) so a screenshot of any slice still reads as fake.
  // CtaRow keeps the "Get PapeX" link and offers no share affordance.
  if (state.kind === "demo") {
    const summary = summarizeReceipt(sampleReceiptLines);
    return (
      <Shell>
        <DemoBanner />
        <SampleFrame>
          <ReceiptView summary={summary} hasStructure={computeHasStructure(summary)} isSample />
        </SampleFrame>
        <CtaRow isSample isIOS={isIOS} isAndroid={isAndroid} />
      </Shell>
    );
  }

  // --- NOT_AVAILABLE: a sid was supplied but there is no receipt behind it.
  // Zero sample content on this path, by design.
  if (state.kind === "not_available") {
    return (
      <Shell>
        <ReceiptNotAvailable>
          <RetryButton />
        </ReceiptNotAvailable>
        <AppCta isAndroid={isAndroid} />
      </Shell>
    );
  }

  // --- REAL. `logo` (see lib/escpos.ts) is threaded through separately from
  // `parsed`/`ReceiptSummary` on purpose: it must never factor into whether
  // a receipt counts as "visible" (see resolveReceiptState above and
  // lib/receiptState.ts) — a logo-only stream with no text still routes to
  // NOT_AVAILABLE above, before this branch is ever reached, and a logo
  // alone can never make that happen. `rasterPage` is the deliberate
  // exception and the reason it is a different field: a full-page Blaze
  // bitmap is the receipt itself, not decoration on one.
  if (state.kind === "real" && parsed) {
    return (
      <Shell>
        {/* `rawSid` is re-checked purely so TypeScript can narrow it — a
            raster page can only exist after a successful fetch for a valid
            sid, so this is never false in practice. */}
        {rasterPage && rawSid ? (
          // A bitmap receipt. Its structured form either already exists (the
          // customer arrived late, or reloaded) or is ~30 s away, so this
          // branch hands off to the island that can render both and move
          // between them. A text receipt never comes through here — it has
          // nothing to wait for, so it stays fully server-rendered and ships
          // no polling code at all.
          <ReceiptUpgrade
            sid={rawSid}
            fallbackSummary={parsed}
            rasterPage={rasterPage}
            initialPayload={parsedPayload}
          />
        ) : (
          <ReceiptView
            summary={parsed}
            hasStructure={computeHasStructure(parsed)}
            logo={receipt?.logo}
          />
        )}
        <CtaRow sid={rawSid} isSample={false} isIOS={isIOS} isAndroid={isAndroid} />
      </Shell>
    );
  }

  // --- ERROR: transient transport/backend failure. Unchanged. Also the
  // landing spot for the (unreachable) case where the state says "real" but
  // no parse survived — failing toward retry is always safer than failing
  // toward fabricated content.
  return (
    <Shell>
      <StateCard
        icon="warning"
        title="Couldn't load your receipt"
        message="We're having trouble right now — try again in a moment."
      >
        <RetryButton />
      </StateCard>
      <AppCta isAndroid={isAndroid} />
    </Shell>
  );
}
