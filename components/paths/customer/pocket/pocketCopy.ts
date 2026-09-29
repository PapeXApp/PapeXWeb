/**
 * /customers §02 "Every receipt, in your pocket." — the words of the pocket
 * scene (PocketScene.tsx) and its static twin (PocketStatic.tsx).
 *
 * The customer twin of /business §02 "Your store, in their pocket." The
 * customer's action is SCANNING (or forwarding an email), not tapping: tapping
 * is live only at select Bay Area stores, so the page leads with the free app.
 *
 * All merchants, amounts and codes are invented demo data.
 */
export const pocketCopy = {
  id: "pocket",
  eyebrow: "How does it work?",
  heading: "Every receipt, in your pocket.",
  lead: "Scan it or forward it, and it's in PapeX. Same for coupons.",
  halves: [
    {
      key: "receipts",
      title: "Receipts",
      body: "Scan a paper receipt, or forward an email receipt to your PapeX address. It's sorted and searchable.",
    },
    {
      key: "coupons",
      title: "Coupons",
      body: "Scan a store coupon and it's saved next to your receipts, ready at the register. At select partner stores, you can earn them with a tap.",
    },
  ],
  /** Shown on the scene: the receipt and coupon are sample data. */
  demoTag: "Demo data",
  /** The card line printed on the paper receipt. Never a full number, never a brand. */
  cardLine: "Card •••• 4242",
  /**
   * The printed demo coupon. It is Copperpeg Hardware's "$5 off" — the same
   * scanned coupon the app kit's demo wallet holds (app-kit sampleData `c2`),
   * so the paper and the row it lands on say the same thing.
   */
  paperCoupon: {
    store: "Copperpeg Hardware",
    kicker: "Coupon",
    value: "$5 OFF",
    line: "Your next visit",
    terms: "Min. spend $25",
    valid: "Expires Oct 31, 2026",
    barcode: "4021870025",
    stamp: "Demo",
  },
  /** Reduced motion / no-JS: the static composition's image labels. */
  staticLabels: {
    paperReceipt: "A paper receipt from a demo store, framed by the scanner",
    phoneReceipt: "The same receipt at the top of the Receipts tab in the PapeX app, marked Scanned by you",
    paperCoupon: "A paper coupon from a demo store: $5 off your next visit",
    phoneCoupon: "The same coupon saved in the Coupons tab of the PapeX app",
  },
} as const

export type PocketHalf = (typeof pocketCopy.halves)[number]["key"]
