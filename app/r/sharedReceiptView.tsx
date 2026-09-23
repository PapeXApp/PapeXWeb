// app/r/sharedReceiptView.tsx
//
// Renders the `rid` (peer-to-peer share link) branch of `/r`, split out of
// page.tsx so it takes an already-resolved `Platform` rather than calling
// `next/headers`' `headers()` itself, which throws outside a real Next.js
// request (see lib/receiptRouting.ts's module doc for the same reasoning).
//
// This file itself is NOT unit-tested directly: every component it renders
// ultimately imports ./glass.module.css (via ./ui / ./chrome), and this
// repo's test runner (`tsx`, no bundler — see package.json) can't load a CSS
// Module outside Next's own build. That's a pre-existing constraint, not new
// here — no existing test in this repo renders anything from ./ui either.
// The decision logic this file merely switches on lives in
// lib/sharedReceipt.ts's `resolveSharedReceiptPageState`, which IS unit
// tested (lib/sharedReceipt.test.ts), and the actual rendered output is
// covered by local dev-server verification instead (see the branch's PR
// notes / task report).
//
// HONESTY RULES — same standard lib/receiptState.ts sets for `sid`, applied
// to `rid`:
//   malformed rid           -> NOT_AVAILABLE, no fetch attempted
//   rid well-formed, 404    -> NOT_AVAILABLE
//   rid well-formed, nothing usable in the payload -> NOT_AVAILABLE
//   network/backend failure -> retry screen
//   rid well-formed, usable receipt -> the real receipt
// The sample is never reachable from this function. A `rid` link means a
// real person shared a real receipt; showing BLUEBIRD COFFEE for any failure
// here would be exactly the user-trust defect lib/receiptState.ts was
// written to fix, for a different query param.
//
// CTA. Deliberately `AppCta` alone (store links), never `CtaRow`/
// `SaveToPapex`: that island's claim flow POSTs `{sid}` to
// `/api/rdh/claim`, the RDH single-owner-per-sid claim contract, which has
// nothing to do with a shared *receipt* id. "Save this shared receipt to my
// account" is a real, wanted feature (see the diagnosis's Appendix A) but a
// different one — an `acceptLinkShare`-style endpoint that doesn't exist
// yet — so this renders no claim affordance at all rather than wiring one up
// to the wrong backend.

import { resolveSharedReceiptPageState } from "@/lib/sharedReceipt";
import { parsedToSummary } from "@/lib/rdhParsed";
import { hasStructure as computeHasStructure } from "@/lib/receiptSummary";
import type { Platform } from "@/lib/storeLinks";
import { Shell, StateCard, ReceiptNotAvailable, ReceiptView, AppCta } from "./ui";
import RetryButton from "./RetryButton";

function NotAvailable({ platform }: { platform: Platform }) {
  return (
    <Shell>
      <ReceiptNotAvailable>
        <RetryButton />
      </ReceiptNotAvailable>
      <AppCta platform={platform} />
    </Shell>
  );
}

function ErrorState({ platform }: { platform: Platform }) {
  return (
    <Shell>
      <StateCard
        icon="warning"
        title="Couldn't load your receipt"
        message="We're having trouble right now — try again in a moment."
      >
        <RetryButton />
      </StateCard>
      <AppCta platform={platform} />
    </Shell>
  );
}

export async function renderSharedReceipt(rid: string, platform: Platform) {
  // All of the "what should this show" logic lives in
  // resolveSharedReceiptPageState (lib/sharedReceipt.ts), which is unit
  // tested directly. This function's only job is to switch on the result.
  const state = await resolveSharedReceiptPageState(rid);

  if (state.kind === "not_available") {
    return <NotAvailable platform={platform} />;
  }
  if (state.kind === "error") {
    return <ErrorState platform={platform} />;
  }

  const summary = parsedToSummary(state.receipt);

  return (
    <Shell>
      <ReceiptView summary={summary} hasStructure={computeHasStructure(summary)} />
      <AppCta platform={platform} />
    </Shell>
  );
}
