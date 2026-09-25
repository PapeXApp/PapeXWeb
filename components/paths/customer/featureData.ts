import { demoCoupons, demoStore, type KitCoupon, type KitReceipt } from "@/components/app-kit";
import type { PersonaId } from "./content";
import { DEMO_GROUP, DEMO_PERSON } from "./appui/data";

/**
 * DEMO DATA for the five feature phones (section 04, under the quiz). Everything is INVENTED, and
 * only these names appear: the stores Tidewick Cafe, Copperpeg Hardware,
 * Mossbrook Pharmacy and Quillbrook Market (the app kit's demo stores, with
 * their monogram logos), the person Jordan Reyes and the group Housemates
 * (appui/data.ts DEMO_PERSON / DEMO_GROUP). No addresses, no real places.
 *
 * Field names are the kit's KitReceipt / KitCoupon (PapeXV2's own types), so
 * the kit screens render them exactly as the app renders a receipt or coupon.
 * `originDetail` is worded the way `buildReceiptOriginSummary` words it.
 *
 * THE QUIZ CHANGES THE DATA, not just the order: each persona searches for a
 * different store in the Find shot, the Export shot selects a different set
 * of receipts, and the Deals shot opens on the tab that persona cares about
 * (see `dealsTab`). Before the quiz the page shows
 * `casual`, and so does the server render, so first paint never changes.
 */

const tidewick = demoStore("demo-tidewick-cafe");
const copper = demoStore("demo-copperpeg-hardware");
const moss = demoStore("demo-mossbrook-pharmacy");
const quill = demoStore("demo-quillbrook-market");

type Visit = Pick<KitReceipt, "id" | "amount" | "dateLabel" | "section" | "source" | "originDetail"> &
  Partial<Pick<KitReceipt, "reviewed" | "isSharedWithCurrentUser" | "isSharedByCurrentUser">>;

function visits(
  store: { name: string; logoUrl?: string },
  category: string,
  rows: Visit[],
): KitReceipt[] {
  return rows.map((v) => ({
    merchantName: store.name,
    logoUrl: store.logoUrl ?? null,
    category,
    reviewed: true,
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: false,
    ...v,
  }));
}

const SHARED_IN = `Shared by ${DEMO_PERSON} in ${DEMO_GROUP}`;

/** FIND — the query each persona types, and the receipts it filters to.
 *  Search FILTERS (app-reference.md §1.7), so every row matches the query.
 *  The Keeper searches the grocer they track (every row auto-filed under
 *  Groceries); the Non-Keeper searches the hardware store for a RETURN (their
 *  row title is "Find it for a return."); the Casual looks up a café. */
export const FIND_BY_PERSONA: Record<PersonaId, { query: string; rows: KitReceipt[] }> = {
  casual: {
    query: "tidewick",
    rows: visits(tidewick, "Dining", [
      { id: "f-t1", amount: 12.42, dateLabel: "Sep 22", section: "September 22, 2026", source: "rdh", originDetail: "Tapped by you", reviewed: false },
      { id: "f-t2", amount: 8.75, dateLabel: "Sep 15", section: "September 15, 2026", source: "rdh", originDetail: "Tapped by you" },
      { id: "f-t3", amount: 21.3, dateLabel: "Sep 9", section: "September 9, 2026", source: "scanned", originDetail: SHARED_IN, isSharedWithCurrentUser: true },
      { id: "f-t4", amount: 6.5, dateLabel: "Sep 2", section: "September 2, 2026", source: "email", originDetail: "Email by you" },
      { id: "f-t5", amount: 14.2, dateLabel: "Aug 26", section: "August 26, 2026", source: "rdh", originDetail: "Tapped by you" },
    ]),
  },
  keeper: {
    query: "quillbrook",
    rows: visits(quill, "Groceries", [
      { id: "f-q1", amount: 54.82, dateLabel: "Sep 22", section: "September 22, 2026", source: "rdh", originDetail: "Tapped by you", reviewed: false },
      { id: "f-q2", amount: 31.06, dateLabel: "Sep 14", section: "September 14, 2026", source: "rdh", originDetail: "Tapped by you" },
      { id: "f-q3", amount: 68.4, dateLabel: "Sep 6", section: "September 6, 2026", source: "scanned", originDetail: SHARED_IN, isSharedWithCurrentUser: true },
      { id: "f-q4", amount: 19.75, dateLabel: "Aug 29", section: "August 29, 2026", source: "rdh", originDetail: "Tapped by you" },
      { id: "f-q5", amount: 42.13, dateLabel: "Aug 21", section: "August 21, 2026", source: "email", originDetail: "Email by you" },
    ]),
  },
  non: {
    query: "copperpeg",
    rows: visits(copper, "Home", [
      { id: "f-c1", amount: 38.17, dateLabel: "Sep 23", section: "September 23, 2026", source: "scanned", originDetail: `Scanned by you • ${DEMO_GROUP}`, isSharedByCurrentUser: true, reviewed: false },
      { id: "f-c2", amount: 112.6, dateLabel: "Sep 12", section: "September 12, 2026", source: "email", originDetail: "Email by you" },
      { id: "f-c3", amount: 24.99, dateLabel: "Aug 30", section: "August 30, 2026", source: "rdh", originDetail: "Tapped by you" },
      { id: "f-c4", amount: 9.48, dateLabel: "Aug 18", section: "August 18, 2026", source: "scanned", originDetail: SHARED_IN, isSharedWithCurrentUser: true },
      { id: "f-c5", amount: 57.3, dateLabel: "Aug 4", section: "August 4, 2026", source: "scanned", originDetail: "Scanned by you" },
    ]),
  },
};

/** ADD — the Receipts tab, unfiltered, newest first. The two newest came in
 *  the two ways a tap doesn't cover: a snapped paper receipt and a forwarded
 *  email one. New receipts arrive unreviewed. */
export const ADD_RECEIPTS: KitReceipt[] = [
  ...visits(quill, "Groceries", [
    { id: "a-q", amount: 63.4, dateLabel: "Sep 24", section: "Today", source: "scanned", originDetail: "Scanned by you", reviewed: false },
  ]),
  ...visits(moss, "Health", [
    { id: "a-m", amount: 12.85, dateLabel: "Sep 24", section: "Today", source: "email", originDetail: "Email by you", reviewed: false },
  ]),
  ...visits(tidewick, "Dining", [
    { id: "a-t", amount: 12.42, dateLabel: "Sep 23", section: "Yesterday", source: "rdh", originDetail: "Tapped by you" },
  ]),
  ...visits(copper, "Home", [
    { id: "a-c", amount: 38.17, dateLabel: "Sep 23", section: "Yesterday", source: "scanned", originDetail: `Scanned by you • ${DEMO_GROUP}`, isSharedByCurrentUser: true },
  ]),
  ...visits(moss, "Health", [
    { id: "a-m2", amount: 21.6, dateLabel: "Sep 21", section: "September 21, 2026", source: "scanned", originDetail: SHARED_IN, isSharedWithCurrentUser: true },
  ]),
];

/** SHARE — one receipt's detail screen, shared BOTH ways: into the group
 *  (Shared Group card) and with one person (Receipt Sharing card). */
export const SHARE_RECEIPT: KitReceipt = {
  id: "s-c",
  merchantName: copper.name,
  logoUrl: copper.logoUrl ?? null,
  amount: 38.17,
  dateLabel: "Sep 23",
  category: "Home",
  source: "scanned",
  originDetail: `Scanned by you • ${DEMO_GROUP}`,
  isSharedWithCurrentUser: false,
  isSharedByCurrentUser: true,
  reviewed: true,
  section: "Yesterday",
  dateTime: "Sep 23, 2026 · 5:16 PM",
  items: [
    { name: "Wood screws, 100 ct", quantity: 2, price: 6.49 },
    { name: "Sanding sheets", quantity: 1, price: 8.99 },
    { name: "Painter’s tape", quantity: 2, price: 5.99 },
  ],
  subtotal: 33.95,
  tax: 4.22,
  payment: "Mastercard •••• 2280",
  sharedWith: [DEMO_PERSON],
  sharedGroup: DEMO_GROUP,
};

/** DEALS — the shopper's coupons. The first is the partner-tap coupon, the
 *  same everywhere on the site ("$2 OFF" / "$2 off your next visit" /
 *  "Expires in 30 days" — the kit's c1). The rest were scanned. */
export const DEAL_COUPONS: KitCoupon[] = [
  ...demoCoupons,
  {
    id: "c4",
    storeId: "demo-mossbrook-pharmacy",
    kind: "percent",
    title: "20% off vitamins",
    expiresAt: "2026-10-18T23:59:00",
    via: "scan",
  },
];
/** Coupons the shopper has hearted (Favorites). */
export const DEAL_FAVORITES = ["c1", "c3"];

/** The Stores tab grid: every store the shopper has a receipt from. */
export const DEAL_STORES = [tidewick, copper, quill, moss];
export const DEAL_FAVORITE_STORES = [tidewick.id];

/** Which tab the Deals phone opens on, per persona. The Keeper keeps store
 *  pages and favorites; everyone else sees the coupons themselves first. */
export const dealsTab: Record<PersonaId, "stores" | "coupons"> = {
  keeper: "stores",
  casual: "coupons",
  non: "coupons",
};

/** EXPORT — the Receipts tab in SELECT MODE (app-reference.md §1.4 and
 *  "Select mode": title row [✕] [N Selected] [•••], checkboxes on every row,
 *  the SelectionFAB with a share glyph + count badge, whose menu's first item,
 *  Share, builds one PDF — PapeXV2 services/receiptExport.ts). `selected` are
 *  the ids ticked; the menu is drawn open. The Keeper exports a month of
 *  groceries; everyone else a couple of receipts. */
const EXPORT_ROWS: KitReceipt[] = [
  ...visits(quill, "Groceries", [
    { id: "e-q1", amount: 54.82, dateLabel: "Sep 22", section: "September 22, 2026", source: "rdh", originDetail: "Tapped by you" },
    { id: "e-q2", amount: 31.06, dateLabel: "Sep 14", section: "September 14, 2026", source: "rdh", originDetail: "Tapped by you" },
  ]),
  ...visits(copper, "Home", [
    { id: "e-c1", amount: 38.17, dateLabel: "Sep 12", section: "September 12, 2026", source: "scanned", originDetail: "Scanned by you" },
  ]),
  ...visits(quill, "Groceries", [
    { id: "e-q3", amount: 68.4, dateLabel: "Sep 6", section: "September 6, 2026", source: "email", originDetail: "Email by you" },
  ]),
  ...visits(moss, "Health", [
    { id: "e-m1", amount: 12.85, dateLabel: "Sep 3", section: "September 3, 2026", source: "email", originDetail: "Email by you" },
  ]),
  ...visits(tidewick, "Dining", [
    { id: "e-t1", amount: 12.42, dateLabel: "Aug 30", section: "August 30, 2026", source: "rdh", originDetail: "Tapped by you" },
  ]),
];

export const EXPORT_BY_PERSONA: Record<PersonaId, { rows: KitReceipt[]; selected: string[] }> = {
  keeper: { rows: EXPORT_ROWS, selected: ["e-q1", "e-q2", "e-q3"] },
  casual: { rows: EXPORT_ROWS, selected: ["e-c1", "e-m1"] },
  non: { rows: EXPORT_ROWS, selected: ["e-c1", "e-m1"] },
};
