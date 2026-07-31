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
  ctaLabel: "Download the App",
  ctaSubtext: "Free on the App Store",
  scrollCue: "Scroll",
  tapZoneLabel: "Tap to receive",
};

export const problemContent = {
  eyebrow: "The problem",
  headline: "Paper receipts fade. So does the money you could get back.",
  // ILLUSTRATIVE PLACEHOLDER STATS — pending real sourcing, not factual.
  stats: [
    {
      value: "256B",
      caption: "receipts printed every year in the US alone — most in the trash by lunch.",
    },
    {
      value: "10M",
      caption: "trees cut down annually to print receipts nobody keeps.",
    },
    {
      value: "$0",
      caption: "back on the return, warranty, or deduction — because you lost the proof.",
    },
  ],
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

export interface PersonaCard {
  id: PersonaId;
  eyebrow: string;
  title: string;
  body: string;
  message: string;
}

export const personasContent = {
  eyebrow: "Which one are you?",
  headline: "Three kinds of receipt people. PapeX works for all of them.",
  defaultStatus: "Tap a card above.",
  cards: [
    {
      id: "keeper",
      eyebrow: "THE KEEPER",
      title: "You save every receipt. Tax season is still a nightmare.",
      body: "Auto-organized, searchable by store, date or amount, and exportable in one tap. Your system — upgraded. No more shoeboxes.",
      message: "The Keeper — PapeX turns your shoebox into a searchable, exportable archive.",
    },
    {
      id: "casual",
      eyebrow: "THE CASUAL",
      title: "You keep receipts… when you remember.",
      body: "You don't have to remember anymore. Every receipt is saved automatically when you tap. Returns, warranties, expenses — just there.",
      message: 'The Casual — no more "where did that receipt go?" It\'s always saved for you.',
    },
    {
      id: "non",
      eyebrow: "THE NON-KEEPER",
      title: "You throw them all away. Until the one day you needed one.",
      body: "You've been leaving money on the table. One tap and you're covered for deductions, warranties and returns — without changing a thing.",
      message: "The Non-Keeper — you're now covered for every return, warranty and deduction.",
    },
  ] satisfies PersonaCard[],
};

export const featuresContent = {
  rows: [
    {
      eyebrow: "Everything in one place",
      title: "Your entire receipt history, always a search away.",
      body: "Filter by store, date, category or amount. Categorize food, transport, business and personal. Export for taxes without lifting a finger.",
      placeholderLabel: "[ app screen: receipt list + search ]",
    },
    {
      eyebrow: "Share in a tap",
      title: "Text, email or AirDrop any receipt in seconds.",
      body: "Split an expense, submit a reimbursement, or send proof of purchase — no photos of crumpled paper, no scanning.",
      placeholderLabel: "[ app screen: share sheet ]",
    },
  ],
};

export const howItWorksContent = {
  eyebrow: "How it works",
  headline: "Get started in three taps.",
  mobileHeadline: "Get started in three taps.",
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

export const receiptsListContent = {
  searchPlaceholder: "Search receipts",
  rows: [
    { merchant: "Blue Bottle", category: "Food", amount: "$10.90" },
    { merchant: "Whole Foods", category: "Groceries", amount: "$63.40" },
    { merchant: "Uber", category: "Transport", amount: "$18.20" },
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
