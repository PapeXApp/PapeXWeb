// Marketing copy for the "For Customers" homepage.
// Copy is polished-but-provisional (per docs/design/forked-landing/README.md → "Fidelity").
// Keep all strings here so the sections stay markup-only.

export interface ReceiptLineItem {
  label: string;
  amount: string;
}

export interface ReceiptData {
  merchant: string;
  dateLabel: string;
  statusChip: string;
  items: ReceiptLineItem[];
  total: string;
}

/** The Blue Bottle Coffee receipt reused by the hero phone and the how-it-works phone. */
export const receipt: ReceiptData = {
  merchant: "Blue Bottle Coffee",
  dateLabel: "Jul 22, 2026 · 8:41 AM",
  statusChip: "TAPPED",
  items: [
    { label: "Cappuccino", amount: "$5.25" },
    { label: "Almond croissant", amount: "$4.75" },
    { label: "Tax", amount: "$0.90" },
  ],
  total: "$10.90",
};

export const heroContent = {
  eyebrow: "Digital receipts, one tap away",
  headline: "The last receipt you'll ever lose.",
  lead: "Tap your phone at checkout. Your receipt appears instantly — saved, searchable, and yours forever. No paper, no app required to start.",
  ctaLabel: "Download the free app",
  ctaSubtext: "Free on the App Store",
  scrollCue: "Scroll",
  tapZoneLabel: "Tap to receive",
};

/** The hero's live receipt demo — hint copy per state, and the tappable phone's a11y label. */
export const demoContent = {
  phoneLabel: "Tap the phone on the PapeX reader to receive a receipt",
  idleTitle: "Tap to receive",
  idleSubtitle: "Tap the phone on the reader below — no app needed to get it.",
  hint: {
    idle: "Tap the phone to receive the receipt",
    bowing: "Tapping…",
    done: "Scroll it, open the original receipt, or tap the frame to replay.",
  },
  resetLabel: "Reset",
  saveLabel: "Save to PapeX",
  barLabel: "Receipt",
  sectionTitles: {
    items: "Items",
    info: "Receipt Information",
    original: "Original receipt",
  },
  sourceLabel: "RDH Receipt",
  infoSourceLabel: "PapeX RDH · NFC tap",
  decoderMissing: "Receipt decoder did not load.",
};

export type ProblemCardId = "print" | "forest" | "proof";

export interface ProblemCard {
  id: ProblemCardId;
  question: string;
  hint: string;
  value: string;
  caption: string;
}

export const problemContent = {
  eyebrow: "The problem",
  headline: "Paper receipts fade. So does the money you could get back.",
  flipHint: "Tap to flip",
  // ILLUSTRATIVE PLACEHOLDER STATS — pending real sourcing, not factual.
  cards: [
    {
      id: "print",
      question: "How many receipts do we print?",
      hint: "Tap to flip",
      value: "256B",
      caption: "receipts printed every year in the US alone — most in the trash by lunch.",
    },
    {
      id: "forest",
      question: "What does that cost the forest?",
      hint: "Tap to flip",
      value: "10M",
      caption: "trees cut down annually to print receipts nobody keeps.",
    },
    {
      id: "proof",
      question: "What do you get back without proof?",
      hint: "Tap to flip",
      value: "$0",
      caption: "back on the return, warranty, or deduction — because you lost the receipt.",
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
  eyebrow: "Which one are you?",
  headline: "Three kinds of receipt people. PapeX works for all of them.",
  intro: "Three questions. We'll tell you which one you are.",
  restartLabel: "Take it again",
  questions: [
    {
      prompt: "Someone asks you for a receipt from three months ago.",
      options: [
        { label: "I pull it up in seconds. It's filed.", persona: "keeper" },
        { label: "I'd find it — give me a drawer and a minute.", persona: "keeper" },
        { label: "I'd search my email and hope.", persona: "casual" },
        { label: "It's gone. It was gone that day.", persona: "non" },
      ],
    },
    {
      prompt: "At the register, they ask if you want the receipt.",
      options: [
        { label: "Always yes — it goes straight in the folder.", persona: "keeper" },
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
      body: "You keep everything, and it still takes effort. PapeX files it the moment you tap — searchable, exportable, no shoebox.",
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
      body: "Split an expense, submit a reimbursement, or send proof of purchase — no photos of crumpled paper, no scanning.",
    },
  ],
};

export const howItWorksContent = {
  eyebrow: "How it works",
  headline: "Get started in three taps.",
  mobileHeadline: "Get started in three taps.",
  readerLabel: "PapeX RDH",
  phoneAriaLabel: "Step through how PapeX works",
  /** Cue line under the phone, one per step — index 2's "Replay" is bold in the design. */
  cues: [
    "Tap the phone on the reader",
    "Tap again to put it away",
    "That's it — saved, searchable, yours.",
  ],
  replayLabel: "Replay",
  steps: [
    {
      number: "01",
      title: "Tap at checkout",
      body: "Hold your phone to any PapeX device at the register. No app required.",
      mobileTitle: "Tap at checkout",
      mobileBody: "Hold your phone to any PapeX device. No app required.",
      phoneHeadline: "Ready to tap",
      phoneSubline: "Hold your phone to the device",
    },
    {
      number: "02",
      title: "Receipt appears instantly",
      body: "Your digital receipt lands on your phone the moment you tap.",
      mobileTitle: "Receipt appears",
      mobileBody: "Instantly on your phone, the moment you tap.",
      phoneCaption: "Delivered the instant you tapped",
    },
    {
      number: "03",
      title: "Saved & organized",
      body: "Download the app to keep, search and categorize everything automatically.",
      mobileTitle: "Save & organize",
      mobileBody: "Download the app to keep, search and categorize everything.",
    },
  ],
};

// Shaped like a real PapeXV2 receipts list: an initial for the logo circle, a
// "category · date" meta line, and an `unreviewed` flag that draws the orange
// left bar on exactly one row — in the app most rows have already been seen.
export const receiptsListContent = {
  title: "Receipts",
  searchPlaceholder: "Search receipts",
  avatarInitial: "N",
  rows: [
    { merchant: "Blue Bottle Coffee", initial: "B", category: "Dining", date: "Today", amount: "$10.90", unreviewed: true },
    { merchant: "Whole Foods Market", initial: "W", category: "Groceries", date: "Yesterday", amount: "$63.40", unreviewed: false },
    { merchant: "Uber", initial: "U", category: "Gas & auto", date: "Mon", amount: "$18.20", unreviewed: false },
  ],
};

export const proofContent = {
  // ILLUSTRATIVE PLACEHOLDER COUNTERS — pending real usage data, not factual.
  counters: [
    { value: 1284920, label: "receipts delivered" },
    { value: 4210, label: "trees saved" },
    { value: 342, label: "merchants onboarded" },
  ],
  // Press/merchant logo slots are placeholders pending real assets.
  pressLogoSlots: 4,
};

export const visionContent = {
  eyebrow: "The vision",
  headline: "A world where every receipt is useful — and none of them are wasted.",
  body: "We're modernizing the most ignored moment of every purchase. Less paper, less waste, and receipts that finally work for you.",
  primaryCta: "Download the App",
  secondaryCta: "Get the RDH for Business",
};
