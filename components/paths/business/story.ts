// Copy for /business section 03, "Tap to Retain": one receipt, followed from
// the printer to the customer's phone to the merchant's dashboard
// (WhyMerchants.tsx -> story/RetainStory.tsx). B5 of Web 2.1 owns this file;
// business/content.ts belongs to B1, so nothing here is imported from it.
//
// Truth rules (spec 2026-09-24 §6a): no stats, no merchant names or logos,
// never "zero paper" / "PCI compliant" / "forever". Every dashboard feature
// named below exists in app/merchant today: search + filters and CSV export
// (app/merchant/page.tsx), busiest hours/days + top items + tap rate
// (app/merchant/insights/page.tsx), device status (app/merchant/devices).
// The receipt in the scene is the /customers demo receipt ("Nook Cafe", an
// invented shop) decoded through lib/escpos.ts, so all three screens show the
// same sale.

export const story = {
  eyebrow: "Tap to Retain",
  heading: "Follow one receipt.",
  lead: "From your printer, to your customer's phone, to your dashboard. Scroll to watch it go.",

  /**
   * One line under the scene per beat. Also rendered as a screen-reader list
   * and as the captions of the reduced-motion version, so the story reads the
   * same with or without the animation.
   */
  beats: {
    print: "A sale prints a paper receipt.",
    trash: "Paper gets folded, lost or tossed.",
    merge: "With PapeX, the same receipt goes to the PapeX device at your counter.",
    tap: "Your customer taps their phone on the device…",
    receipt: "…and the receipt opens on their phone. No app needed.",
    spark: "The same receipt lands on your dashboard.",
    dash: "Searchable, counted and charted the moment it lands.",
  },

  /** The reduced-motion version: three steps, one caption each. */
  staticSteps: [
    { key: "paper", title: "Today: paper", body: "A sale prints a paper receipt. Paper gets folded, lost or tossed." },
    {
      key: "tap",
      title: "With PapeX: one tap",
      body: "Your customer taps their phone on the PapeX device and the receipt opens: in an App Clip on iPhone, in the browser on Android.",
    },
    { key: "dash", title: "And on your side", body: "The same receipt lands on your dashboard." },
  ],

  /** Accessible names for the scene's art. */
  deviceLabel: "The PapeX device, a small black box at the counter.",
  phoneLabel: "An iPhone showing the digital receipt.",
  laptopLabel: "The PapeX merchant dashboard, updating with the new receipt.",
  paperNote: "Go paper-free: switch off the printer whenever you're ready.",

  /** Lock-screen Live Activity on the phone before the tap. */
  lockPrompt: { title: "Tap to get your receipt", body: "Hold your iPhone near the PapeX device" },
} as const

/** The dashboard info that rises in under the laptop at the end. */
export const storyDashboard = {
  eyebrow: "Your dashboard, included",
  heading: "Every receipt, working for you.",
  lead: "Each receipt the PapeX device captures shows up on your dashboard as soon as it prints.",
  columns: [
    {
      title: "Every receipt, searchable",
      body: "Find any sale by item, amount, card or date, open it exactly as your customer saw it, and export to CSV.",
    },
    {
      title: "What sells, and when",
      body: "Your busiest hours and days, and the items that actually move.",
    },
    {
      title: "Taps and devices",
      body: "Your tap rate: how many receipts customers opened. And when each PapeX device last checked in.",
    },
  ],
  customerLine: {
    lead: "And your customers?",
    body: "They keep every receipt in the free PapeX app.",
  },
} as const

/** Labels inside the drawn dashboard on the laptop (a mock of app/merchant/insights). */
export const storyScreen = {
  brand: "papex",
  brandTag: "MERCHANT",
  nav: ["Transactions", "Insights", "Intelligence", "Devices"],
  title: "Insights",
  subtitle: "How business is trending, at a glance.",
  ranges: ["Today", "7 days", "30 days"],
  tiles: {
    count: "Transactions",
    gross: "Gross",
    avg: "Avg ticket",
    tap: "Tap rate",
    tapNote: "receipts viewed on PapeX",
  },
  byHour: "By hour of day",
  topItems: "Top items",
  newReceipt: "New receipt",
  tapped: "Tapped",
} as const
