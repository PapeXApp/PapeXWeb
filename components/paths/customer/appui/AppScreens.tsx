import {
  AppKitRoot,
  CouponsScreen,
  demoCoupons,
  demoStore,
  ReceiptsScreen,
  type KitReceipt,
} from "@/components/app-kit";
import type { ReceiptSummary } from "@/lib/receiptSummary";
import { cn } from "@/lib/utils";
import { receiptsListContent } from "../content";
import { StatusBar } from "./Chrome";
import { DEMO_GROUP, DEMO_PERSON } from "./data";
import x from "./appScreens.module.css";

/**
 * The PapeX app screens the walkthrough lands on, drawn by the app kit
 * (components/app-kit — ports of PapeXV2's own receipts.tsx / coupons.tsx,
 * with the Liquid Glass tab bar and its glass icons) instead of the older
 * hand-drawn appui screens. W3, 2026-09-24.
 *
 * Story: the receipt the App Clip just showed is saved, so it tops the
 * Receipts tab (unreviewed, "Tapped by you"). Nook Cafe is a partner store in
 * the kit's demo data, so that same tap also left a coupon for the next visit
 * ("Given when you tapped at the counter") — the Coupons tab shows it next to
 * two coupons the shopper scanned elsewhere. Coupons are live (Nico,
 * 2026-09-24): a tap can bring one at select stores; everywhere else you
 * save coupons by scanning them.
 *
 * All merchants, people and amounts are invented demo data.
 */

/** An invented monogram logo (letter on a colour disc) as an SVG data URI. */
function monogram(letter: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${bg}"/><text x="40" y="53" font-family="Georgia,serif" font-size="40" font-weight="700" text-anchor="middle" fill="#FFFFFF">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const [, greenleaf, cityhop] = receiptsListContent.rows;
const nook = demoStore("demo-nook-cafe");
const copper = demoStore("demo-copperpeg-hardware");
const quill = demoStore("demo-quillbrook-market");
const toAmount = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

/** The Receipts tab right after the tap. Row 1 IS the decoded receipt. */
export function walkReceipts(summary: ReceiptSummary): KitReceipt[] {
  const base = { isSharedWithCurrentUser: false, isSharedByCurrentUser: false, reviewed: true } as const;
  return [
    {
      ...base,
      id: "tap",
      merchantName: nook.name,
      logoUrl: nook.logoUrl ?? null,
      amount: summary.total ?? null,
      dateLabel: "Jun 8",
      category: "Dining",
      source: "rdh",
      originDetail: "Tapped by you",
      reviewed: false,
      section: "Today",
    },
    {
      ...base,
      id: "greenleaf",
      merchantName: greenleaf.merchant,
      logoUrl: monogram(greenleaf.initial, "#3C6E47"),
      amount: toAmount(greenleaf.amount),
      dateLabel: "Jun 7",
      category: greenleaf.category,
      source: "scanned",
      originDetail: `Shared by ${DEMO_PERSON} in ${DEMO_GROUP}`,
      isSharedWithCurrentUser: true,
      section: "Yesterday",
    },
    {
      ...base,
      id: "copper",
      merchantName: copper.name,
      logoUrl: copper.logoUrl ?? null,
      amount: 38.17,
      dateLabel: "Jun 5",
      category: "Home",
      source: "scanned",
      originDetail: "Scanned by you",
      section: "June 5, 2026",
    },
    {
      ...base,
      id: "cityhop",
      merchantName: cityhop.merchant,
      logoUrl: monogram(cityhop.initial, "#2B3440"),
      amount: toAmount(cityhop.amount),
      dateLabel: "Jun 5",
      category: cityhop.category,
      source: "email",
      originDetail: "Email by you",
      section: "June 5, 2026",
    },
    {
      ...base,
      id: "quill",
      merchantName: quill.name,
      logoUrl: quill.logoUrl ?? null,
      amount: 54.82,
      dateLabel: "Jun 3",
      category: "Groceries",
      source: "rdh",
      originDetail: "Tapped by you",
      section: "June 3, 2026",
    },
  ];
}

/**
 * Receipts tab, then (when `coupons`) the Coupons tab, cross-faded in place.
 * `time` is the status-bar clock (receiptMoment of the receipt).
 */
export function WalkAppScreen({ summary, coupons, time }: { summary: ReceiptSummary; coupons: boolean; time: string }) {
  return (
    <AppKitRoot mode="dark" width="var(--wp-w)" className={x.root}>
      <div className={cn(x.layer, !coupons && x.on)} aria-hidden={coupons}>
        <ReceiptsScreen receipts={walkReceipts(summary)} statusBar={false} />
      </div>
      <div className={cn(x.layer, coupons && x.on)} aria-hidden={!coupons}>
        <CouponsScreen coupons={demoCoupons} statusBar={false} />
      </div>
      <StatusBar time={time} />
    </AppKitRoot>
  );
}
