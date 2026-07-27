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
//                 something a human can actually read -> render it.
//   NOT_AVAILABLE a sid was supplied but there is no receipt behind it
//                 (backend 404, unparseable/empty payload, or a sid that
//                 isn't even well-formed) -> a dedicated "not available"
//                 screen with ZERO sample content.
//   ERROR         transport/backend failure that is plausibly transient
//                 -> retry screen (unchanged behaviour).
//   DEMO          no sid at all (bare `/r`). Nobody tapped anything, so
//                 there is no real receipt being impersonated and a sample
//                 is honest — provided it is unmistakably marked.
//
// Note on malformed sids: the brief defines DEMO as "no sid supplied at
// all". A malformed sid (truncated NFC read, mangled share, hand-edited
// URL) means the visitor *does* believe they have a receipt, so it resolves
// to NOT_AVAILABLE rather than DEMO. Erring toward "we couldn't find it" is
// always safe; erring toward a sample is the bug being fixed.

import type { ReceiptSummary } from "./receiptSummary";
import { hasStructure } from "./receiptSummary";

export type ReceiptPageState =
  | { kind: "real" }
  | { kind: "not_available"; reason: "malformed_sid" | "not_found" | "empty" }
  | { kind: "error" }
  | { kind: "demo" };

/**
 * True when a parsed receipt has anything a human would actually see:
 * either structured fields (merchant/total/items) or at least one body
 * line with non-whitespace text.
 *
 * A receipt that parses to nothing is functionally a missing receipt — the
 * old code rendered it as an empty, permanently-expanded "Original
 * receipt" box, which reads as a broken page. It is now NOT_AVAILABLE.
 */
export function hasVisibleContent(summary: ReceiptSummary): boolean {
  if (hasStructure(summary)) return true;
  return summary.bodyLines.some((line) => line.text.trim().length > 0);
}

export interface ResolveInput {
  /** The raw `sid` query param, already narrowed to a single value. */
  rawSid?: string;
  /** Whether `rawSid` matched the backend's 16-lowercase-hex contract. */
  sidIsValid: boolean;
  /** Outcome of the upstream fetch. Omitted when no fetch was attempted. */
  fetchStatus?: "ok" | "not_found" | "error";
  /** Result of `hasVisibleContent` on the parsed bytes. Only read when fetchStatus === "ok". */
  parsedHasVisibleContent?: boolean;
}

export function resolveReceiptState(input: ResolveInput): ReceiptPageState {
  const { rawSid, sidIsValid, fetchStatus, parsedHasVisibleContent } = input;

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
