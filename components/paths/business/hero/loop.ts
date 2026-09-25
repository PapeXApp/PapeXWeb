// Copy for the /business hero visual: the RETURN-VISIT LOOP (Web 2.1 wave 3,
// Nico 2026-09-24). The hero no longer shows the PapeX device box ("we don't
// want to make it seem like we're a hardware company"); it shows what the
// merchant gets out of a tap instead, on ONE phone:
//   1. Tap        - a tap at checkout puts the receipt on the customer's phone
//   2. Coupon     - a coupon for their next visit lands in their PapeX app
//   3. Comes back - they return, and the coupon is used
//
// CLAIM RULES (same as content.ts): coupons are live (merchants set them up in
// their dashboard; at partner stores a tap sends the customer one for their
// next visit), so nothing here says "Coming soon". The store is the invented
// "Nook Cafe" used everywhere else on the site, and the visual carries a
// "Demo data" tag. No figures, no retention metric, no real merchants.
//
// The hero's own copy (eyebrow, H1, lead, paper line) lives in content.ts and
// is owned elsewhere; this file is only what the visual draws.

export const loop = {
  /** The three stops around the phone, in order. Short on purpose: they have
   *  to read at a glance in the static final frame. */
  stops: [
    { label: "Tap", sub: "Receipt" },
    { label: "Coupon", sub: "For next visit" },
    { label: "Comes back", sub: "Uses it" },
  ],
  /** The demo coupon, in the app's Coupons tab (PapeXV2 CouponRow anatomy). */
  coupon: {
    store: "Nook Cafe",
    monogram: "N",
    kind: "$2 OFF",
    title: "$2 off your next visit",
    expiry: "Expires in 30 days",
    used: "Used today",
  },
  /** The small toast on the return visit. */
  welcome: "Welcome back to Nook Cafe",
  demoTag: "Demo data",
  /** Screen-reader description of the whole visual (the phone itself is
   *  aria-hidden: its strings are app furniture, not content). */
  description:
    "Demo with an invented store: a customer taps their phone at checkout and gets a Nook Cafe receipt, a coupon for $2 off their next visit lands in their PapeX app, and when they come back they use it.",
} as const
