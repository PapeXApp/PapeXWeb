// lib/receiptState.ts
//
// The single source of truth for "what should /r show?".
//
// This exists because the previous behaviour was a user-trust defect: a
// customer who tapped a real countertop device and whose receipt had
// expired (backend 404) was shown the *sample* receipt — BLUEBIRD COFFEE,
// a $12.42 total, "VISA •••• 4729" — with only a small banner above it
// that scrolled out of view. A screenshot of the middle of that page is
// indistinguishable from a real transaction record. Fabricated data must
// never stand in for a receipt the user believes is theirs.
//
// The taxonomy below is deliberately pure and separated from the React
// tree so it can be unit-tested without a DOM/test framework (this repo
// has no test runner — see the `tsx`-driven scripts in package.json).
//
//   REAL          sid supplied, backend returned bytes, the parse produced
//                 something a human can actually read -> render it. "Read"
//                 includes a full-page receipt bitmap: some POS software
//                 (Blaze) prints the whole receipt as an image rather than
//                 text — see hasVisibleContent below for where that line is
//                 drawn against the older "a logo alone is not a receipt".
//   NOT_AVAILABLE a sid was supplied but there is no receipt behind it
//                 (backend 404, unparseable/empty payload, or a sid that
//                 isn't even well-formed) -> a dedicated "not available"
//                 screen with ZERO sample content.
//   ERROR         transport/backend failure that is plausibly transient
//                 -> retry screen (unchanged behaviour).
//   DEMO          no sid at all (bare `/r`), OR the visitor explicitly
//                 opted in with `?demo=1`. Nobody tapped a real device in
//                 either case, so there is no real receipt being
//                 impersonated and a sample is honest — provided it is
//                 unmistakably marked.
//
// Note on malformed sids: the brief defines DEMO as "no sid supplied at
// all" (or an explicit `?demo=1` opt-in). A malformed sid (truncated NFC
// read, mangled share, hand-edited URL) means the visitor *does* believe
// they have a receipt, so it resolves to NOT_AVAILABLE rather than DEMO.
// Erring toward "we couldn't find it" is always safe; erring toward a
// sample is the bug being fixed.
//
// `demoRequested` (`?demo=1`) is checked first and wins outright, even over
// a well-formed sid — but this is never a fallback from a failed lookup:
// page.tsx skips the backend fetch entirely when `demoRequested` is true, so
// there is no "real lookup" to have failed. It exists so Nico can reach the
// unmistakably-marked sample on demand for a demo, without depending on the
// coincidence of an empty URL.

import type { ReceiptSummary } from "./receiptSummary";
import { hasStructure } from "./receiptSummary";

export type ReceiptPageState =
  | { kind: "real" }
  | { kind: "not_available"; reason: "malformed_sid" | "not_found" | "empty" }
  | { kind: "error" }
  | { kind: "demo" };

export interface VisibleContentOptions {
  /**
   * True when the payload decoded to a FULL-PAGE receipt bitmap — a Star
   * Line Mode raster job where the POS rendered the entire receipt to an
   * image instead of sending text (see lib/starRaster.ts). This is the whole
   * receipt, so it is genuine content even though there are no text lines.
   *
   * Deliberately NOT true for `Receipt.logo`, nor for a small raster band:
   * see the note on `hasVisibleContent` below for where the line sits and
   * why. Defaults to false, so every existing caller keeps text-only
   * semantics unchanged.
   */
  hasFullPageImage?: boolean;
}

/**
 * True when a parsed receipt has anything a human would actually see:
 * a full-page receipt bitmap, structured fields (merchant/total/items), or
 * at least one body line with non-whitespace text.
 *
 * A receipt that parses to nothing is functionally a missing receipt — the
 * old code rendered it as an empty, permanently-expanded "Original
 * receipt" box, which reads as a broken page. It is now NOT_AVAILABLE.
 *
 * Where the image line sits, and why
 * ----------------------------------
 * The original rule was "a receipt containing only a logo and no text is
 * still nothing to show", and that rule is intact. What changed is that
 * "image" is no longer a single category:
 *
 *   - A LOGO BAND (`Receipt.logo`) is decoration attached to a textual
 *     receipt. On its own it carries no merchant, no total, no items —
 *     showing it alone would be showing someone a picture instead of their
 *     purchase. Still not content. Never passed in here.
 *   - A FULL-PAGE RASTER (`Receipt.rasterPage.fullPage`) is the receipt: the
 *     merchant name, the line items and the total are all in those pixels,
 *     because the POS chose to print them as a picture. Refusing to show it
 *     tells a customer holding a real purchase that we lost it — the same
 *     class of user-trust defect this module was written to fix, pointed the
 *     other way.
 *
 * The two are told apart structurally (a whole-payload Star raster job with
 * no text anywhere vs. one band inside a text stream) AND by size — the
 * bitmap must clear lib/escpos.ts's `FULL_PAGE_MIN_*` floors, ~25mm of tape,
 * comfortably above any logo and far below any receipt. A merchant who
 * somehow sends only a logo as a Star raster still lands on NOT_AVAILABLE.
 */
export function hasVisibleContent(
  summary: ReceiptSummary,
  options: VisibleContentOptions = {},
): boolean {
  if (options.hasFullPageImage) return true;
  if (hasStructure(summary)) return true;
  return summary.bodyLines.some((line) => line.text.trim().length > 0);
}

export interface ResolveInput {
  /** The raw `sid` query param, already narrowed to a single value. */
  rawSid?: string;
  /**
   * True for an explicit `?demo=1` opt-in. Wins over everything else,
   * including a well-formed sid — see the module doc for why that's still
   * never a "fallback from a failed lookup". Defaults to false.
   */
  demoRequested?: boolean;
  /** Whether `rawSid` matched the backend's 16-lowercase-hex contract. */
  sidIsValid: boolean;
  /** Outcome of the upstream fetch. Omitted when no fetch was attempted. */
  fetchStatus?: "ok" | "not_found" | "error";
  /** Result of `hasVisibleContent` on the parsed bytes. Only read when fetchStatus === "ok". */
  parsedHasVisibleContent?: boolean;
}

export function resolveReceiptState(input: ResolveInput): ReceiptPageState {
  const { rawSid, demoRequested = false, sidIsValid, fetchStatus, parsedHasVisibleContent } = input;

  // Explicit opt-in (`?demo=1`). Checked first and wins outright — deliberate,
  // not a fallback: the caller never attempts a backend fetch when this is
  // set (see page.tsx), so there is no failed real lookup for this to be a
  // fallback from.
  if (demoRequested) {
    return { kind: "demo" };
  }

  // Bare `/r` — nobody tapped anything. Treat whitespace-only as absent.
  if (rawSid == null || rawSid.trim().length === 0) {
    return { kind: "demo" };
  }

  if (!sidIsValid) {
    return { kind: "not_available", reason: "malformed_sid" };
  }

  if (fetchStatus === "not_found") {
    return { kind: "not_available", reason: "not_found" };
  }

  if (fetchStatus === "error") {
    return { kind: "error" };
  }

  if (fetchStatus === "ok") {
    return parsedHasVisibleContent
      ? { kind: "real" }
      : { kind: "not_available", reason: "empty" };
  }

  // No fetch outcome for a well-formed sid should be unreachable; fail
  // toward the retry screen rather than toward fabricated data.
  return { kind: "error" };
}
