// lib/ridSaveLink.ts
//
// The "Save in the PapeX app" link on `/r?rid=` (peer-to-peer shared
// receipts) — issue #23's web slice (S4). Same shape and same gating
// pattern as lib/appClipBanner.ts's RID_APP_CLIP_BANNER: OFF by default,
// and flipped only once 1.7.0's App Store build understands `rid` — see
// that file's doc comment for the full "why it must stay off" reasoning,
// which applies here too. Noah flips RID_SAVE_LINK and RID_APP_CLIP_BANNER
// TOGETHER after 1.7.0 ships (memory: share-link-rid-fallback.md's
// sequencing trap covers both — this link would otherwise hand an iPhone
// user to an app that opens the shared receipt but has nothing to do with
// `save=1` yet).
//
// `links.papex.app` (not `papex.app`) is deliberate, not a typo: iOS does
// not honour a universal link when the tap happens on a page served from
// the SAME host as the link — see lib/storeLinks.ts's `rdhUniversalLink`
// doc comment for the identical caveat on the sid flow. `save=1` tells the
// installed app the user already pressed Save here, so it performs the
// save itself once it opens (that flow is owned by PapeXV2, not this repo
// — see issue23-contract.md's "Save-intent hand-off URL").
//
// Android/desktop get nothing from this module by design: the in-page
// sign-in + save flow for those platforms needs a server endpoint
// (`saveSharedReceipt`) that doesn't exist until 1.7.1
// (issue23-rid-scope.md §3 "Web (S4 + 1.7.1)"). Callers gate this on
// platform themselves (see app/r/sharedReceiptView.tsx) — this module only
// owns the flag and the URL shape.

const SAVE_LINK_BASE = "https://links.papex.app/r";

/**
 * Whether `/r?rid=` may show the "Save in the PapeX app" link.
 *
 * Server-side only (no NEXT_PUBLIC_ prefix) — read only from a Server
 * Component (app/r/sharedReceiptView.tsx), so it can never be flipped by
 * anything reaching the browser bundle. Fails closed: anything other than
 * the literal string `"1"` is off, same as `ridAppClipBannerEnabled`.
 */
export function ridSaveLinkEnabled(): boolean {
  return process.env.RID_SAVE_LINK === "1";
}

/**
 * The save-intent hand-off URL for an already-validated `rid`.
 *
 * Callers MUST only call this with a rid that has already resolved to a
 * real, existing shared receipt (i.e. after
 * `resolveSharedReceiptPageState` returned `{kind: "real"}`) — this module
 * does no validation of its own, the same "caller's bug, not this module's
 * job" stance lib/sharedReceipt.ts takes on `isValidRid`. `encodeURIComponent`
 * is defensive: `isValidRid`'s pattern (`[A-Za-z0-9_-]{1,64}`) never needs
 * escaping, but the contract (issue23-contract.md) is explicit about it.
 */
export function ridSaveLinkHref(rid: string): string {
  return `${SAVE_LINK_BASE}?rid=${encodeURIComponent(rid)}&save=1`;
}
