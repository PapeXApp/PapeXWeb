// Marketing copy for the "For Business" (merchant) homepage path.
//
// Copy here is Nico's approved wording (Phase 4, 2026-09-29: decisions in
// .claude/plans/2026-09-28-p4-audit/decisions-merged.md). Do not invent
// specifications, pricing, certifications or customer names beyond what's
// written here.
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
//  - Card data: "PapeX never touches card data" (a bare "Never touches card
//    data." only as a ribbon/heading fragment) / "doesn't store, process or
//    transmit card data", linked to /pci. No certification claim: the /pci
//    page deliberately certifies nothing.
//  - Connection: Wi-Fi, added as a printer ("works like a printer"). No other interface, and
//    only the parallel mode (the paper printer stays) exists.
//  - Paper (Nico, round 2): "Zero paper" only when paired with "Go
//    paper-free: switch off the printer whenever you're ready." The paper
//    printer keeps printing until the merchant turns it off in their POS.
//  - Setup: we install it, free, in about 15 minutes.
//  - POS: "Works with most point of sale systems". Don't name a POS.
//  - Contracts: say nothing until Nico confirms.
//  - Proof: "Live in the Bay Area." only; no store type, no dates, no names.
//  - Device name: "the PapeX device" in visible copy. RDH stands for
//    "Receipt Delivery Hardware" (Nico, 2026-09-29, q-24; never "Receipt
//    Data Hub"); don't add RDH to visible copy.

import { SALES_PHONE, SALES_PHONE_HREF } from "@/components/brand/links"

// Demo requests go to Nico (approved public fact). Kept here, not in
// components/brand/links.ts (the shell's file), until it's needed elsewhere.
const DEMO_EMAIL = "nico@papex.app"


// Page order (Nico, 2026-09-24): each section answers the merchant's next
// question — 01 What is this? (hero) · 02 What is Tap to Retain? · 03 How
// does it work, and what do I get? (the receipt scene, #how) · 04 Is it
// safe? (device) · 05 How do I get it? (setup -> demo) · 06 FAQ.

export const hero = {
  // H1 (round 2, d-01, Nico 2026-09-29): the hero visual tells the return-
  // visit story (tap -> receipt -> coupon for next time -> they come back),
  // so the H1 names it. It says nothing about collecting shopper data (a
  // shopper may read it). "Tap to Retain" is the eyebrow (q-02); the offer
  // ("free") is carried by the lead. The same words head the business share
  // image (scripts/og/og.html, public/og-business.png).
  eyebrow: "Tap to Retain",
  heading: "Every sale is the first step to bringing them back.",
  lead: "A free PapeX device, our Receipt Delivery Hardware, sits at your counter and works like a printer. Customers tap their phone for a digital receipt. You get a dashboard of every sale.",
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
} as const

// 02 "What is Tap to Retain?" (TapToRetain.tsx + intro/). Both halves are
// live: receipts, and coupons the merchant sets up in their dashboard (Nico,
// q-17: merchant coupon setup is live). There
// is no "Coming soon" anywhere in this section any more (Web 2.1 W3). No
// retention figures anywhere — we have none to show. Everything drawn in the
// scene is DEMO data for the invented "PapeX Cafe" (the /customers demo
// receipt), and the scene says so with `demoTag`.
export const tapToRetain = {
  /** Section id: the hero's next-section arrow target (P3-R1). */
  id: "tap-to-retain",
  eyebrow: "What is Tap to Retain?",
  heading: "Your store, in their pocket.",
  lead: "Tap to Retain turns the paper receipt into a reason to come back. Scroll to see receipts, then coupons.",
  halves: [
    {
      key: "receipts",
      title: "Receipts",
      body: "A customer taps their phone at checkout and gets a digital receipt, no app needed. They can keep it in the free PapeX app, so your store stays in their pocket.",
    },
    {
      key: "coupons",
      title: "Coupons",
      body: "Shoppers already save and scan coupons in the PapeX app. Make one in your dashboard, and a tap can deliver it with the receipt on their next visit.",
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
    phoneReceipt: "The receipt and a personalized coupon from partnered stores, on your customer's phone in just one tap.",
    paperCoupon: "A paper coupon from a demo store: $2 off your next visit",
    phoneCoupon: "The same coupon in the Coupons tab of the PapeX app",
  },
} as const

export const marquee = {
  durationSeconds: 32,
  phrases: [
    "Free device.",
    "Free install.",
    "Works like a printer.",
    "Paper is optional.",
    "Never touches card data.",
    "Dashboard included.",
  ],
} as const

export const howItWorks = {
  id: "setup",
  eyebrow: "How do I get it?",
  heading: "Installed free in about 15 minutes.",
  // The one duration claim: a start and an end on the timeline's axis, and
  // the heading. No per-step minutes (we have no measured split to show).
  lead: "One short visit, and you're live.",
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
      body: "It joins your store's Wi-Fi.",
    },
    {
      number: "03",
      title: "Connect it to your POS",
      body: "We add it as a second printer.",
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
  deviceAlt:
    "The RDH (Receipt Delivery Hardware): a small black box that sits by the register and works like a secondary printer. Checkout stays the same, except the receipt goes to the customer's phone instead of on a piece of paper.",
  // A point with a `link` renders the label after the text, in orange.
  points: [
    { text: "Connects over your Wi-Fi, like a printer." },
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
  // q-25 (Nico): the demo email sits next to the number.
  emailPrefix: "or email",
  email: DEMO_EMAIL,
  emailHref: `mailto:${DEMO_EMAIL}`,
  submitLabel: "Request a demo",
  submitLabelPending: "Sending…",
  successMessage: "Thanks, we've got your request. We'll be in touch shortly to set up your demo.",
  errorMessage: `Something went wrong sending your request. Please try again, or call us at ${SALES_PHONE}.`,
} as const
