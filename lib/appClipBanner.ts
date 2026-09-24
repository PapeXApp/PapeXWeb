// lib/appClipBanner.ts
//
// The Smart App Banner (`apple-itunes-app` meta tag) that lets Safari on iOS
// offer the PapeX App Clip inline for `/r`, in addition to the Advanced App
// Clip Experience already registered in App Store Connect for that path (see
// the 2026-09-23 share-link diagnosis, Q4). Apple's format:
//   <meta name="apple-itunes-app" content="app-id=..., app-clip-bundle-id=...">
//
// `app-id` matches APP_STORE_URL in lib/storeLinks.ts (id6754945242).
// `app-clip-bundle-id` is the bare bundle id — no team-id prefix here, unlike
// the `appclips.apps` entry in the AASA or the entitlement
// (`U78Z2HWA5Q.com.app.papex.Clip`); Apple's meta-tag format takes the bundle
// id alone. `app-clip-display=card` asks Safari for the card presentation
// rather than the default banner strip.
export const APP_CLIP_BANNER_CONTENT =
  "app-id=6754945242, app-clip-bundle-id=com.app.papex.Clip, app-clip-display=card";

/**
 * Whether a `rid` (peer-to-peer share) link may show the Smart App Banner.
 *
 * MUST stay off until 1.7.0 ships to the App Store. Per the 2026-09-23
 * share-link diagnosis (Q4), the App Clip binary currently live on the App
 * Store (1.6.3, running build 1.6.4 (1), uploaded 2026-08-21) only knows how
 * to parse `sid` — `rid` support first landed in source on 2026-09-20, after
 * that build shipped. A banner tap hands the installed clip a URL it cannot
 * parse: `InvocationURL.swift` throws `missingSid`, which the clip renders as
 * "We couldn't load this receipt: Receipt ID is missing from the link." —
 * strictly worse than just letting Safari load this page directly, which is
 * what happens today with the banner off.
 *
 * The `sid` (RDH) flow is unaffected by this flag — that banner is controlled
 * separately in app/r/page.tsx's generateMetadata, because the shipped clip
 * has always understood `sid`.
 *
 * Flip by setting env `RID_APP_CLIP_BANNER=1` once the App Store's current
 * build understands `rid` (i.e. once 1.7.0, or any build carrying commit
 * c56d842/98f0816 or later, is what App Store Connect actually serves — verify
 * this the way rdh-status-claims-unreliable.md describes, not by trusting a
 * version number). Server-side only (no NEXT_PUBLIC_ prefix): this is read in
 * generateMetadata, which always runs server-side, and keeping it unprefixed
 * means it can never be flipped by anything reaching the browser bundle.
 */
export function ridAppClipBannerEnabled(): boolean {
  return process.env.RID_APP_CLIP_BANNER === "1";
}
