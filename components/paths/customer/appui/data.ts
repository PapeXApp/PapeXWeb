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
 */

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

const NOOK_BG = "linear-gradient(160deg,#9a5a2c,#5a2f14)";
const BLUE_BG = "linear-gradient(160deg,#2f7ad6,#10529e)";

/**
 * The walkthrough's step 3 ("Saved & organized"): the Receipts tab right after
 * the tap. The first row IS the receipt the App Clip just rendered in step 2 —
 * Nook Cafe, $12.42, dated Jun 8 2026 on the ticket (demoReceipt.ts), source
 * `rdh` so "Tapped by you" + the scan ring — and it is unreviewed, as every
 * new receipt is. The older rows show the other two provenances.
 */
export const LIST_ROWS: ListRow[] = [
  {
    id: "nook",
    merchant: "Nook Cafe",
    initial: "N",
    amount: "$12.42",
    group: "June 8, 2026",
    date: "Jun 8",
    source: "Tapped by you",
    glyph: "scan",
    tone: "own",
    logoBg: NOOK_BG,
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
    source: " Bruno Courbage in House PapeX",
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
    source: "Scanned by you • The Core Four",
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
 * The receipt DETAIL screen's content — the USPS receipt from
 * app-media/reference/app-receipt-detail-usps-{top,bottom}.webp.
 *
 * `sharedWith` is load-bearing: the store card's "Shared" tag renders only
 * when the receipt's `sharedWith` list is non-empty (receiptDetail.tsx
 * `receiptIsSharedOut`), and that same list is what the Receipt Sharing card
 * summarises ("Shared with <name>"). Showing the tag over an empty "Not shared"
 * card is a contradiction the app cannot produce.
 */
export const DETAIL_RECEIPT = {
  merchant: "UNITED STATES POSTAL SERVICE",
  initial: "U",
  address: "910 D St, San Rafael, Ca, 94901-9991",
  date: "2026-09-23 • 16:44",
  /** `${sourceEmoji} ${sourceLabel} Receipt` (receiptDetail.tsx). */
  sourceLine: "📷 Scanned Receipt",
  sharedWith: "Bruno Courbage",
  items: [
    { name: "USPS Grnd Advtg", qty: "×1", price: "$5.49" },
    { name: "New York, NY 10002", qty: "×1", price: "$26.05" },
  ],
  subtotal: "$31.54",
  total: "$31.54",
  payment: "VISA",
};
