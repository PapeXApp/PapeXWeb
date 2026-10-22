// Copy for the merchant dashboard demo inside /business §03 (MerchantDemo.tsx).
//
// The dashboard's own labels are taken from app/merchant (page.tsx,
// insights/page.tsx, devices/page.tsx (the demo calls it "Stickers"),
// tx/[sid]/page.tsx, profile/page.tsx)
// verbatim where they pass the site's copy rules. Where the live dashboard's
// line can't be shown on the marketing site as is, the demo says it
// differently and the reason is noted:
//   - Transactions subtitle: the live one says "kept forever" (off-limits
//     here) -> `txSub`.
//   - Stickers: the live page lists devices with an online/offline check-in;
//     the demo shows each register's sticker with its taps instead.
// The Intelligence tabs are left out on purpose (not a live feature).
// Everything shown is invented and labelled `demoTag`. "Request a change"
// (Profile) is left out: the demo can't send one.

export const merchantCopy = {
  brand: "papex",
  brandTag: "Merchant",
  demoTag: "Demo data",
  merchantLabel: "PapeX Cafe",
  signOut: "Sign out",
  nav: {
    tx: "Transactions",
    insights: "Insights",
    stickers: "Stickers",
    profile: "Profile",
  },

  // Transactions (app/merchant/page.tsx)
  txTitle: "Transactions",
  txSub: "Every receipt from your point of sale, searchable.",
  exportCsv: "Export CSV",
  // Demo only: the button never downloads anything here (Nico 2026-09-29).
  exported: "Exported",
  exportedNote: "In your dashboard this downloads every sale as a CSV.",
  searchPlaceholder: "Search receipt #, item or card…",
  min: "Min $",
  max: "Max $",
  from: "From",
  to: "To",
  clear: "Clear",
  clearAll: "Clear all",
  headers: ["Date", "Total", "Payment", "Receipt #"],
  noMatchTitle: "No matching transactions",
  noMatchBody: "Try a different search term, widen the date range, or clear a filter.",
  clearFilters: "Clear filters",
  showMore: "Show more",
  showing: (shown: number, total: number) => `Showing ${shown.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`,
  card: "Card",

  // Receipt (app/merchant/tx/[sid]/page.tsx)
  back: "Back to transactions",
  receipt: "Receipt",

  // Insights (app/merchant/insights/page.tsx)
  insightsTitle: "Insights",
  insightsSub: "How business is trending, at a glance.",
  windows: [
    { value: "today", label: "Today" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
  ],
  tiles: { count: "Transactions", gross: "Gross", avg: "Avg ticket", tap: "Tap rate" },
  tapSub: (claimed: number, total: number) =>
    `${claimed.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} receipts viewed on PapeX`,
  byHour: "By hour of day",
  byDay: "By day of week",
  topItems: "Top items",
  approximate: "(approximate)",
  noneYet: "No transactions in this window yet.",

  // Stickers (the live app/merchant/devices page, shown by register)
  stickersTitle: "Stickers",
  stickersSub: "Your PapeX stickers, by register, and how often they're tapped.",
  tapsToday: (n: number) => `${n} ${n === 1 ? "tap" : "taps"} today`,
  lastTap: "last tap",

  // Profile (app/merchant/profile/page.tsx). No "Request a change" here: it
  // can't do anything in the demo, so it isn't shown (Nico 2026-09-29).
  profileTitle: "Profile",
  profileSub: "What customers see on your PapeX profile.",
  profileCaption: "How it looks in the PapeX app",
  blurb: "Coffee, pastries and a window seat.",
  category: "Cafe",
  aboutTitle: "About",
  about: "A neighbourhood coffee bar. Tap your phone on the PapeX sticker at the counter to get your receipt.",
  hoursTitle: "Hours",
  hours: [
    ["Mon–Fri", "7:00 AM – 6:00 PM"],
    ["Sat–Sun", "8:00 AM – 4:00 PM"],
  ],
  locationTitle: "Location",
  // Invented, like the rest of the shop (same header as every demo receipt).
  address: ["48 Demo Street", "San Francisco, CA 94100"],

  // The coupons mock (inside Profile; not a screen of the live dashboard yet)
  coupons: {
    title: "Coupons",
    lead: "Set up a coupon for your customer's next visit. A tap sends it with their receipt.",
    items: [
      { title: "$2 off your next visit", on: true },
      { title: "Free pastry with any drink", on: false },
    ],
    on: "On",
    off: "Off",
  },
} as const
