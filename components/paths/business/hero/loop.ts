// Copy for the /business hero visual: the "CLOSE THE LOOP" animation (P3-B1,
// 2026-09-25; story redone in P3-B7 to Nico's storyboard). One 12-second loop at a
// checkout counter, one beat at a time:
//   1. Tap      the phone touches the PapeX device; the App Clip card pops up;
//               the view zooms into the phone and a finger presses "View"
//   2. Receipt  the App Clip receipt opens: the next-visit coupon on top, the
//               items below, scrolled down to "Save to PapeX"
//   3. Save     Save is pressed: the receipt lands in the PapeX app
//   4. Coupon   the coupon is opened in the app
//   5. Scan     back out at the counter, the phone is turned to the person
//               behind it, who scans the coupon with a red handheld scanner:
//               "Coupon used"
// ...and round again. Timing lives in LoopVisual.tsx (TIMELINE).
//
// CLAIM RULES (same as content.ts): coupons are live (merchants set them up in
// their dashboard; at partner stores a tap sends the customer one for their
// next visit), so nothing here says "Coming soon". The store is the invented
// "PapeX Cafe" used across every /business demo, and the visual carries a
// "Demo data" tag. No figures, no retention metric, no real merchants, and
// nothing that reads as collecting the shopper's data (a shopper may read it).
// Wording: Nico's Phase 4 decisions (b-05, b-06).

export const loop = {
  /** The five steps, in order. `label` is the step's name (the numbered row
   *  under the scene); `sub` finishes the sentence shown under that row for
   *  the step that is playing. Short on purpose: each must read at a glance. */
  steps: [
    { label: "Tap", sub: "their phone on the PapeX device" },
    { label: "Receipt", sub: "opens, with a coupon at partner stores" },
    { label: "Save", sub: "it to the PapeX app" },
    { label: "Coupon", sub: "ready for their next visit" },
    { label: "Scan", sub: "it at the counter: coupon used" },
  ],
  /** The demo coupon on the phone is the app kit's partner-tap coupon
   *  (components/app-kit sampleData `c1`: PapeX Cafe, "$2 off your next
   *  visit", expires in 30 days), plus this demo barcode so the counter has
   *  something to scan. */
  coupon: {
    barcode: "2026092402",
  },
  /** Beat 5: the stamp on the phone once the counter has scanned it. */
  applied: "Coupon used",
  /** Heading over the coupon on top of the App Clip receipt (same style as
   *  the clip's own "Items Purchased"). */
  clipCouponHeading: "Your next-visit coupon",
  demoTag: "Demo data",
  /** Screen-reader description of the whole visual (the drawing itself is
   *  aria-hidden: the numbered steps under it carry the words). */
  description:
    "Demo with an invented store, PapeX Cafe: a customer taps their phone on the PapeX device and the receipt opens with a coupon for next time. They save it to the PapeX app, then use the coupon at the counter.",
} as const
