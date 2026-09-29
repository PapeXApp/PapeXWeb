import type { ListRow } from "../appui";

/**
 * /customers hero words (Web 2.1 P4 reorder, 2026-09-28).
 *
 * Why the hero changed: most visitors can't tap a PapeX device yet (tapping
 * works only at select Bay Area stores), so the page now leads with the free
 * APP. Nico picked the old privacy section's headline as the H1.
 *
 * Only claim what is true. The app HAS an account (sign-in), so nothing here
 * may say "no sign-up" or "no account". A card line, where one is drawn, only
 * ever shows the last four digits of the dummy test card, printed the way a
 * paper receipt prints it: "Card ************4242".
 */
export const heroCopy = {
  eyebrow: "The free receipts and coupons app",
  headline: "Your receipt, not your identity.",
  lead: "The free PapeX app keeps every receipt and coupon in one place. Scan a paper receipt or forward an email one. PapeX never touches card data.",
  ctaLabel: "Download the app",
  // True of both store listings (lib/storeLinks.ts).
  ctaSubtext: "Free · iPhone & Android",
  /** The one down cue; targets POCKET_ANCHOR (section 02). */
  downCue: "See how it works",
  faqCue: "Questions?",
  /** The visual is a picture (nothing to click): its accessible name. */
  visualLabel:
    "The PapeX app on an iPhone. A scanned paper receipt from Tidewick Cafe is filed at the top of the Receipts list. Beside it: no card number, no name or email on the receipt.",
  /** The three privacy chips, in the order they appear. */
  chips: [
    { key: "card", label: "No card number" },
    { key: "name", label: "Private unless you share it" },
    { key: "delete", label: "Delete anytime" },
  ],
} as const;

/** Section 02's id: the "Every receipt, in your pocket" scene. */
export const POCKET_ANCHOR = "pocket";

/** The paper receipt that gets scanned, then filed. An invented merchant
 *  (Tidewick Cafe, the site's demo cafe); total matches the filed row. */
export const heroSlip = {
  merchant: "TIDEWICK CAFE",
  meta: "Jun 8, 2026  10:24 AM",
  items: [
    { name: "Cortado", price: "4.25" },
    { name: "Oat milk", price: "0.75" },
    { name: "Almond croissant", price: "4.50" },
    { name: "Sparkling water", price: "2.00" },
  ],
  tax: { label: "Tax", price: "0.92" },
  total: { label: "TOTAL", price: "12.42" },
  // Never a full card number anywhere on the site.
  card: "Card ************4242",
};

const TIDEWICK_BG = "linear-gradient(160deg,#9a5a2c,#5a2f14)";

/** The receipt that arrives: scanned just now, so unreviewed (orange rim). */
export const heroNewRow: ListRow = {
  id: "hero-tidewick",
  merchant: "Tidewick Cafe",
  initial: "T",
  amount: "$12.42",
  group: "Today",
  date: "Jun 8",
  category: "Dining",
  source: "Scanned by you",
  glyph: "scan",
  tone: "own",
  logoBg: TIDEWICK_BG,
  unreviewed: true,
};

/** What was already in the list. Invented merchants (content.ts's list). */
export const heroOlderRows: ListRow[] = [
  {
    id: "hero-quillbrook",
    merchant: "Quillbrook Market",
    initial: "Q",
    amount: "$63.40",
    group: "Yesterday",
    date: "Jun 7",
    category: "Groceries",
    source: "Email by you",
    glyph: "mail",
    tone: "own",
    logoBg: "linear-gradient(160deg,#4b7f52,#24512e)",
    unreviewed: true,
  },
  {
    id: "hero-copperpeg",
    merchant: "Copperpeg Hardware",
    initial: "C",
    amount: "$18.20",
    group: "June 5, 2026",
    date: "Jun 5",
    category: "Home",
    source: "Scanned by you",
    glyph: "scan",
    tone: "own",
    logoBg: "linear-gradient(160deg,#3b434e,#161a20)",
  },
  {
    id: "hero-tidewick-old",
    merchant: "Tidewick Cafe",
    initial: "T",
    amount: "$9.80",
    group: "June 5, 2026",
    date: "Jun 5",
    category: "Dining",
    source: "Email by you",
    glyph: "mail",
    tone: "own",
    logoBg: TIDEWICK_BG,
  },
];
