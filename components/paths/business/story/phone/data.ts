"use client"

import { demoCoupons, demoStore, type KitCoupon, type KitReceipt, type KitStore } from "@/components/app-kit"
import { extractLastFour, type ReceiptSummary } from "@/lib/receiptSummary"
import { CAFE_NAME, cafeStore } from "../../papexCafe"
import type { CafeCoupon } from "../cafeCouponStore"

/**
 * Everything the §03 phone shows, and ALL OF IT INVENTED (Nico, 2026-09-29):
 *   - three invented stores only: PapeX Cafe (the demo merchant) plus the
 *     kit's Quillbrook Market and Copperpeg Hardware;
 *   - invented items at invented prices, each receipt adding up;
 *   - a card is only ever "Card •••• 1234" — never a card brand;
 *   - addresses are "Demo" streets; the only people are the shopper
 *     ("Jordan", jordan@example.com) and a first name in a shared group.
 * The phone's own copy of this data, so /customers' shared demo data
 * (app-kit sampleData, which still carries brands) is left alone.
 */

export const SHOPPER = { name: "Jordan", email: "jordan@example.com" } as const

/** "Card •••• 4242": a last-4, never a brand. */
export const card = (last4: string) => `Card •••• ${last4}`

// ---------------------------------------------------------------------------
// Stores

const COPPERPEG = demoStore("demo-copperpeg-hardware")
const QUILLBROOK = demoStore("demo-quillbrook-market")

/**
 * PapeX Cafe as the phone shows it: the business side's renamed shop with the
 * shared PapexCafeLogo as its mark. Not flagged `partner`, so every kit part
 * draws the basic profile (banner, logo, name, category, Coupons | Receipts):
 * the demo shows the template every PapeX merchant gets, and invents no
 * points balance.
 */
export function phoneCafeStore(logo: string): KitStore {
  return { ...cafeStore, logoUrl: logo, partner: false, loyalty: undefined, openNow: undefined }
}

/** Newest shop first, as the Stores tab orders them. `logo` = PapeX Cafe's
 *  logo URL (cafeLogo.ts usePapexCafeLogoUri). */
export function phoneStores(logo: string): KitStore[] {
  return [phoneCafeStore(logo), COPPERPEG, QUILLBROOK]
}

// ---------------------------------------------------------------------------
// Coupons

/** The kit's tap coupon for the shared shop: its expiry is the one every
 *  PapeX Cafe coupon on the phone carries (no new date invented). */
const CAFE_TAP_TEMPLATE = demoCoupons.find((c) => c.storeId === cafeStore.id)

/** The coupon's kind, read from its title the way a shopper would. */
function kindOf(title: string): KitCoupon["kind"] {
  if (/buy one|bogo/i.test(title)) return "bogo"
  if (/\d\s*%/.test(title)) return "percent"
  if (/\$\s*\d/.test(title)) return "dollar"
  return "freebie"
}

/** A dashboard coupon (cafeCouponStore) as the app's coupon: the title is the offer. */
export function cafeKitCoupon(c: CafeCoupon): KitCoupon {
  return {
    id: c.id,
    storeId: cafeStore.id,
    kind: kindOf(c.title),
    title: c.title,
    expiresAt: CAFE_TAP_TEMPLATE?.expiresAt,
    via: "tap",
  }
}

/** The other stores' coupons the shopper scanned (kit demo data). */
const OTHER_COUPONS = demoCoupons.filter((c) => c.storeId !== cafeStore.id)

/** The wallet: PapeX Cafe's switched-on coupons first, then the rest. */
export function walletCoupons(active: readonly CafeCoupon[]): KitCoupon[] {
  return [...active.map(cafeKitCoupon), ...OTHER_COUPONS]
}

// ---------------------------------------------------------------------------
// Receipts

type Item = { name: string; quantity: number; price: number }
const sum = (items: Item[]) => Math.round(items.reduce((t, i) => t + i.price * i.quantity, 0) * 100) / 100

function receipt(
  base: Omit<KitReceipt, "amount" | "subtotal" | "logoUrl" | "isSharedWithCurrentUser" | "isSharedByCurrentUser" | "sharedWith"> & {
    items: Item[]
    tax: number
    sharedWith?: string[]
  },
  store: KitStore,
): KitReceipt {
  const subtotal = sum(base.items)
  const shared = (base.sharedWith?.length ?? 0) > 0
  return {
    ...base,
    logoUrl: store.logoUrl ?? null,
    subtotal,
    amount: Math.round((subtotal + base.tax) * 100) / 100,
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: shared,
    sharedWith: base.sharedWith ?? [],
  }
}

// "PAPEX CAFE" must read "PapeX Cafe", not "Papex Cafe".
const titleCase = (t: string) =>
  t.toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase()).replace(/\bPapex\b/g, "PapeX")

/**
 * The shopper's receipts, newest first: the story's receipt (just saved from
 * the App Clip, decoded from the same ticket the printer printed) on top, then
 * six earlier ones from the three invented stores.
 */
export function phoneReceipts(summary: ReceiptSummary, logo: string): KitReceipt[] {
  const cafe = phoneCafeStore(logo)
  const last4 = (summary.paymentLine && extractLastFour(summary.paymentLine)) || "4242"
  const mine: KitReceipt = {
    id: "story-receipt",
    merchantName: titleCase(summary.merchantName ?? CAFE_NAME),
    logoUrl: cafe.logoUrl ?? null,
    amount: summary.total ?? null,
    dateLabel: "Jun 8",
    category: "Dining",
    source: "rdh",
    originDetail: "Tapped by you",
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: false,
    reviewed: false,
    section: "Today",
    address: summary.addressLines.slice(0, 2).join(", "),
    dateTime: (summary.dateline ?? "").replace(" • ", " · "),
    items: summary.items.map((i) => ({ name: i.name, quantity: i.qty, price: i.amount })),
    subtotal: summary.subtotal,
    tax: summary.tax,
    payment: card(last4),
    sharedWith: [],
  }
  const cafeAddr = mine.address || "48 Demo Street, San Francisco, CA 94100"
  return [
    mine,
    receipt(
      {
        id: "p-copperpeg-1",
        merchantName: COPPERPEG.name,
        dateLabel: "Jun 7",
        category: "Home",
        source: "scanned",
        originDetail: "Scanned by you • Home Crew",
        reviewed: true,
        section: "Yesterday",
        address: "220 Demo Avenue, San Francisco, CA 94100",
        dateTime: "Jun 7, 2026 · 5:16 PM",
        items: [
          { name: "Wood screws, 100 ct", quantity: 2, price: 6.49 },
          { name: "Sanding sheets", quantity: 1, price: 8.99 },
          { name: "Painter’s tape", quantity: 2, price: 5.99 },
        ],
        tax: 4.22,
        payment: card("2280"),
        sharedWith: ["Priya"],
        sharedGroup: "Home Crew",
      },
      COPPERPEG,
    ),
    receipt(
      {
        id: "p-quillbrook-1",
        merchantName: QUILLBROOK.name,
        dateLabel: "Jun 6",
        category: "Groceries",
        source: "rdh",
        originDetail: "Tapped by you",
        reviewed: true,
        section: "June 6, 2026",
        address: "9 Demo Market Lane, San Francisco, CA 94100",
        dateTime: "Jun 6, 2026 · 6:02 PM",
        items: [
          { name: "Heirloom tomatoes", quantity: 1, price: 6.4 },
          { name: "Sourdough loaf", quantity: 1, price: 7.5 },
          { name: "Oat milk, half gallon", quantity: 1, price: 5.29 },
          { name: "Eggs, dozen", quantity: 1, price: 6.99 },
          { name: "Olive oil, 500 ml", quantity: 1, price: 14.99 },
          { name: "Honeycrisp apples", quantity: 1, price: 8.45 },
        ],
        tax: 5.2,
        payment: card("2280"),
      },
      QUILLBROOK,
    ),
    receipt(
      {
        id: "p-cafe-2",
        merchantName: cafe.name,
        dateLabel: "Jun 6",
        category: "Dining",
        source: "rdh",
        originDetail: "Tapped by you",
        reviewed: true,
        section: "June 6, 2026",
        address: cafeAddr,
        dateTime: "Jun 6, 2026 · 8:47 AM",
        items: [
          { name: "Drip coffee", quantity: 1, price: 2.75 },
          { name: "Almond croissant", quantity: 1, price: 4.5 },
        ],
        tax: 0.58,
        payment: card(last4),
      },
      cafe,
    ),
    receipt(
      {
        id: "p-cafe-3",
        merchantName: cafe.name,
        dateLabel: "Jun 3",
        category: "Dining",
        source: "rdh",
        originDetail: "Tapped by you",
        reviewed: true,
        section: "June 3, 2026",
        address: cafeAddr,
        dateTime: "Jun 3, 2026 · 9:12 AM",
        items: [
          { name: "Cortado", quantity: 1, price: 4.25 },
          { name: "Sparkling water", quantity: 1, price: 2 },
        ],
        tax: 0.5,
        payment: card(last4),
      },
      cafe,
    ),
    receipt(
      {
        id: "p-quillbrook-2",
        merchantName: QUILLBROOK.name,
        dateLabel: "Jun 1",
        category: "Groceries",
        source: "rdh",
        originDetail: "Tapped by you",
        reviewed: true,
        section: "June 1, 2026",
        address: "9 Demo Market Lane, San Francisco, CA 94100",
        dateTime: "Jun 1, 2026 · 11:30 AM",
        items: [
          { name: "Sourdough loaf", quantity: 1, price: 7.5 },
          { name: "Oat milk, half gallon", quantity: 1, price: 5.29 },
          { name: "Honeycrisp apples", quantity: 1, price: 8.45 },
        ],
        tax: 1.06,
        payment: card("2280"),
      },
      QUILLBROOK,
    ),
    receipt(
      {
        id: "p-copperpeg-2",
        merchantName: COPPERPEG.name,
        dateLabel: "May 30",
        category: "Home",
        source: "scanned",
        originDetail: "Scanned by you",
        reviewed: true,
        section: "May 30, 2026",
        address: "220 Demo Avenue, San Francisco, CA 94100",
        dateTime: "May 30, 2026 · 2:41 PM",
        items: [
          { name: "Paint roller kit", quantity: 1, price: 12.99 },
          { name: "Drop cloth", quantity: 1, price: 9.49 },
        ],
        tax: 2.02,
        payment: card("2280"),
      },
      COPPERPEG,
    ),
  ]
}

/** June's receipts: the Home summary strip's "This month". */
export function monthSummary(receipts: KitReceipt[]): { total: number; count: number } {
  const june = receipts.filter((r) => /^Jun\b/.test(r.dateLabel))
  return { total: Math.round(june.reduce((t, r) => t + (r.amount ?? 0), 0) * 100) / 100, count: june.length }
}
