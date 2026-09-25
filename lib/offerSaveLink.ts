// lib/offerSaveLink.ts
//
// "Save in the PapeX app" under the merchant OFFER card(s) on production
// `/r?sid=` (an RDH tap's receipt cards, surface=web — lib/cards/fetchCards.ts).
// Founder ask: a save affordance on the web offer cards themselves.
//
// WHY THIS IS A SEPARATE, NEW THING FROM SaveToPapex's "Save to PapeX" CTA
// (app/r/CtaRow.tsx): that button already offers a general "save this
// receipt" action below the receipt on every non-demo, non-sample sid page.
// But the cards contract (contracts/cards/v1/, lib/cards/types.ts
// CAPS_1_7_0) deliberately sends NO `save` action to `surface=web` — "the
// server emits `save` actions only for `surface=app`, whose client
// implements them locally" — so an offer card's own "Save" line renders
// INERT on web (app/r/cards/OfferCard.tsx's `InertSaveAction`, "does
// nothing" by design). This module is the web's only legal way to offer a
// real Save next to an offer: hand off to the app, which shows its OWN
// cards (surface=app) with a working Save button.
//
// CONFIRMED BY READING PapeXV2 origin/release/1.7.0 (read-only,
// goals/doobie-nights-coupons/reports/web-save.md has the full citations):
// an incoming sid hand-off auto-claims the receipt exactly as it does
// today (RdhClaimDeepLinkListener -> claimRdhReceipt -> receiptDetail),
// and receiptDetail mounts RdhTapCards TWICE with surface=app, whose
// `save` action is real (RdhTapCards.tsx's saveRdhOffer/autoSaveRdhOffer).
// Nothing about that path changes here — this is a web-renderer-only
// feature, no cards-contract change, no app change.
//
// IT ACTUALLY SAVES WITH NO FURTHER TAP. #19 auto-save
// (services/rdhCards/autoSave.ts) files any live, unexpired offer carrying
// a `save` action into the owner's wallet automatically, fire-and-forget,
// the first time receiptDetail's cards load after a claim — wired in the
// `below` mount's effect (components/rdhCards/RdhTapCards.tsx:163-181,
// mounted at app/receiptDetail.tsx:4227), which is exactly the mount that
// runs right after this link's hand-off completes its claim. That is why
// app/r/ui.tsx's SaveInAppLink is called here with the label
// "Open in PapeX to save" (app/r/cards/WebCards.tsx), not "Save in the
// PapeX app" (the rid caller's label, where an explicit in-app tap is
// still required) — opening this link is the whole action.
//
// THE URL is the SAME ONE SaveToPapex's iOS CTA already uses:
// lib/storeLinks.ts's `rdhUniversalLink(sid)` ->
// `https://links.papex.app/rdh?sid=<sid>`. Confirmed against
// PapeXV2 origin/release/1.7.0's services/rdhLink.ts: `parseRdhSidFromUrl`
// only claims links.papex.app for the exact path `/rdh` (never `/r` on that
// host — that combination silently never claims, so this module must never
// invent a links.papex.app/r URL for a sid). No `save=1`: that param is
// meaningful only on the `rid` (peer-share) path
// (issue23-contract.md / lib/ridSaveLink.ts) — the sid path already
// auto-claims with no in-app tap needed, unchanged.
//
// HONEST ABOUT THE GAP: with no app installed, the link falls through to
// the existing `/rdh` install page (app/rdh/page.tsx, both store buttons).
// There is NO deferred deep link — after installing, the sid is lost, and
// the customer has to re-tap the device or reopen this same link to pick
// the offer back up. Nothing here papers over that.
//
// iOS ONLY, deliberately. PapeXV2's Android app declares no intent filter
// for a bare `papex.app`/`links.papex.app` sid hand-off in the checked-in,
// BUILT AndroidManifest.xml on `main` (only `links.papex.app/invite*` is
// registered) — and the existing SaveToPapex CTA itself falls back to an
// in-page sign-in sheet on Android rather than trusting a universal link,
// which is the strongest signal this repo has that an Android hand-off
// link isn't reliable yet. This module does not guess otherwise; see
// reports/web-save.md's open questions for the one branch
// (origin/release/1.7.0's app.json, not yet reflected in a built manifest)
// that disagrees and should be resolved before ever extending this past iOS.
//
// Gated by OFFER_SAVE_LINK (default OFF, same pattern as RID_SAVE_LINK /
// RID_APP_CLIP_BANNER) so the deploy is dark until Noah flips it. Server-side
// only (no NEXT_PUBLIC_ prefix): read from app/r/page.tsx, a Server
// Component, so it can never be flipped by anything reaching the browser
// bundle.

export function offerSaveLinkEnabled(): boolean {
  return process.env.OFFER_SAVE_LINK === "1";
}
