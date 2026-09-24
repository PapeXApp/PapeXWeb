// lib/receiptRouting.ts
//
// Precedence rule for `/r`'s three query-param-driven paths: `sid` (RDH
// hardware tap), `rid` (peer-to-peer share link), and demo/bare (no real
// receipt in play). Pulled out of app/r/page.tsx, in the same spirit as
// lib/receiptState.ts's own module doc: kept pure and separate from the React
// tree so the precedence rule is unit-testable without a DOM/test framework
// and without Next's request-scoped `headers()` API (which app/r/page.tsx
// calls, and which throws outside a real request).
//
// PRECEDENCE: sid > rid > demo/bare.
//   - `sid` wins by PRESENCE, not by being well-formed or non-blank — mirrors
//     lib/receiptState.ts's own "bare `/r`" check exactly (`rawSid != null &&
//     rawSid.trim().length > 0`), so this module's idea of "sid present" is
//     the identical condition the sid flow already uses to decide it has work
//     to do. A URL carrying `?sid=...` at all is an RDH tap (possibly
//     malformed), and app/r/page.tsx's EXISTING sid handling — entirely
//     unchanged by this module — decides what to show. `rid` is never
//     consulted in that case.
//   - `?demo=1` is an explicit, unconditional opt-in. Today it wins outright
//     even over a well-formed sid (lib/receiptState.ts); this module extends
//     that same override to `rid` for the same reason stated there: nobody
//     tapped a real device or opened a real share link, so the sample is
//     honest, and — because no fetch is attempted for either kind when this
//     is set — it can never look like a fallback from a failed rid lookup.
//   - Otherwise, a present (non-blank, after trimming) `rid` selects the rid
//     path.
//   - Otherwise, bare `/r`.
//
// This module only decides WHICH path to take. It says nothing about whether
// a given sid/rid is well-formed — that stays with lib/rdh.ts's `isValidSid`
// and lib/sharedReceipt.ts's `isValidRid`, both checked downstream, exactly
// as today for sid.

export type ReceiptRoute = { kind: "sid" } | { kind: "rid"; rid: string } | { kind: "demo" };

export interface ReceiptRouteInput {
  /** The raw `sid` query param, before array-narrowing. */
  sidParam: string | string[] | undefined;
  /** The raw `rid` query param, before array-narrowing. */
  ridParam: string | string[] | undefined;
  /** True for an explicit `?demo=1` opt-in. */
  demoRequested: boolean;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveReceiptRoute(input: ReceiptRouteInput): ReceiptRoute {
  const { sidParam, ridParam, demoRequested } = input;

  const rawSid = firstParam(sidParam);
  const sidEffectivelyPresent = rawSid != null && rawSid.trim().length > 0;
  if (sidEffectivelyPresent) return { kind: "sid" };

  if (demoRequested) return { kind: "demo" };

  const rawRid = firstParam(ridParam);
  const ridCandidate = typeof rawRid === "string" ? rawRid.trim() : "";
  if (ridCandidate.length > 0) return { kind: "rid", rid: ridCandidate };

  return { kind: "demo" };
}
