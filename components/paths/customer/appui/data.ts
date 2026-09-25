import { receiptsListContent } from "../content";

/**
 * Sample rows for the drawn app screens.
 *
 * Every field maps onto something PapeXV2's `components/ui/ReceiptRow.tsx`
 * actually renders — see docs/design/app-reference.md ("Receipt row"):
 *   - `date` + `category` are the meta line (`r.dateLabel • r.category`),
 *     `formatReceiptDate` = "Sep 22" (services/receiptDisplay.ts:104);
 *   - `source` is the provenance line built by `buildReceiptOriginSummary`
 *     (services/receiptOrigin.ts): "Tapped by you" for an RDH tap, "Scanned by
 *     you • <group>", "Email by you", "Shared by <name> in <group>";
 *   - `glyph` + `tone` are the 28pt origin ring (`getReceiptSourceIconName`):
 *     RDH/scan -> scan, email -> mail, shared-in -> people, shared-out -> share;
 *     the ring is blue only for a receipt YOU shared out.
 *
 * Logo colours are invented brand-ish hues behind a monogram — never a real
 * merchant mark (Nico's rule for the site).
 *
 * INVENTED PEOPLE AND GROUPS TOO (Web 2.1): no real person, group or merchant
 * appears in a mockup. The one sharer is "Jordan Reyes" and the one group is
 * "Housemates", used consistently across the screens.
 */

/** The invented person every "shared" mockup names. */
export const DEMO_PERSON = "Jordan Reyes";
/** The invented shared group every mockup names. */
export const DEMO_GROUP = "Housemates";

export type OriginGlyph = "scan" | "mail" | "people" | "share";

/** own = grey ring + white glyph; sharedOut = #7FC4EC ring + glyph;
 *  sharedIn = grey ring, "Shared by" prefix in #7FC4EC (ReceiptRow.tsx). */
export type OriginTone = "own" | "sharedOut" | "sharedIn";

export interface ListRow {
  /** Stable React key (merchants repeat in a search result). */
  id: string;
  merchant: string;
  initial: string;
  amount: string;
  /** Section header above the row: "Today", "Yesterday" or "September 22, 2026". */
  group: string;
  /** The row's own short date, e.g. "Sep 22". */
  date: string;
  category?: string;
  /** Provenance line. When `sharedBy` is set the line starts "Shared by". */
  source: string;
  sharedBy?: boolean;
  glyph: OriginGlyph;
  tone: OriginTone;
  logoBg: string;
  unreviewed?: boolean;
}

const [blue, whole, uber] = receiptsListContent.rows;

const TIDEWICK_BG = "linear-gradient(160deg,#9a5a2c,#5a2f14)";
const BLUE_BG = "linear-gradient(160deg,#2f7ad6,#10529e)";

/**
 * The walkthrough's step 3 ("Saved & organized"): the Receipts tab right after
 * the tap. The first row IS the receipt the App Clip just rendered in step 2 —
 * Tidewick Cafe, $12.42, dated Jun 8 2026 on the ticket (demoReceipt.ts), source
 * `rdh` so "Tapped by you" + the scan ring — and it is unreviewed, as every
 * new receipt is. The older rows show the other two provenances.
 */
export const LIST_ROWS: ListRow[] = [
  {
    id: "tidewick",
    merchant: "Tidewick Cafe",
    initial: "T",
    amount: "$12.42",
    group: "June 8, 2026",
    date: "Jun 8",
    source: "Tapped by you",
    glyph: "scan",
    tone: "own",
    logoBg: TIDEWICK_BG,
    unreviewed: true,
  },
  {
    id: "whole",
    merchant: whole.merchant,
    initial: whole.initial,
    amount: whole.amount,
    group: "June 7, 2026",
    date: "Jun 7",
    category: whole.category,
    sharedBy: true,
    source: ` ${DEMO_PERSON} in ${DEMO_GROUP}`,
    glyph: "people",
    tone: "sharedIn",
    logoBg: "linear-gradient(160deg,#4b7f52,#24512e)",
  },
  {
    id: "uber",
    merchant: uber.merchant,
    initial: uber.initial,
    amount: uber.amount,
    group: "June 5, 2026",
    date: "Jun 5",
    category: uber.category,
    source: "Email by you",
    glyph: "mail",
    tone: "own",
    logoBg: "linear-gradient(160deg,#3b434e,#161a20)",
  },
];

/**
 * The Features "search" shot: the Receipts tab filtered by a query. Search
 * FILTERS the list (receipts.tsx `filtered` -> `sortReceipts`), so every row
 * here genuinely matches "blue" — an unrelated merchant under a typed query is
 * a state the app can never show. Three visits, three provenances, still
 * grouped by date (sort stays `newest`).
 */
export const SEARCH_QUERY = "blue";

export const SEARCH_ROWS: ListRow[] = [
  {
    id: "blue-1",
    merchant: blue.merchant,
    initial: blue.initial,
    amount: blue.amount,
    group: "September 22, 2026",
    date: "Sep 22",
    category: blue.category,
    source: `Scanned by you • ${DEMO_GROUP}`,
    glyph: "share",
    tone: "sharedOut",
    logoBg: BLUE_BG,
    unreviewed: true,
  },
  {
    id: "blue-2",
    merchant: blue.merchant,
    initial: blue.initial,
    amount: "$8.75",
    group: "September 15, 2026",
    date: "Sep 15",
    category: blue.category,
    source: "Tapped by you",
    glyph: "scan",
    tone: "own",
    logoBg: BLUE_BG,
  },
  {
    id: "blue-3",
    merchant: blue.merchant,
    initial: blue.initial,
    amount: "$14.20",
    group: "September 3, 2026",
    date: "Sep 3",
    source: "Email by you",
    glyph: "mail",
    tone: "own",
    logoBg: BLUE_BG,
  },
];

/**
 * The Features "Add" shot: the Receipts tab with no query, newest first, its
 * top rows fresh from the two ways to ADD a receipt that the tap doesn't
 * cover — a scanned paper one ("Scanned by you", scan ring) and a forwarded
 * email one ("Email by you", mail ring). New receipts arrive unreviewed.
 * The shot crops the device's TOP, so the rows that matter sit low enough to
 * show above the open FAB. Invented merchants only.
 */
export const ADD_ROWS: ListRow[] = [
  {
    id: "add-grocer",
    merchant: whole.merchant,
    initial: whole.initial,
    amount: whole.amount,
    group: "Today",
    date: "Sep 23",
    category: whole.category,
    source: "Scanned by you",
    glyph: "scan",
    tone: "own",
    logoBg: "linear-gradient(160deg,#4b7f52,#24512e)",
    unreviewed: true,
  },
  {
    id: "add-pharmacy",
    merchant: "Mossbrook Pharmacy",
    initial: "M",
    amount: "$12.85",
    group: "Today",
    date: "Sep 23",
    category: "Health & pharmacy",
    source: "Email by you",
    glyph: "mail",
    tone: "own",
    logoBg: "linear-gradient(160deg,#c2476a,#7a1f3b)",
    unreviewed: true,
  },
  {
    id: "add-hardware",
    merchant: "Copperpeg Hardware",
    initial: "C",
    amount: "$41.07",
    group: "Yesterday",
    date: "Sep 22",
    category: "Household",
    source: "Scanned by you",
    glyph: "scan",
    tone: "own",
    logoBg: "linear-gradient(160deg,#c77a1c,#7a4308)",
  },
  {
    id: "add-ride",
    merchant: uber.merchant,
    initial: uber.initial,
    amount: uber.amount,
    group: "Yesterday",
    date: "Sep 22",
    category: uber.category,
    source: "Email by you",
    glyph: "mail",
    tone: "own",
    logoBg: "linear-gradient(160deg,#3b434e,#161a20)",
  },
  {
    id: "add-coffee",
    merchant: blue.merchant,
    initial: blue.initial,
    amount: blue.amount,
    group: "Yesterday",
    date: "Sep 22",
    category: blue.category,
    source: "Tapped by you",
    glyph: "scan",
    tone: "own",
    logoBg: BLUE_BG,
  },
];

/**
 * The receipt DETAIL screen's content for the Features "Share" shot. An
 * INVENTED hardware receipt (it used to be a real USPS receipt from a
 * capture, with the post office's real address — no real merchants on the
 * site). The address names a demo street on purpose.
 *
 * The two sharing cards are the point of the shot, and both read from here:
 *   - `sharedGroup` -> the Shared Group card: "Shared with <group>", filled
 *     people glyph, blue rim (receiptDetail.tsx sharingTriggerContent; the
 *     rim appears once the receipt is in a group, app-reference.md §6.7);
 *   - `sharedWith` -> the Receipt Sharing card ("Shared with <name>") AND the
 *     store card's "Shared" tag, which renders only when that list is
 *     non-empty (receiptDetail.tsx `receiptIsSharedOut`). Showing the tag over
 *     an empty "Not shared" card is a contradiction the app cannot produce.
 */
export const DETAIL_RECEIPT = {
  merchant: "COPPERPEG HARDWARE",
  initial: "C",
  logoBg: "linear-gradient(160deg,#c77a1c,#7a4308)",
  address: "48 Demo Street, San Francisco, CA",
  date: "2026-09-22 • 16:44",
  /** `${sourceEmoji} ${sourceLabel} Receipt` (receiptDetail.tsx). */
  sourceLine: "📷 Scanned Receipt",
  sharedGroup: DEMO_GROUP as string | undefined,
  sharedWith: DEMO_PERSON,
  items: [
    { name: "Cordless drill", qty: "×1", price: "$33.58" },
    { name: "Wood screws, 100 pk", qty: "×1", price: "$7.49" },
  ],
  subtotal: "$41.07",
  total: "$41.07",
  payment: "VISA",
};

/**
 * The Features "Deals" shot: the Stores tab's 2-column grid of store tiles
 * (components/coupons/StoreTile.tsx). Per tile, top to bottom: a 72pt brand
 * banner with the category eyebrow, the store's app-icon mark straddling its
 * lower edge, the glass heart top-right (filled = a favorite), the name, the
 * offer lines — the lead coupon's title + "Expires <date>", or, with no
 * coupon, "Open · closes <time>" — and a footer "N coupons" in orange ("No
 * coupons yet" muted). Coupons on a tile are the SHOPPER's own (earned or
 * scanned), never invented promotions shown as the store's. Invented stores
 * and demo offers only; the shot is captioned as demo data.
 */
export interface StoreTileData {
  id: string;
  name: string;
  initial: string;
  category: string;
  /** The banner's brand field. */
  cover: string;
  /** The app-icon mark's fill. */
  mark: string;
  favorite?: boolean;
  offer?: string;
  expiry?: string;
  /** Shown only without an offer: "Open" (green) + detail. */
  openDetail?: string;
  coupons: number;
}

export const STORE_TILES: StoreTileData[] = [
  {
    id: "coffee",
    name: blue.merchant,
    initial: blue.initial,
    category: "Coffee",
    cover: "linear-gradient(120deg,#1f5fae,#0d3a73)",
    mark: BLUE_BG,
    favorite: true,
    offer: "$1 off any drink",
    expiry: "Expires Oct 4",
    coupons: 2,
  },
  {
    id: "grocer",
    name: whole.merchant,
    initial: whole.initial,
    category: "Grocery",
    cover: "linear-gradient(120deg,#3f7a48,#1d4a27)",
    mark: "linear-gradient(160deg,#4b7f52,#24512e)",
    offer: "10% off produce",
    expiry: "Expires Oct 12",
    coupons: 1,
  },
  {
    id: "hardware",
    name: "Copperpeg Hardware",
    initial: "C",
    category: "Hardware",
    cover: "linear-gradient(120deg,#b86d14,#6e3c06)",
    mark: "linear-gradient(160deg,#c77a1c,#7a4308)",
    favorite: true,
    openDetail: "closes 7 PM",
    coupons: 0,
  },
  {
    id: "pharmacy",
    name: "Mossbrook Pharmacy",
    initial: "M",
    category: "Pharmacy",
    cover: "linear-gradient(120deg,#b23f60,#6e1a34)",
    mark: "linear-gradient(160deg,#c2476a,#7a1f3b)",
    offer: "$5 off $25",
    expiry: "Expires Oct 18",
    coupons: 1,
  },
];
