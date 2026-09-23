import { receiptsListContent } from "../content";
import type { RowIcon } from "./Chrome";

/**
 * Sample rows for the drawn app screens.
 *
 * The merchant, initial and amount still come from content.ts (one source for
 * the copy). Everything else here is the shape the REAL list has, taken from
 * app-media/reference/app-receipts-list.png: a full-date group heading, a
 * short "Sep 23" line, a provenance line ("Scanned by you • The Core Four",
 * "Shared by … in House PapeX"), and a trailing action button whose icon says
 * how the receipt arrived.
 *
 * Logo colours are the merchants' own brand hues behind a monogram — the app
 * shows the real marks, which we neither have the rights to redraw nor want to
 * fake here.
 */

export interface ListRow {
  merchant: string;
  initial: string;
  amount: string;
  /** Group heading above the row, e.g. "September 22, 2026". */
  group: string;
  /** The row's own short date line, e.g. "Sep 22". */
  date: string;
  source: string;
  /** Renders the leading "Shared by" in blue, as the app does. */
  sharedBy?: string;
  icon: RowIcon;
  logoBg: string;
  unreviewed?: boolean;
}

const [blue, whole, uber] = receiptsListContent.rows;

export const LIST_ROWS: ListRow[] = [
  {
    merchant: blue.merchant,
    initial: blue.initial,
    amount: blue.amount,
    group: "September 22, 2026",
    date: "Sep 22",
    source: "Scanned by you • The Core Four",
    icon: "share",
    logoBg: "linear-gradient(160deg,#2f7ad6,#10529e)",
    unreviewed: blue.unreviewed,
  },
  {
    merchant: whole.merchant,
    initial: whole.initial,
    amount: whole.amount,
    group: "September 21, 2026",
    date: "Sep 21",
    sharedBy: "Shared by",
    source: " Bruno Courbage in House PapeX",
    icon: "people",
    logoBg: "linear-gradient(160deg,#4b7f52,#24512e)",
  },
  {
    merchant: uber.merchant,
    initial: uber.initial,
    amount: uber.amount,
    group: "September 14, 2026",
    date: "Sep 14",
    source: "Email by you",
    icon: "mail",
    logoBg: "linear-gradient(160deg,#3b434e,#161a20)",
  },
];

/**
 * The receipt DETAIL screen's content — the USPS receipt from
 * app-media/reference/app-receipt-detail-usps-{top,bottom}.webp, which is the
 * screen the "share in a tap" row is actually about.
 */
export const DETAIL_RECEIPT = {
  merchant: "UNITED STATES POSTAL SERVICE",
  initial: "U",
  logoBg: "linear-gradient(160deg,#2f7ad6,#10529e)",
  address: "910 D St, San Rafael, Ca, 94901-9991",
  date: "2026-09-23 • 16:44",
  sourceChip: "Scanned Receipt",
  items: [
    { name: "USPS Grnd Advtg", qty: "×1", price: "$5.49" },
    { name: "New York, NY 10002", qty: "×1", price: "$26.05" },
  ],
  subtotal: "$31.54",
  total: "$31.54",
  payment: "VISA",
};
