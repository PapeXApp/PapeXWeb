// Copy for the /business hero visual: the "CLOSE THE LOOP" animation (P3-B1,
// 2026-09-25). Nico on the one-pass ring version: "It's not clear, not
// intuitive. This needs to be idiot proof. The animation moves too fast; I
// don't have time to register what's going on." So it is now a slow, LOOPED
// story told at a checkout counter, one beat at a time:
//   1. Tap            a hand taps the phone on the PapeX device on the counter
//   2. Receipt        the view zooms into the phone: the receipt, scrolled
//   3. Coupon         a coupon for the next visit lands in their PapeX app
//   4. They come back back at the counter, the coupon is shown and used
// ...and round again. Timing lives in LoopVisual.tsx (TIMELINE).
//
// CLAIM RULES (same as content.ts): coupons are live (merchants set them up in
// their dashboard; at partner stores a tap sends the customer one for their
// next visit), so nothing here says "Coming soon". The store is the invented
// "Tidewick Cafe" used everywhere else on the site, and the visual carries a
// "Demo data" tag. No figures, no retention metric, no real merchants, and
// nothing that reads as collecting the shopper's data (a shopper may read it).
// Wording is provisional: Phase 4 finalises the words.

export const loop = {
  /** The four beats, in order. `label` is the step's name (the row under the
   *  scene, and the big caption above it); `sub` finishes the sentence in the
   *  caption. Short on purpose: each must read at a glance. */
  steps: [
    { label: "Tap", sub: "their phone on the PapeX device" },
    { label: "Receipt", sub: "lands on their phone" },
    { label: "Coupon", sub: "for their next visit" },
    { label: "They come back", sub: "and use it at the counter" },
  ],
  /** The demo coupon, in the app's Coupons tab (PapeXV2 CouponRow anatomy). */
  coupon: {
    store: "Tidewick Cafe",
    monogram: "T",
    kind: "$2 OFF",
    title: "$2 off your next visit",
    expiry: "Expires in 30 days",
    used: "Used",
  },
  /** Beat 4: a chip that marks the time jump, and the counter's confirmation. */
  nextVisit: "Next visit",
  applied: "Coupon used",
  demoTag: "Demo data",
  /** Screen-reader description of the whole visual (the drawing itself is
   *  aria-hidden: the numbered steps under it carry the words). */
  description:
    "Demo with an invented store, Tidewick Cafe: at checkout a customer taps their phone on the PapeX device and the receipt appears on their phone, then a coupon for $2 off their next visit lands in their PapeX app, and on their next visit they show it at the counter and use it.",
} as const
