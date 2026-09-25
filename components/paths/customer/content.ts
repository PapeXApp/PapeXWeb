// Marketing copy for the "For Customers" homepage.
// Copy is polished-but-provisional (per docs/design/forked-landing/README.md → "Fidelity").
// Keep all strings here so the sections stay markup-only.

/**
 * The id of the section the hero's "How does that work?" cue scrolls to.
 * ONE constant on purpose: the page order is still being settled, so the cue
 * and its target (HowItWorks.tsx puts this id on its section) read the same
 * value — repoint the cue by moving the id, never by editing the cue.
 */
export const HOW_IT_WORKS_ANCHOR = "how-it-works";

/** The customer FAQ's id (index.tsx reserves it for task C3's FAQ). The
 *  hero's quiet "Questions?" link jumps here. */
export const FAQ_ANCHOR = "faq";

export const heroContent = {
  // Web 2.1 H1 (Nico, 2026-09-24): the H1 says WHAT PapeX is, as a familiar
  // gesture + one twist, and sets up the "How does that work?" cue below.
  // The eyebrow carries the search category, so "tap" isn't said twice.
  eyebrow: "The free digital receipts app",
  headline: "Tap your phone. Get your receipt.",
  // Web 2.1 (spec §3.2): "no app to GET it, the free app to KEEP it" — the old
  // "saved… forever. No app required" line contradicted the Download button
  // right under it.
  // Web 2.1 (Nico, 2026-09-24): "not just a receipt" — at select stores a
  // tap earns a coupon too. Still no app needed to GET it (spec §3.2).
  lead: "Tap your phone at checkout and your receipt appears. At select stores, a coupon for next time can come with it. No app needed to get it: the free PapeX app keeps every receipt and coupon in one place.",
  ctaLabel: "Download the app",
  // True of both listings (lib/storeLinks.ts). Also shown under the quiz
  // result's CTA (Personas.tsx).
  ctaSubtext: "Free · iPhone & Android",
  howCue: "How does that work?",
  faqCue: "Questions?",
};

/** The hero's live receipt demo — hint copy per state, and the tappable phone's a11y label. */
export const demoContent = {
  phoneLabel: "Replay the tap",
  /* The phone is a second way in (2.1): clicking it at rest starts the tap. */
  phoneStartLabel: "Tap your phone on the PapeX device to receive a receipt",
  /* The reader is the primary tap target now (2026-09-22): the hero's story is
     "tap the PapeX device", and nothing happens until the visitor taps IT. */
  deviceLabel: "Tap the PapeX device to receive a receipt",
  /* The idle prompt ON the phone (2.1, 2026-09-23): an iOS Live Activity on
     the lock screen, so the locked phone never reads as blank and points at
     the device. The device's own chip says the same thing from below. */
  lockPrompt: {
    title: "Tap to get your receipt",
    body: "Hold your iPhone near the PapeX device.",
  },
  hint: {
    // Rendered as a chip attached to the device, caret pointing up at it.
    idle: "Tap the PapeX device",
    bowing: "Tapping…",
    card: "Now tap View to open your receipt",
    done: "Scroll it, open the original receipt, or tap the frame to replay.",
  },
  resetLabel: "Reset",
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
      caption: "trees cut down every year for US receipts, plus 10 billion gallons of water.",
      source: "Green America, Skip the Slip (2022)",
    },
    {
      id: "proof",
      question: "What do businesses pay for it?",
      hint: "Tap to reveal",
      value: "$540M+",
      caption: "spent by US businesses on receipt paper in a single year (2025 forecast).",
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
    "No app to receive.",
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
      body: "You keep everything, and it still takes effort. PapeX files it the moment you tap: searchable, exportable, no shoebox.",
    },
    {
      id: "casual",
      tag: "That's you",
      eyebrow: "The Casual",
      title: "You mean to keep them.",
      body: "No more wondering where it went. Every receipt saves itself when you tap, so the one time you need it, it is already there.",
    },
    {
      id: "non",
      tag: "That's you",
      eyebrow: "The Non-Keeper",
      title: "You have been leaving money on the table.",
      body: "Returns, warranties and deductions all need proof you never kept. One tap covers you, without changing how you shop.",
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
      eyebrow: "Deals",
      title: "Coupons and store pages.",
      tags: ["Coupons", "Favorites", "Store pages"],
    },
  } satisfies Record<FeatureKey, FeatureRow>,
  /** Small caption on every app shot: the rows in them are invented. */
  demoLabel: "Demo data",
};

export const howItWorksContent = {
  eyebrow: "How it works",
  // Web 2.1: step 2 is NOT a tap — the receipt opens by itself — so the old
  // "three taps" headline is gone.
  headline: "No app to get it. The free app to keep it.",
  phoneAriaLabel: "Step through how PapeX works",
  /** Cue line under the phone, one per step — index 2's "Replay" is bold in the design. */
  cues: [
    "Tap the phone on the PapeX device",
    "It opened by itself. Tap to save it to PapeX",
    "That's it: saved, searchable, yours.",
  ],
  replayLabel: "Replay",
  /** The same cues when the section is scroll-pinned (desktop): scrolling is
   *  the other way through, and a tap on the last step moves on to the next
   *  section instead of replaying — hence "Continue". */
  scrollCues: [
    "Scroll, or tap the phone on the PapeX device",
    "It opened by itself. Keep scrolling to save it",
    "That's it: saved, searchable, yours.",
  ],
  continueLabel: "Continue",
  steps: [
    {
      number: "01",
      title: "Tap at checkout",
      body: "Hold your phone to the PapeX device at the register. No app needed.",
      phoneHeadline: "Ready to tap",
      phoneSubline: "Hold your phone to the device",
    },
    {
      number: "02",
      title: "It opens",
      // Spec §6a (Android): Android taps too; it opens in the browser.
      body: "On iPhone it opens instantly. On Android it opens in the browser. Nothing to install.",
      phoneCaption: "Opened the instant you tapped",
    },
    {
      number: "03",
      title: "Save it to PapeX",
      // Web 2.1 (Nico, 2026-09-24): saved receipts sit next to any coupons
      // from stores you shop at — coupons are live, not "coming soon".
      body: "Save it to the free PapeX app and it's always searchable — right alongside coupons from stores you shop at.",
    },
  ],
};

// Merchant seeds for the appui receipt rows (appui/data.ts owns the rest of
// each row: dates, provenance, the unreviewed flag — see app-reference.md).
//
// INVENTED names only — no real merchants on the site (Web 2.1). The café
// must keep "blue" in its name: appui/data.ts searches the list for
// SEARCH_QUERY = "blue", and the app only ever shows rows that match the
// query. Categories are PapeXV2's defaults (constants/receiptCategories.ts);
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
    { value: 2, label: "ways to open it: iPhone instantly, any phone in the browser" },
  ],
};

export const visionContent = {
  eyebrow: "The vision",
  headline: "A world where every receipt is useful, and none of them are wasted.",
  // Web 2.1 (Nico, 2026-09-24): ties receipts to coupons, no numbers, no
  // "every store" implication — "select stores" per the approved facts.
  body: "We're modernizing the most ignored moment of every purchase. Less paper, less waste, and receipts that pay you back — with coupons at select stores.",
  primaryCta: "Download the app",
};
