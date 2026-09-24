// Marketing copy for the "For Customers" homepage.
// Copy is polished-but-provisional (per docs/design/forked-landing/README.md → "Fidelity").
// Keep all strings here so the sections stay markup-only.

export const heroContent = {
  eyebrow: "Digital receipts, one tap away",
  headline: "The last receipt you'll ever lose.",
  lead: "Tap your phone at checkout. Your receipt appears instantly: saved, searchable, and yours forever. No paper, no app required to start.",
  ctaLabel: "Download the app",
  ctaSubtext: "Free on the App Store",
  scrollCue: "Scroll",
};

/** The hero's live receipt demo — hint copy per state, and the tappable phone's a11y label. */
export const demoContent = {
  phoneLabel: "Replay the tap",
  /* The phone is a second way in (2.1): clicking it at rest starts the tap. */
  phoneStartLabel: "Tap your phone on the PapeX device to receive a receipt",
  /* The reader is the primary tap target now (2026-09-22): the hero's story is
     "tap the PapeX device", and nothing happens until the visitor taps IT. */
  deviceLabel: "Tap the PapeX reader to receive a receipt",
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
  sourceLabel: "RDH Receipt",
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
  headline: "Paper receipts fade. So does the money you could get back.",
  // SOURCED 2026-09-10. Every figure traces to a named source, shown on the card.
  // Rejected on purpose: "256B receipts" (a garbled 256,300-TONS figure, not a
  // count — no traceable receipt count exists), "10M trees" (2013 blog, no
  // method; Green America withdrew its own 10M/12.4M figures), "$1.64B/yr"
  // (unsourced lobby claim). The two $ / lbs figures are Grand View Research
  // (paywalled market research) as cited by Epson; the tree figure is Green
  // America's 2022 update, computed with the EPN Paper Calculator v4.0.
  cards: [
    {
      id: "print",
      question: "How much paper goes into US receipts?",
      hint: "Tap to reveal",
      value: "620M lbs",
      caption: "of receipt paper used in the US every year. Most of it ends up in the trash.",
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
      caption: "spent by US businesses on receipt paper every year, before printers and repairs.",
      source: "Epson, citing Grand View Research (2025)",
    },
  ] satisfies ProblemCard[],
};

export const marqueeContent = {
  durationSeconds: 30,
  phrases: [
    "One tap, done.",
    "No paper.",
    "No app to receive.",
    "Saved forever.",
    "Fully searchable.",
    "Zero waste.",
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
  eyebrow: "Quick quiz",
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

// The two rows are rendered as REAL app screens by FeatureScreens.tsx (built
// from PapeXV2's own design tokens), not as images — so there is no asset path
// and no placeholder label here any more.
export const featuresContent = {
  eyebrow: "Once it's yours",
  headline: "Every receipt, kept and searchable.",
  rows: [
    {
      eyebrow: "Everything in one place",
      title: "Your entire receipt history, always a search away.",
      body: "Filter by store, date, category or amount. Categorize food, transport, business and personal. Export for taxes without lifting a finger.",
    },
    {
      eyebrow: "Share in a tap",
      title: "Text, email or AirDrop any receipt in seconds.",
      body: "Split an expense, submit a reimbursement, or send proof of purchase, no photos of crumpled paper, no scanning.",
    },
  ],
};

export const howItWorksContent = {
  eyebrow: "How it works",
  headline: "Get started in three taps.",
  phoneAriaLabel: "Step through how PapeX works",
  /** Cue line under the phone, one per step — index 2's "Replay" is bold in the design. */
  cues: [
    "Tap the phone on the reader",
    "Tap again to put it away",
    "That's it: saved, searchable, yours.",
  ],
  replayLabel: "Replay",
  /** The same cues when the section is scroll-pinned (desktop): scrolling is
   *  the other way through, and a tap on the last step moves on to the next
   *  section instead of replaying — hence "Continue". */
  scrollCues: [
    "Scroll, or tap the phone on the reader",
    "Keep scrolling, or tap to put it away",
    "That's it: saved, searchable, yours.",
  ],
  continueLabel: "Continue",
  steps: [
    {
      number: "01",
      title: "Tap at checkout",
      body: "Hold your phone to any PapeX device at the register. No app required.",
      phoneHeadline: "Ready to tap",
      phoneSubline: "Hold your phone to the device",
    },
    {
      number: "02",
      title: "Receipt appears instantly",
      body: "Your digital receipt lands on your phone the moment you tap.",
      phoneCaption: "Delivered the instant you tapped",
    },
    {
      number: "03",
      title: "Saved & organized",
      body: "Download the app to keep, search and categorize everything automatically.",
    },
  ],
};

// Merchant seeds for the appui receipt rows (appui/data.ts owns the rest of
// each row: dates, provenance, the unreviewed flag — see app-reference.md).
export const receiptsListContent = {
  rows: [
    { merchant: "Blue Bottle Coffee", initial: "B", category: "Dining", amount: "$10.90" },
    { merchant: "Whole Foods Market", initial: "W", category: "Groceries", amount: "$63.40" },
    { merchant: "Uber", initial: "U", category: "Gas & auto", amount: "$18.20" },
  ],
};

export const proofContent = {
  // PRODUCT FACTS, not usage stats (2026-09-10). Each is true of the shipped
  // pilot: one NFC tap; the App Clip needs no install; iPhone opens the App
  // Clip and every other phone gets the /r web page. Swap for real pilot
  // numbers once they exist — never back to invented counters.
  counters: [
    { value: 1, label: "tap to get your receipt" },
    { value: 0, label: "apps to download first" },
    { value: 2, label: "ways to open it: iPhone instantly, any phone in the browser" },
  ],
};

export const visionContent = {
  eyebrow: "The vision",
  headline: "A world where every receipt is useful, and none of them are wasted.",
  body: "We're modernizing the most ignored moment of every purchase. Less paper, less waste, and receipts that finally work for you.",
  primaryCta: "Download the app",
};
