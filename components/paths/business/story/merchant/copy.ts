// Copy for the merchant dashboard demo inside /business §03 (MerchantDemo.tsx).
//
// The dashboard's own labels are taken from app/merchant (page.tsx,
// insights/page.tsx, devices/page.tsx, tx/[sid]/page.tsx, profile/page.tsx)
// verbatim where they pass the site's copy rules. Where the live dashboard's
// line can't be shown on the marketing site as is, the demo says it
// differently and the reason is noted:
//   - Transactions subtitle: the live one says "RDH device" and "kept
//     forever" (both off-limits here) -> `txSub`.
//   - Devices subtitle: "RDH boxes" -> "PapeX devices".
// The Intelligence tabs are left out on purpose (not a live feature).
// Everything shown is invented and labelled `demoTag`.

export const merchantCopy = {
  brand: "papex",
  brandTag: "Merchant",
  demoTag: "Demo data",
  merchantLabel: "Tidewick Cafe",
  signOut: "Sign out",
  nav: {
    tx: "Transactions",
    insights: "Insights",
    devices: "Devices",
    profile: "Profile",
  },

  // Transactions (app/merchant/page.tsx)
  txTitle: "Transactions",
  txSub: "Every receipt your PapeX device captures, searchable.",
  exportCsv: "Export CSV",
  searchPlaceholder: "Search receipt #, item, card, or merchant…",
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
  tapSub: (claimed: number, total: number) => `${claimed} of ${total} receipts viewed on PapeX`,
  byHour: "By hour of day",
  byDay: "By day of week",
  topItems: "Top items",
  approximate: "(approximate)",
  noneYet: "No transactions in this window yet.",

  // Devices (app/merchant/devices/page.tsx)
  devicesTitle: "Devices",
  devicesSub: "Your PapeX devices and when they last checked in.",
  lastUpload: "last upload",

  // Profile (app/merchant/profile/page.tsx)
  profileTitle: "Profile",
  profileSub: "What customers see on your PapeX profile. Want something changed? Send us a request.",
  requestChange: "Request a change",
  requestNote: "In your dashboard, this sends your request to the PapeX team. They make the change for you.",
  about: "A neighborhood coffee bar. Tap your phone on the PapeX device at the counter to get your receipt.",
  blurb: "Coffee, pastries and a window seat.",
  category: "Cafe",
  hours: [
    ["Mon–Fri", "7:00 AM – 6:00 PM"],
    ["Sat–Sun", "8:00 AM – 4:00 PM"],
  ],

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
