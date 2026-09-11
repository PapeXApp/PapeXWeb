// lib/demoReceipts.ts
//
// The demo-receipt allowlist: which RDH session ids are Tech Week / booth
// demo receipts rather than somebody's real purchase.
//
// WHAT THIS IS FOR
//   A demo NFC tag must never offer an action that can fail. Claiming an RDH
//   receipt is single-owner-per-sid (papex-adapter-backend/src/api/rdh.js
//   reads `scanned_receipts/rdh_<sid>` BEFORE the backend fetch and
//   short-circuits to 409 `claimed_by_other` for a foreign userId), so the
//   second stranger to press "Save to PapeX" on a demo tag is told the
//   receipt "was already saved by another account". Nothing else breaks —
//   `/receipt/{sid}` and `/receipt/{sid}/parsed` are untouched by a claim, so
//   the receipt still renders identically forever — but that one message is
//   the worst possible sentence to put in front of a conference audience.
//   The fix is to not offer the button. Everything in this module exists to
//   answer exactly one question: "is it safe to offer Save for this sid?"
//
// WHY A LITERAL ALLOWLIST, AND NOT A PREFIX / REGEX / MERCHANT LOOKUP
//   1. A literal `Set` of chosen constants is reviewable. There is no rule to
//      mis-scope: a sid is a demo sid if and only if somebody typed it into
//      the block below and got it through review. A prefix or a regex, by
//      contrast, describes a *space* of sids, and the failure mode of a
//      mis-scoped space is that demo semantics silently start applying to a
//      live merchant's customers.
//   2. Production sids cannot collide with it. The upload Lambda mints them
//      with `randomBytes(8).toString("hex")` (Papex_RDH/lambdas/upload/
//      handler.js), so the chance a real device ever mints one of these
//      chosen constants is ~5e-20 per receipt.
//   3. Demo sids are minted out-of-band. They are written straight to S3 by
//      the demo-tag generator, bypassing `POST /upload` precisely so the
//      value can be *chosen*. They live in a namespace no device can reach by
//      policy, not merely by probability.
//   4. A merchant-id rule is not available here even if we wanted one.
//      `GET /receipt/{sid}/parsed` (Papex_RDH/lambdas/fetch/handler.js
//      `toReceipt()`) is an explicit allow-list of output fields and
//      deliberately OMITS `merchant_id` and `device_id` — "the read path is
//      anonymous by design". A `demo-` merchant prefix check would require
//      adding merchant identity to an unauthenticated endpoint to power a
//      demo flag, which is a bad trade.
//   5. The failure direction is safe. Membership only ever REMOVES the Save
//      button. A false positive costs a button; it can never fabricate
//      content, swap a merchant, or show one customer another's receipt.
//
// WHAT THIS DOES **NOT** COVER — read this before relying on it
//   The App Clip's own "Save to PapeX" button lives in the shipped iOS
//   binary and cannot be changed from this repo. PapeXClip's ReceiptViewModel
//   always renders it and always points it at
//   `https://links.papex.app/rdh?sid=…`, which the INSTALLED full app claims
//   directly against the adapter — bypassing PapeXWeb, this file, and
//   app/api/rdh/claim/route.ts entirely. So:
//     - stranger with no PapeX app   -> Save opens the App Store. No claim.
//       Safe, and this is the Tech Week common case.
//     - someone who already has the app -> Save claims it. ONE person can
//       still burn a demo sid this way, and no web-layer change can stop it.
//   Mitigations are operational, not code: rotate the demo sid per event day
//   (one NFC Tools rewrite), use one sid per tag so a burned sid costs one
//   tag rather than the demo, or delete `scanned_receipts/rdh_<sid>` in the
//   papexv2 Firebase console. The permanent fix is a per-sid exemption in the
//   adapter's claim handler; that needs an adapter deploy and is deliberately
//   out of scope here.
//
//   Also not covered: this module says nothing about which *route* was used.
//   The route decides which iOS experience fires; this allowlist decides
//   whether the sid is claimable. They answer different questions and both
//   are needed — a demo sid reached through a stale `/r?sid=` URL must still
//   be claim-safe, and a production sid pasted into `/r/demo?sid=` must still
//   behave exactly like production.
//
// Pure and dependency-free (beyond `isValidSid`) so it can be unit-tested via
// this repo's tsx-script pattern — see lib/demoReceipts.test.ts, run with
// `npm run test:demo`.

import { isValidSid } from "./rdh";

/**
 * Every sid that is a demo receipt. Literal, sorted, one per line, each with
 * a comment saying what it is and when it was minted.
 *
 * RULES FOR EDITING THIS SET
 *   - Only ever add a sid that was minted out-of-band by the demo-tag
 *     generator. Never add a sid that came from a real device.
 *   - The demo blob must be TEXT ESC/POS, never a Blaze/Star raster. A raster
 *     demo receipt renders as a flat bitmap in the App Clip (the shipped clip
 *     does not read `/parsed`) while the web swaps in structured cards ~46 s
 *     later, which recreates the exact clip-vs-web mismatch the demo is
 *     meant to showcase away.
 *   - Deploy the sid here BEFORE writing it to a tag.
 */
export const DEMO_SIDS: ReadonlySet<string> = new Set<string>([
  // Sunset Leaf Co. — the permanent bench/booth demo tag (see the RDH demo
  // NFC tag notes). Text ESC/POS, seeded to S3 out-of-band.
  "5371e4f000000001",

  // ---- SF / LA Tech Week demo sids -------------------------------------
  // Mint these with the demo-tag generator, confirm each returns
  // `{"claimed":[]}` from the adapter's claims-status endpoint, add them
  // here, DEPLOY, and only then write the tags. Two lines, nothing else to
  // change anywhere in the codebase.
  //
  //   "<sf tech week sid>",   // SF Tech Week, minted YYYY-MM-DD
  //   "<la tech week sid>",   // LA Tech Week, minted YYYY-MM-DD
  //
  // ----------------------------------------------------------------------
]);

/**
 * True when `sid` is a well-formed RDH session id AND a known demo receipt.
 *
 * `isValidSid` is composed in rather than assumed: every caller of this
 * function is deciding whether to suppress a claim affordance, and a
 * malformed sid must reach the same "not a demo receipt" answer as an
 * unknown one so the caller's production path stays the default. The set is
 * all-lowercase-hex by construction (`isValidSid`'s `^[a-f0-9]{16}$`), so no
 * case folding is needed or wanted — an uppercase sid is not a valid sid.
 */
export function isDemoSid(sid: string | undefined | null): sid is string {
  return isValidSid(sid) && DEMO_SIDS.has(sid);
}

/** What a demo route should do with the sid it was handed. */
export type DemoRouteDecision =
  | { action: "render"; sid: string }
  | { action: "redirect"; url: string };

/**
 * The demo routes' front door (app/r/demo, app/demo/r).
 *
 * FAIL TOWARD PRODUCTION, NEVER THE REVERSE. Anything that is not a known
 * demo sid — a real customer's sid, a malformed one, a missing one — is sent
 * to `/r`, the route that knows how to be honest about all three (real
 * receipt / "not available" / sample only when nobody tapped anything). The
 * one thing that must never happen is the opposite: a production receipt
 * picking up demo semantics because it arrived through a demo-shaped URL.
 *
 * Split out of the page component for the same reason lib/merchantHost.ts is
 * split out of middleware.ts — so the decision can be unit-tested without a
 * Next.js runtime. The page is a thin adapter over this.
 */
export function resolveDemoRoute(rawSid: string | undefined | null): DemoRouteDecision {
  // Read out before the guard: `isDemoSid` is a type predicate, so after it
  // TypeScript has narrowed `rawSid` away from `string` entirely and the
  // sid-bearing redirect — the case this function exists for — would type as
  // unreachable.
  //
  // Trimmed only for the "did they send anything at all" test. The demo check
  // itself runs on the raw value, because `isValidSid` does not trim either:
  // a sid with whitespace in it is not a valid sid anywhere in this codebase,
  // and it should reach `/r`'s "Receipt not available" the same way any other
  // malformed sid does.
  const trimmed = typeof rawSid === "string" ? rawSid.trim() : "";

  if (isDemoSid(rawSid)) {
    return { action: "render", sid: rawSid };
  }

  // A bare or whitespace-only sid carries nothing worth forwarding; `/r`'s
  // own no-sid handling takes it from there.
  return {
    action: "redirect",
    url: trimmed.length > 0 ? `/r?sid=${encodeURIComponent(trimmed)}` : "/r",
  };
}
