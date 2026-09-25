// Copy for the /business hero visual: the "CLOSE THE LOOP" animation (P3-B1,
// 2026-09-25). Nico on the one-pass ring version: "It's not clear, not
// intuitive. This needs to be idiot proof. The animation moves too fast; I
// don't have time to register what's going on." So it is now a slow, LOOPED
// story told at a checkout counter, one beat at a time:
//   1. Tap            a hand taps the phone on the PapeX device on the counter
//   2. Receipt        the view zooms into the phone: the receipt, scrolled
//   3. Coupon         a coupon for the next visit lands in their PapeX app
//   4. They come back back at the counter, the coupon is scanned and used
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
  /** The four beats, in order. `label` is the step's name (the numbered row
   *  under the scene); `sub` finishes the sentence shown under that row for
   *  the step that is playing. Short on purpose: each must read at a glance. */
  steps: [
    { label: "Tap", sub: "their phone on the PapeX device" },
    { label: "Receipt", sub: "lands on their phone" },
    { label: "Coupon", sub: "for their next visit" },
    { label: "They come back", sub: "and use it at the counter" },
  ],
  /** The demo coupon on the phone is the app kit's partner-tap coupon
   *  (components/app-kit sampleData `c1`: Tidewick Cafe, "$2 off your next
   *  visit", expires in 30 days), plus this demo barcode so the counter has
   *  something to scan. */
  coupon: {
    barcode: "2026092402",
  },
  /** Beat 4: the stamp on the phone once the counter has scanned it. */
  applied: "Coupon used",
  demoTag: "Demo data",
  /** Screen-reader description of the whole visual (the drawing itself is
   *  aria-hidden: the numbered steps under it carry the words). */
  description:
    "Demo with an invented store, Tidewick Cafe: at checkout a customer taps their phone on the PapeX device and the receipt appears on their phone, then a coupon for $2 off their next visit lands in their PapeX app, and on their next visit they show it at the counter and use it.",
} as const
