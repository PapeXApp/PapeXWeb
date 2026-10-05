/**
 * /customers §02 "Every receipt, in your pocket." — the words of the pocket
 * scene (PocketScene.tsx) and its static twin (PocketStatic.tsx).
 *
 * The customer twin of /business §02 "Your store, in their pocket." Three
 * beats, in Nico's order (2026-09-28: "start by advertising the email THEN the
 * scan. but the email is big here"): FORWARD an email receipt (the headline,
 * the longest beat), SCAN a paper receipt, SCAN a coupon. Tapping is live only
 * at select Bay Area stores, so the page leads with the free app.
 *
 * All merchants, amounts and codes are invented demo data.
 */
export const pocketCopy = {
  id: "pocket",
  eyebrow: "How does it work?",
  heading: "Every receipt, in your pocket.",
  lead: "Forward it, scan it, or tap it. PapeX will collect them all.",
  halves: [
    {
      key: "email",
      title: "Email receipts",
      body: "Forward any email receipt to your own PapeX address. It's sorted and searchable.",
    },
    {
      key: "paper",
      title: "Paper receipts",
      body: "Snap a photo of a paper receipt and it's saved right next to the rest.",
    },
    {
      key: "coupons",
      title: "Coupons",
      body: "Scan a store coupon and it's saved next to your receipts, ready at the register. At select partner stores, you can earn them with a tap.",
    },
  ],
  /** What the scroll-driven scene shows and means, server-rendered and
   *  visually hidden next to it (the scene itself is aria-hidden). */
  sceneLabel:
    "Animation, with demo data: an email receipt is forwarded to yourname@papexmail.com and lands at the top of the Receipts tab in the PapeX app. Then a paper receipt is scanned and saved above it, and a paper coupon is scanned into the Coupons tab, so every receipt and coupon ends up in one place.",
  /** Shown on the scene: the receipts and coupon are sample data. */
  demoTag: "Demo data",
  /** The card line printed on the receipts. Never a full number, never a brand. */
  cardLine: "Card ************4242",
  /**
   * The email receipt that gets forwarded, drawn as a real mail client
   * (window chrome, From / To / date header, bold subject, the merchant's
   * HTML receipt as the body). A different store from the paper receipt
   * (Tidewick Cafe) so the two new rows read as two receipts. Sender and
   * recipient use reserved `.example` / example.com domains: clearly fake.
   *
   * The forwarding address is PapeX's current receiving domain,
   * `@papexmail.com` (Nico, 2026-09-29); "yourname" stands in for the
   * username the app lets you pick.
   */
  email: {
    mailbox: "Inbox",
    from: "Quillbrook Market",
    fromAddress: "receipts@quillbrook.example",
    toLabel: "To",
    to: "you@example.com",
    date: "Today, 9:41 AM",
    subject: "Your Quillbrook Market receipt",
    brand: "Quillbrook Market",
    greeting: "Thanks for shopping with us.",
    items: [
      { name: "Sourdough loaf", amount: 6.5 },
      { name: "Honeycrisp apples", amount: 4.85 },
      { name: "Oat milk", amount: 5.49 },
    ],
    total: 16.84,
    footer: "Questions? Just reply to this email.",
    reply: "Reply",
    forward: "Forward",
    fromLabel: "From",
    fwdSubjectLabel: "Subject",
    fwdBanner: "Forwarded message",
    fwdSubject: "Fwd: Your Quillbrook Market receipt",
    address: "yourname@papexmail.com",
  },
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
    email: "An email receipt from a demo store, being forwarded to yourname@papexmail.com",
    phoneEmail: "The same receipt at the top of the Receipts tab in the PapeX app, marked Email by you",
    paperReceipt: "A paper receipt from a demo store, framed by the scanner",
    phoneReceipt: "The paper receipt saved in the Receipts tab, marked Scanned by you, above the emailed one",
    paperCoupon: "A paper coupon from a demo store: $5 off your next visit",
    phoneCoupon: "The same coupon saved in the Coupons tab of the PapeX app",
  },
} as const

export type PocketHalf = (typeof pocketCopy.halves)[number]["key"]
