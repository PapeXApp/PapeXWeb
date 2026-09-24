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
  // "What is this?" -> "This is Tap to Retain."
  eyebrow: "This is Tap to Retain",
  // Nico, round 2: "Zero paper" is true once the merchant switches the paper
  // printer off, which is their call — so it MUST ship with `paperLine`
  // directly under the lead. Drop the pairing and this becomes "Less paper."
  heading: "Modern checkout. Zero paper.",
  lead: "A free PapeX device (RDH, Receipt Data Hub) joins your POS as a printer. Customers tap their phone for a digital receipt; you get a dashboard of every sale.",
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

// 02 "What is Tap to Retain?" (TapToRetain.tsx). Both halves, honestly:
// receipts are live; coupons are saved and scanned in the app today, and
// only the dashboard-sent personalized coupons are "Coming soon". No
// retention figures anywhere — we have none to show.
export const tapToRetain = {
  eyebrow: "What is Tap to Retain?",
  heading: "Your store, in their pocket.",
  lead: "Tap to Retain turns the paper receipt into a reason to come back. Pick a half to watch it move.",
  stations: {
    counter: "Your counter",
    phone: "Their PapeX app",
    dashboard: "Your dashboard",
  },
  comingSoon: "Coming soon",
  halves: [
    {
      key: "receipts",
      title: "Receipts",
      live: "A customer taps their phone at checkout and gets a digital receipt, no app needed. They keep it in the free PapeX app, so your store stays in their pocket.",
    },
    {
      key: "coupons",
      title: "Coupons",
      live: "Shoppers already save and scan coupons in the PapeX app today.",
      soon: "Personalized coupons you send from your dashboard.",
    },
  ],
  tokens: { receipt: "Receipt", coupon: "Coupon" },
} as const

export const whyMerchants = {
  eyebrow: "Why switch",
  heading: "Every reason to switch. None to say no.",
  // The four lines printed on the receipt in FoldReceipt.tsx (title = the
  // item name, value = its amount; `value` is also the React key, so keep
  // the four unique). `body` and `isLead` are not rendered by the scene
  // today; they stay as the long-form version of each claim.
  cards: [
    {
      value: "$0",
      title: "Free",
      body: "The PapeX device, the install and support are free today. Take advantage while it lasts.",
      isLead: true,
    },
    {
      value: "1 printer",
      title: "Works with your POS",
      body: "Works with most point of sale systems: the PapeX device is added as one more printer.",
      isLead: false,
    },
    {
      value: "1 tap",
      title: "Customers get it",
      body: "One tap of their phone and the receipt opens. No app needed to get it.",
      isLead: false,
    },
    {
      // "0 in the bin" overflowed the printed slip's width at every size.
      value: "0 binned",
      title: "Receipts they keep",
      body: "A digital receipt doesn't fade, tear or end up in the trash.",
      isLead: false,
    },
  ],
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
  heading: "We install it, free, in about 15 minutes.",
  lead: "One short visit and we do the work. Your paper printer keeps printing the whole time.",
  steps: [
    {
      number: "01",
      title: "Power it up",
      body: "We plug the PapeX device in at your counter.",
    },
    {
      number: "02",
      title: "Join your Wi-Fi",
      body: "It connects to your store's 2.4 GHz Wi-Fi.",
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
      body: "Customers can tap from the next sale.",
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

export const dashboard = {
  // No longer its own section (Web 2.1): this copy is the final act of the
  // receipt scene (section 03) (FoldReceipt.tsx / DashboardPreview.tsx). The unused
  // "Coming soon" pill + notify-form strings went with DashboardNotifyForm.
  eyebrow: "Included, free",
  heading: "A dashboard for your digital receipts.",
  lead: "Every receipt the PapeX device sends is searchable the moment it lands. See what's selling, when you're busy, and how many customers are taking the digital copy.",
  dashboardAlt:
    "The PapeX merchant dashboard, showing transaction count, gross, average ticket and tap rate, with charts of busiest hours and days and a ranked list of top items.",
  columns: [
    {
      title: "Every receipt, searchable",
      body: "Filter by amount, item, date or the last 4 digits on the receipt. Open any receipt exactly as the customer saw it.",
    },
    {
      title: "Know your busiest hours",
      body: "Volume by hour and by weekday, plus the items that actually move. Staff to the real curve.",
    },
    {
      title: "Watch your devices",
      body: "Every PapeX device and when it last checked in, so a quiet register never goes unnoticed.",
    },
  ],
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
