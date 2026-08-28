// lib/storeLinks.ts
//
// The two store listings, in one place.
//
// Both are live: iOS `id6754945242`, Android `com.app.papex` — the Android
// listing was pulled from Play on 2026-06-08 (Misleading Claims: the old
// launcher icon didn't match the new store listing) and relisted 2026-08-20
// with release 13 / 1.6.3. The RDH viewer's CTA still said "PapeX for
// Android isn't available yet" a week after that, because the copy lived
// inline next to the iOS link with nothing tying the two together. Hence
// this module: one edit site when a listing's status changes.

export const APP_STORE_URL = "https://apps.apple.com/us/app/papex/id6754945242";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.app.papex";

/** Which store to lead with. Derived from the UA header — a hint, never a gate. */
export type Platform = "ios" | "android" | "other";

export function platformFromUserAgent(ua: string): Platform {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

/**
 * The universal link that hands an RDH receipt to the *full* PapeX app.
 *
 * Only `links.papex.app` works here: it is the single host the shipped app
 * declares in `com.apple.developer.associated-domains`
 * (PapeXV2/ios/PapeX/PapeX.entitlements) and the only `/rdh` host
 * `parseRdhSidFromUrl` (PapeXV2/services/rdhClaim.ts) accepts. papex.app
 * carries the same AASA file but the app claims no entitlement for it, so a
 * papex.app/rdh link would never be intercepted.
 *
 * CAVEAT — iOS does not honour a universal link when the tap happens on a
 * page served from the SAME host as the link. A visitor already on
 * links.papex.app therefore cannot be handed off to the app at all; Safari
 * just navigates, and `app/rdh/page.tsx` catches them. The device writes
 * `https://papex.app/r?sid=…` to the tag, so the real-world entry point is
 * cross-host and the handoff does fire.
 */
export function rdhUniversalLink(sid: string): string {
  return `https://links.papex.app/rdh?sid=${encodeURIComponent(sid)}`;
}
