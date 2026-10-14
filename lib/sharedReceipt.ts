// lib/sharedReceipt.ts
//
// Server-side fetch for a peer-to-peer share link:
// `https://papex.app/r?rid=<receiptId>`.
//
// WHY THIS EXISTS. `rid` is a *different* backend from RDH's `sid` (see
// lib/rdh.ts): it's the Firebase Cloud Function `sharedReceipt`
// (papexv2/functions/src/index.ts, `functions.https.onRequest`), which reads
// a user's saved receipt straight out of `scanned_receipts/{id}` in
// Firestore and projects it down to the fields safe to hand to a stranger
// holding the link — no owner identity, no image URL, no extras. See the
// 2026-09-23 share-link diagnosis: prior to this file, `app/r/page.tsx` only
// read `sid`, so a `rid` link fell through to the bare-`/r` DEMO branch and
// rendered the BLUEBIRD COFFEE sample instead of the real receipt — the P0
// bug this file (plus the routing change in app/r/page.tsx) fixes.
//
// SHAPE REUSE. The function's envelope —
// `{sid, parseStatus:"ok", hasImage, uploadedAt, receipt:{merchantName, date,
// total, lineItems[...], ...}}` — is shape-identical to RDH's own
// `GET /receipt/{sid}/parsed` (lib/rdhParsed.ts). `normalizePayload` there
// already validates and narrows exactly this envelope, so this module reuses
// it rather than writing a second, laxer parser that could drift.
//
// THE PHOTO (1.7.2 #30). The function's envelope also carries an additive
// `photo: {available: true} | null`. It is a flag and nothing more: no URL, no
// Storage path, no token. The page builds the URL of the bytes itself
// (`sharedReceiptPhotoUrl`, the same function with `&photo=1`) and the
// BROWSER fetches them, because Vercel caps a function response at 4.5 MB and
// stored originals reach 4.8 MB. A response with no `photo` key (the function
// before #30) is "no photo", so this page may ship before the function does.
//
// CORS. Unlike lib/rdh.ts's RDH backend, `sharedReceipt` sets permissive CORS
// headers deliberately (see its own comment) because it expects to be called
// from a browser on a different origin. This fetch still runs server-side —
// same reasoning as lib/rdh.ts: no auth beyond the id itself, and every id is
// privacy-sensitive, so `cache: "no-store"` and no client-side exposure of
// the base URL.

import { hasUsableReceipt, normalizePayload, type ParsedReceipt, type ParsedReceiptPayload } from "./rdhParsed";

const DEFAULT_SHARED_RECEIPT_API_BASE = "https://us-central1-papexv2.cloudfunctions.net";

/**
 * Base URL of the `papexv2` Cloud Functions host, overridable with
 * `SHARED_RECEIPT_API_BASE`.
 *
 * SERVER-SIDE ONLY (no NEXT_PUBLIC_ prefix) — same reasoning as
 * `rdhApiBase()` in lib/rdh.ts: lets this be pointed at a local fixture for
 * testing without ever letting a browser see or set it. Unset (every
 * deployed environment today) means the real `papexv2` function, unchanged.
 */
export function sharedReceiptApiBase(): string {
  const fromEnv = process.env.SHARED_RECEIPT_API_BASE?.trim();
  return (fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_SHARED_RECEIPT_API_BASE).replace(/\/+$/, "");
}

/**
 * Receipt ids a `rid` link may carry.
 *
 * KEEP IN SYNC with `SHARED_RECEIPT_ID_PATTERN` in
 * PapeXV2/functions/src/sharedReceiptProjection.ts,
 * PapeXV2/services/receiptShareLinks.ts, and the mirrored pattern in
 * ios/PapeXClip/AppClip/InvocationURL.swift — three other runtimes parse the
 * exact same link and have to agree on what's well-formed. Verified against
 * origin/release/1.6.9 on 2026-09-23 (read-only; PapeXV2 is a separate repo
 * from this one).
 */
const RID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidRid(rid: string | undefined | null): rid is string {
  return typeof rid === "string" && RID_RE.test(rid);
}

export type SharedReceiptFetchResult =
  /** `photoAvailable`: the function said it would serve this receipt's photo. */
  | { status: "ok"; payload: ParsedReceiptPayload; photoAvailable: boolean }
  | { status: "not_found" }
  | { status: "error" };

/**
 * Did the function say a photo is available? Only an explicit
 * `photo: {available: true}` counts: a missing key (older function), null,
 * `{available: false}` or any other shape is "no photo", and "no photo" is a
 * state the page already renders correctly.
 */
export function photoAvailableIn(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const photo = (body as { photo?: unknown }).photo;
  return typeof photo === "object" && photo !== null && (photo as { available?: unknown }).available === true;
}

/**
 * Where the browser gets the photo's bytes: the same function, `&photo=1`.
 * The function decides again on this request (a receipt binned since, or
 * flagged non-receipt, answers 404), so the page can promise nothing the
 * function will not deliver. Callers pass an already validated `rid`.
 */
export function sharedReceiptPhotoUrl(rid: string): string {
  return `${sharedReceiptApiBase()}/sharedReceipt?rid=${encodeURIComponent(rid)}&photo=1`;
}

/**
 * Fetch the shared-receipt envelope for a `rid`. Never throws — every
 * failure (network error, timeout, non-2xx/404, an unparseable body) folds
 * into `{status: "error"}` so the page can show a retry state instead of an
 * unhandled exception. Callers MUST validate with `isValidRid` first: the
 * function itself 400s a malformed id, but this module treats that as the
 * caller's bug, not a fetch outcome, exactly as lib/rdh.ts does for `sid`.
 */
export async function fetchSharedReceipt(rid: string): Promise<SharedReceiptFetchResult> {
  const controller = new AbortController();
  // Same budget as lib/rdh.ts's byte fetch: comfortably under Vercel's
  // function timeout, so a hung function still renders our own retry state
  // rather than a platform 504.
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${sharedReceiptApiBase()}/sharedReceipt?rid=${encodeURIComponent(rid)}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) return { status: "not_found" };
    if (!res.ok) return { status: "error" };

    const body: unknown = await res.json();
    const payload = normalizePayload(body);
    return payload ? { status: "ok", payload, photoAvailable: photoAvailableIn(body) } : { status: "error" };
  } catch {
    return { status: "error" };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * The three things `/r?rid=…` can show, decided WITHOUT touching React —
 * mirrors lib/receiptState.ts's own separation of "what should this page
 * show" from the JSX that shows it, so this is unit-testable the same way
 * (see lib/sharedReceipt.test.ts). app/r/sharedReceiptView.tsx is the only
 * caller and does nothing but switch on `kind`.
 *
 * Deliberately only three states, not the sid flow's four — there is no
 * separate DEMO state here because `rid` is never eligible for the demo
 * fallback (see lib/receiptRouting.ts): a `rid` link means a real person
 * shared a real receipt, so every failure mode below stays honest —
 * NOT_AVAILABLE or ERROR, never the sample.
 */
export type SharedReceiptPageState =
  /**
   * `photoSrc`: the photo's URL when the function offered one, else null (text
   * only). The photo only ever appears HERE, under a receipt that has readable
   * content: there is deliberately no "photo only" state (see below).
   */
  | { kind: "real"; receipt: ParsedReceipt; photoSrc: string | null }
  | { kind: "not_available" }
  | { kind: "error" };

export async function resolveSharedReceiptPageState(rid: string): Promise<SharedReceiptPageState> {
  // Validate before ever fetching — matches the function's own
  // SHARED_RECEIPT_ID_PATTERN, so a malformed rid never spends a network
  // round trip only to get the same 400 back. Same shape as the sid flow's
  // `isValidSid` gate in app/r/page.tsx.
  if (!isValidRid(rid)) return { kind: "not_available" };

  const result = await fetchSharedReceipt(rid);
  if (result.status === "not_found") return { kind: "not_available" };
  if (result.status === "error") return { kind: "error" };

  // result.status === "ok". Still gated on hasUsableReceipt: a payload that
  // parses but carries no merchant/total/items is functionally a missing
  // receipt, same reasoning as lib/receiptState.ts's hasVisibleContent for
  // sid.
  //
  // NO PHOTO-ONLY PAGE (Noah, 2026-10-14). A receipt with no readable merchant,
  // no total and no line items is the one OCR found nothing receipt-like in, so
  // it is the least likely to be a receipt, and its photo must not stand in for
  // one: it is "not available", exactly as it was before #30, WHATEVER the
  // function says about a photo. (The function withholds the photo for such a
  // document itself; this is the page not trusting that, so an older or odd
  // function can never produce a photo-only page here.) The `photo` flag is
  // not even read on this path.
  if (!hasUsableReceipt(result.payload) || !result.payload.receipt) return { kind: "not_available" };

  const photoSrc = result.photoAvailable ? sharedReceiptPhotoUrl(rid) : null;
  return { kind: "real", receipt: result.payload.receipt, photoSrc };
}
