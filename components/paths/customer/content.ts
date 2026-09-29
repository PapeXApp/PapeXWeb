// Marketing copy for the "For Customers" homepage.
// Copy is polished-but-provisional (per docs/design/forked-landing/README.md → "Fidelity").
// Keep all strings here so the sections stay markup-only.

/**
 * The tap walkthrough's section id (HowItWorks.tsx puts it on its section;
 * Problem's next-section arrow points at it). ONE constant so the link and
 * its target can't drift. The hero's words live in hero/heroCopy.ts.
 */
export const HOW_IT_WORKS_ANCHOR = "how-it-works";

/** The customer FAQ's id (index.tsx reserves it for task C3's FAQ). The
 *  hero's quiet "Questions?" link jumps here. */
export const FAQ_ANCHOR = "faq";

/** The App Clip receipt's own labels — shared by the §02 walkthrough
 *  (WalkPhone), the Features receipt card and DemoReceiptView. The hero's
 *  old tap-the-device demo copy (hints, reset, a11y labels, lock prompt) was
 *  removed with that demo in P3-C4. */
export const demoContent = {
  saveLabel: "Save to PapeX",
  savedLabel: "Saved",
  sectionTitles: {
    // "Items Purchased" is the heading the clip and the app both print.
    items: "Items Purchased",
    original: "Original receipt",
  },
  // Never "RDH" or "reader" to shoppers (spec §3.5 — one device name).
  sourceLabel: "PapeX receipt",
};

export type ProblemCardId = "print" | "forest" | "proof";

export interface ProblemCard {
  id: ProblemCardId;
  question: string;
  hint: string;
  value: string;
  caption: string;
  /** Short citation shown on the card's back face. Required — no unsourced figures. */
  source: string;
}

export const problemContent = {
  eyebrow: "The problem",
  // Web 2.1 final order (Nico, 2026-09-24): this section answers the
  // visitor's "Why does it matter?", and the flip cards are the answer.
  headline: "Why does it matter?",
  // SOURCED 2026-09-10. Every figure traces to a named source, shown on the card.
  // Rejected on purpose: "256B receipts" (a garbled 256,300-TONS figure, not a
  // count — no traceable receipt count exists), "10M trees" (2013 blog, no
  // method; Green America withdrew its own 10M/12.4M figures), "$1.64B/yr"
  // (unsourced lobby claim). The two $ / lbs figures are Grand View Research
  // (paywalled market research) as cited by Epson; the tree figure is Green
  // America's 2022 update, computed with the EPN Paper Calculator v4.0.
  // Web 2.1 (C4): the unsourced add-ons "Most of it ends up in the trash."
  // and "before printers and repairs" were cut — each caption now says only
  // what its source says.
  cards: [
    {
      id: "print",
      question: "How much paper goes into US receipts?",
      hint: "Tap to reveal",
      value: "620M lbs",
      caption: "of receipt paper used in the US every year.",
      source: "Epson, citing Grand View Research (2025)",
    },
    {
      id: "forest",
      question: "What does that cost the forest?",
      hint: "Tap to reveal",
      value: "3.7M",
      // Round 2 c-13 (Nico): the tree figure only; the water figure is off
      // the card.
      caption: "trees cut down every year for US receipt consumption.",
      source: "Green America, Skip the Slip (2022)",
    },
    {
      id: "proof",
      question: "What do businesses pay for it?",
      hint: "Tap to reveal",
      value: "$540M+",
      caption: "spent by US businesses on receipt paper in a single year (2025).",
      source: "Epson, citing Grand View Research (2025)",
    },
  ] satisfies ProblemCard[],
};

export const marqueeContent = {
  durationSeconds: 30,
  // Web 2.1 (spec §3.2): "Saved forever" removed; "Less paper", not "Zero
  // paper" — the store's printer can keep printing.
  // "Coupons at select stores." added 2026-09-24 (Nico) — never every store.
  phrases: [
    "One tap.",
    "No app needed to receive. Download it to collect them all.",
    "iPhone & Android.",
    "Free.",
    "Coupons at select stores.",
    "Less paper.",
  ],
};

export type PersonaId = "keeper" | "casual" | "non";

export interface QuizOption {
  label: string;
  persona: PersonaId;
}

export interface QuizQuestion {
  prompt: string;
  options: QuizOption[];
}

export interface PersonaResult {
  id: PersonaId;
  tag: string;
  eyebrow: string;
  title: string;
  body: string;
}

/**
 * Three-question quiz — four options per question, each tagged with the
 * persona it scores. `casual` is listed FIRST in the tie-break reduce in
 * Personas.tsx so it wins ties by design (the middle ground / safest read).
 */
export const personasContent = {
  // Web 2.1 (Nico, 2026-09-24): the quiz answers "what's in it for ME", and
  // its result re-orders section 05 Features and swaps its lines and phone
  // content (personaFeatures.ts). The quiz itself is the 9ef8fd4 quiz,
  // unchanged (P3-C3, Nico 2026-09-25: "don't touch the questionnaire").
  eyebrow: "What's in it for you?",
  headline: "Answer 3 questions.",
  intro: "Tap an answer for each and we'll tell you which kind of receipt person you are.",
  tapHint: "Tap an answer",
  restartLabel: "Take it again",
  questions: [
    {
      prompt: "Someone asks you for a receipt from three months ago.",
      options: [
        { label: "I pull it up in seconds. It's filed.", persona: "keeper" },
        { label: "I'd find it, give me a drawer and a minute.", persona: "keeper" },
        { label: "I'd search my email and hope.", persona: "casual" },
        { label: "It's gone. It was gone that day.", persona: "non" },
      ],
    },
    {
      prompt: "At the register, they ask if you want the receipt.",
      options: [
        { label: "Always yes, it goes straight in the folder.", persona: "keeper" },
        { label: "Yes, then it lives in my bag for a month.", persona: "casual" },
        { label: "Only for the expensive stuff.", persona: "casual" },
        { label: "No thanks. Every single time.", persona: "non" },
      ],
    },
    {
      prompt: "Something you bought breaks. The warranty needs proof of purchase.",
      options: [
        { label: "Already have it, sorted by date.", persona: "keeper" },
        { label: "I'd dig for a while and probably win.", persona: "casual" },
        { label: "I'd try my card statement instead.", persona: "casual" },
        { label: "I'd just accept the loss and move on.", persona: "non" },
      ],
    },
  ] satisfies QuizQuestion[],
  results: [
    {
      id: "keeper",
      tag: "That's you",
      eyebrow: "The Keeper",
      title: "You already do the work.",
      body: "You keep everything, and it still takes effort. Save it once and PapeX files it: searchable, exportable, and with no hassle.",
    },
    {
      id: "casual",
      tag: "That's you",
      eyebrow: "The Casual Keeper",
      title: "You mean to keep them.",
      body: "No more wondering where it went. Save it with one tap, and the one time you need it, it's already there.",
    },
    {
      id: "non",
      tag: "That's you",
      eyebrow: "The Non-Keeper",
      title: "You have been leaving money on the table.",
      body: "Returns and warranties need proof you never kept. Tap, save, and you're covered, without changing how you shop.",
    },
  ] satisfies PersonaResult[],
};

// Section 05 Features — five rows, live app features only (Nico's list,
// 2026-09-24, plus Export 2026-09-25). Each row is drawn as a REAL app screen
// by FeatureScreens.tsx (built from PapeXV2's own tokens, per
// docs/design/app-reference.md), not an image. The ORDER of the rows, the
// benefit line each shows and any per-persona title come from the quiz
// result — see personaFeatures.ts; this block holds only what every persona
// shares.
//
// Export is back (Nico, 2026-09-25): PapeXV2 ships bulk PDF export — select
// receipts, Share, and services/receiptExport.ts builds one PDF for the iOS
// share sheet. The old "Export for taxes without lifting a finger" line stays
// cut (it promised automation that doesn't exist). Still cut: filtering "by
// amount" (app-reference.md shows the amount on a row, but no amount FILTER
// is confirmed).
export type FeatureKey = "find" | "export" | "add" | "share" | "deals";

export interface FeatureRow {
  /** The row's one-word label, set as its [05.N] eyebrow. */
  eyebrow: string;
  title: string;
  /** The live features the row covers, as short tags under its line. */
  tags: string[];
}

export const featuresContent = {
  // Its own section again (P3-C3): the 9ef8fd4 eyebrow + headline, then the
  // "Showing / Picked for you" header over the rows (personaFeatures.ts).
  eyebrow: "Once it's yours",
  headline: "Every receipt, kept and searchable.",
  rows: {
    find: {
      eyebrow: "Find",
      title: "Find anything.",
      tags: ["Search", "Auto-categorization", "Account stats"],
    },
    export: {
      eyebrow: "Export",
      title: "Export your receipts as a PDF.",
      tags: ["Select receipts", "Share as one PDF"],
    },
    add: {
      eyebrow: "Add",
      title: "Add the rest.",
      tags: ["Scan paper receipts", "Forward email receipts"],
    },
    share: {
      eyebrow: "Share",
      title: "Share it.",
      tags: ["Shared groups", "Person to person"],
    },
    deals: {
      // "Coupons", not "Deals": in the app a Deal is a store promotion, and
      // this row is about the coupons a shopper earns or scans (P5 c-22).
      eyebrow: "Coupons",
      title: "Coupons and store pages.",
      tags: ["Coupons", "Favorites", "Store pages"],
    },
  } satisfies Record<FeatureKey, FeatureRow>,
  /** Small caption on every app shot: the rows in them are invented. */
  demoLabel: "Demo data",
};

export const howItWorksContent = {
  // Web 2.1 P4 (Nico, 2026-09-28): this walkthrough moved from §02 to §06,
  // after "Why does it matter?", because most visitors can't tap yet. The
  // framing is "live, and spreading": available TODAY at select Bay Area
  // stores — never "coming soon". The thing you tap is the PapeX tag on the
  // counter (NfcTag.tsx), not the RDH box.
  eyebrow: "Now in the Bay Area",
  headline: "At select stores, just tap your phone for your receipt.",
  phoneAriaLabel: "Step through a tap on a PapeX tag",
  /** Cue line under the phone, one per step — index 2's "Replay" is bold in the design. */
  cues: [
    "Tap the phone on the PapeX tag.",
    "Your receipt opens. Tap to save it to PapeX.",
    "That's it: saved, searchable, yours.",
  ],
  replayLabel: "Replay",
  /** The same cues when the section is scroll-pinned (desktop): scrolling is
   *  the other way through. */
  scrollCues: [
    "Scroll, or tap the phone on the PapeX tag.",
    "Your receipt opens. Keep scrolling to save it.",
    "That's it: saved, searchable, yours.",
  ],
  /** The one privacy promise here. It is true of the TAP only (the app has
   *  an account), so it lives with the tap, not in a general privacy list. */
  privacyNote: "A tap sends your receipt and nothing else: no name, no email, no sign-up.",
  /** What is printed on the counter tag, and its accessible name. */
  tag: {
    line: "Tap for your receipt",
    sub: "No app needed",
    label:
      "The PapeX tag by the register: a small acrylic stand with the PapeX logo, a phone-tap icon and the words \u201cTap for your receipt\u201d.",
  },
  steps: [
    {
      number: "01",
      title: "Tap the PapeX tag",
      body: "Hold your phone to it. No app needed.",
    },
    {
      number: "02",
      title: "It opens",
      // Spec §6a (Android): Android taps too. P5 c-05 (Nico): both open
      // instantly, so the copy never makes them sound different (round 2:
      // no platform list at all).
      body: "Your receipt opens instantly!",
    },
    {
      number: "03",
      title: "Save it to PapeX",
      // Saving is a step the SHOPPER takes (the tap alone saves nothing).
      body: "Save it to PapeX. Every dollar you spend makes the next one go further. Your way back to any purchase.",
    },
  ],
};

// Merchant seeds for the appui receipt rows (appui/data.ts owns the rest of
// each row: dates, provenance, the unreviewed flag — see app-reference.md).
//
// INVENTED names only — no real merchants on the site (Web 2.1). Categories are PapeXV2's defaults (constants/receiptCategories.ts);
// a ride is "Travel", not "Gas & auto".
export const receiptsListContent = {
  rows: [
    { merchant: "Tidewick Cafe", initial: "T", category: "Dining", amount: "$10.90" },
    { merchant: "Quillbrook Market", initial: "Q", category: "Groceries", amount: "$63.40" },
    { merchant: "Copperpeg Hardware", initial: "C", category: "Home", amount: "$18.20" },
  ],
};

export const proofContent = {
  // PRODUCT FACTS, not usage stats (2026-09-10). Each is true of the shipped
  // pilot: one NFC tap; the App Clip needs no install; iPhone opens the App
  // Clip and every other phone gets the /r web page. Swap for real pilot
  // numbers once they exist — never back to invented counters.
  //
  // Web 2.1: "0 apps to download first" sat directly above a Download button.
  // The true fact is narrower: no app is needed to RECEIVE it.
  counters: [
    { value: 1, label: "tap to get it" },
    { value: 0, label: "apps needed to receive it" },
    // Round 2 c-30 (Nico): "2" stays the figure so the strip keeps its
    // figure-over-label rhythm; the label is Nico's sentence.
    { value: 2, label: "Works on both iPhone & Android." },
  ],
};

export const visionContent = {
  eyebrow: "The vision",
  // Round 2 c-28 / c-29 (Nico, 2026-09-29): no numbers, no "every store"
  // coupon claim.
  headline: "Your Checkout Channel, there when you need it.",
  body: "Every purchase leaves something behind. A receipt, a coupon, a warranty. Today, most of it ends up lost, crumpled, or in the trash. We're modernizing that moment, connecting your last dollar to your next. Less paper, less waste, and the easiest way back to every purchase.",
  primaryCta: "Download the app",
};
