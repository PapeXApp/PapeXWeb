// Marketing copy for the "For Business" (merchant) homepage path.
//
// Copy here is polished-but-provisional (per the design spec's Fidelity
// section) — it communicates intent and tone but is not final marketing
// copy. Do not invent specifications, pricing, certifications or customer
// names beyond what's written here.
//
// NOTE on illustrative content: the design spec's "Fidelity" section flags
// stats, merchant/press logos and testimonials as illustrative placeholders
// pending real data. Unlike the customer path, the Business path as
// specified (README "Screen 3: Business / Merchant Path", 3.1-3.7) has no
// numeral stat callouts, press/merchant logo strips, or testimonial slots —
// so there is nothing of that kind to mark here. The one illustrative
// UI element in this path used to be a "Coming soon" dashboard placeholder;
// the dashboard is now a real screenshot, so there is nothing to mark.
//
// CLAIM RULES (Web 2.1, spec §3.3 + Nico's answers §6a in
// .claude/plans/2026-09-24-web-2.1-brainstorm.md; the phrases that were cut
// are listed there under "Cut"). Read before editing:
//  - Cost: "Free device. Free install." Merchants aren't charged today; no
//    promise about how long, no eligibility condition.
//  - Card data: "Never touches card data" / "doesn't store, process or
//    transmit card data", linked to /pci. No certification claim: the /pci
//    page deliberately certifies nothing.
//  - Connection: Wi-Fi, added as a network printer. No other interface, and
//    only the parallel mode (the paper printer stays) exists.
//  - Paper (Nico, round 2): "Zero paper" only when paired with "Go
//    paper-free: switch off the printer whenever you're ready." The paper
//    printer keeps printing until the merchant turns it off in their POS.
//  - Setup: we install it, free, in about 15 minutes.
//  - POS: "Works with most point of sale systems". Don't name a POS.
//  - Contracts: say nothing until Nico confirms.
//  - Proof: "Live in the Bay Area." only; no store type, no dates, no names.
//  - Device name: "the PapeX device (RDH, Receipt Data Hub)" on first
//    mention on the page, "PapeX device" after that.

import { SALES_PHONE, SALES_PHONE_HREF } from "@/components/brand/links"


// Page order (Nico, 2026-09-24): each section answers the merchant's next
// question — 01 What is this? (hero) · 02 What is Tap to Retain? · 03 How
// does it work, and what do I get? (the receipt scene, #how) · 04 Is it
// safe? (device) · 05 How do I get it? (setup -> demo) · 06 FAQ.

export const hero = {
  // H1 (P3-B1, 2026-09-25, provisional — Phase 4 finalises the words): the
  // hero visual now tells the "close the loop" story (tap -> receipt ->
  // coupon for next time -> they come back), so the H1 names it. It says
  // nothing about collecting shopper data (a shopper may read it). "Tap to
  // Retain" stays as the eyebrow, next to the brand; the offer ("free") is
  // carried by the lead.
  eyebrow: "Tap to Retain, by PapeX",
  heading: "Close the loop on every sale.",
  lead: "A free PapeX device (RDH, Receipt Data Hub) joins your POS as a printer. Customers tap their phone for a digital receipt; you get a dashboard of every sale.",
  // Nico's approved paper wording (§6a round 2). No longer a required pair
  // (the H1 no longer says "Zero paper"), kept as the hero's sub-line. If
  // "Zero paper" ever returns to the hero, it must ship with this line.
  paperLine: "Go paper-free: switch off the printer whenever you're ready.",
  ctaLabel: "Request a demo",
  phoneLabel: "or call",
  // One source for the number: components/brand/links.ts (S1 moves it to
  // 415-261-8610 there; nothing to change here when that merges).
  phone: SALES_PHONE,
  phoneHref: SALES_PHONE_HREF,
  secondaryLabel: "See how it works",
  secondaryHref: "#how",
  deviceAlt: "The PapeX device: a small matte-black box with a green status light and a PapeX label on top.",
} as const

// 02 "What is Tap to Retain?" (TapToRetain.tsx + intro/). Both halves are
// live: receipts, and coupons the merchant sets up in their dashboard. There
// is no "Coming soon" anywhere in this section any more (Web 2.1 W3). No
// retention figures anywhere — we have none to show. Everything drawn in the
// scene is DEMO data for the invented "Tidewick Cafe" (the /customers demo
// receipt), and the scene says so with `demoTag`.
export const tapToRetain = {
  eyebrow: "What is Tap to Retain?",
  heading: "Your store, in their pocket.",
  lead: "Tap to Retain turns the paper receipt into a reason to come back. Scroll to watch both halves.",
  halves: [
    {
      key: "receipts",
      title: "Receipts",
      body: "A customer taps their phone at checkout and gets a digital receipt, no app needed. They keep it in the free PapeX app, so your store stays in their pocket.",
    },
    {
      key: "coupons",
      title: "Coupons",
      body: "Shoppers already save and scan coupons in the PapeX app today. Set up coupons in your dashboard, and a tap sends your customer one for their next visit.",
    },
  ],
  /** Shown on the scene: the receipt and coupon are sample data. */
  demoTag: "Demo data",
  /** The printed demo coupon (paper) and the same coupon in the app. */
  paperCoupon: {
    kicker: "Coupon",
    value: "$2 OFF",
    line: "Your next visit",
    valid: "Valid for 30 days",
    stamp: "Demo",
  },
  appCoupon: {
    kind: "$2 OFF",
    title: "$2 off your next visit",
    expiry: "Expires in 30 days",
  },
  /** Reduced motion: the static composition's image labels. */
  staticLabels: {
    paperReceipt: "A paper receipt from a demo store",
    phoneReceipt: "The same receipt on a phone, as the PapeX App Clip shows it",
    paperCoupon: "A paper coupon from a demo store: $2 off your next visit",
    phoneCoupon: "The same coupon in the Coupons tab of the PapeX app",
  },
} as const

export const marquee = {
  durationSeconds: 32,
  phrases: [
    "Free device.",
    "Free install.",
    "Adds as a printer.",
    "Paper is optional.",
    "Never touches card data.",
    "Dashboard included.",
  ],
} as const

export const howItWorks = {
  id: "setup",
  eyebrow: "How do I get it?",
  heading: "Free in 15 minutes.",
  // The one duration claim: a start and an end on the timeline's axis, and
  // this line. No per-step minutes (we have no measured split to show).
  lead: "We install it, free, in about 15 minutes.",
  axisStart: "0 min",
  axisEnd: "about 15 min",
  steps: [
    {
      number: "01",
      title: "Power it up",
      body: "We plug the PapeX device in at your counter.",
    },
    {
      number: "02",
      title: "Join your Wi-Fi",
      body: "It joins your store's 2.4 GHz Wi-Fi.",
    },
    {
      number: "03",
      title: "Add it as a printer in your POS",
      body: "Your POS sees it as one more network printer.",
    },
    {
      number: "04",
      title: "Test a receipt",
      body: "We run a test sale and tap it on a phone.",
    },
    {
      number: "05",
      title: "Hand-over: your dashboard is live",
      body: "Customers can tap from your next sale.",
    },
  ],
  // Leads straight into the demo form below: setup + demo read as one path.
  nextLabel: "It starts with a demo",
  nextHref: "#demo",
} as const

export const rdhDevice = {
  eyebrow: "Is it safe?",
  heading: "Small device. Never touches card data.",
  deviceAlt: "The PapeX device: a small matte-black box with a green status light and a PapeX label on top.",
  // A point with a `link` renders the label after the text, in orange.
  points: [
    { text: "Connects over Wi-Fi as a network printer." },
    { text: "Your paper printer keeps printing until you choose to switch it off." },
    {
      text: "Doesn't store, process or transmit card data.",
      link: { label: "How we handle card data", href: "/pci" },
    },
    {
      text: "A status light shows how it's doing, and help is a click away.",
      link: { label: "Support", href: "/support" },
    },
  ],
  specs: ["Wi-Fi", "Network printer", "Status light"],
} as const

export const demo = {
  eyebrow: "Get started",
  heading: "Request a demo.",
  body: "See the PapeX device in action. We install it, free, in about 15 minutes.",
  // Proof line above the form. Nico (2026-09-24): this exact line only; no
  // store type, no dates, no names.
  proof: "Live in the Bay Area.",
  phonePrefix: "Or call us:",
  phone: SALES_PHONE,
  phoneHref: SALES_PHONE_HREF,
  submitLabel: "Request a demo",
  submitLabelPending: "Sending…",
  successMessage: "Thanks, we've got your request. We'll be in touch shortly to set up your demo.",
  errorMessage: "Something went wrong sending your request. Please try again, or call us directly.",
} as const
