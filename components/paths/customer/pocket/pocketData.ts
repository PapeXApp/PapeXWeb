"use client"

import { useMemo } from "react"
import { demoCoupons, demoStore, type KitCoupon, type KitReceipt } from "@/components/app-kit"
import { parseEscPos } from "@/lib/escpos"
import { summarizeReceipt, type ReceiptSummary } from "@/lib/receiptSummary"
import { walkReceipts } from "../appui"
import { demoReceiptBytes } from "../demoReceipt"

/**
 * The data the §02 pocket scene shows, all invented.
 *
 * The receipt is the /customers demo sale ("Tidewick Cafe"), decoded through
 * this repo's own lib/escpos.ts + lib/receiptSummary.ts — never a second,
 * hand-typed copy — so the paper and the row it lands on carry the same total
 * as every other phone on the page.
 */
export function useDemoReceipt(): ReceiptSummary {
  return useMemo(() => summarizeReceipt(parseEscPos(demoReceiptBytes()).lines), [])
}

export const money = (n?: number) => (typeof n === "number" ? n.toFixed(2) : "")

/**
 * The Receipts tab around the scan. `scanned` is the receipt the paper turns
 * into: unreviewed (orange rim + dot), provenance "Scanned by you", in a new
 * "Today" section. `earlier` is the rest of the walkthrough's list (appui
 * `walkReceipts`, minus its tapped Tidewick row), with the forwarded email
 * receipt left unreviewed so the header already reads "1 unreviewed" before
 * the scan and "2 unreviewed" after it.
 */
export function pocketReceipts(summary: ReceiptSummary): { scanned: KitReceipt; earlier: KitReceipt[] } {
  const [tapped, ...rest] = walkReceipts(summary)
  const scanned: KitReceipt = {
    ...tapped,
    id: "scan",
    source: "scanned",
    originDetail: "Scanned by you",
    reviewed: false,
    section: "Today",
  }
  const earlier = rest.map((r) => (r.source === "email" ? { ...r, reviewed: false } : r))
  return { scanned, earlier }
}

/**
 * The Coupons tab around the scan. `scanned` is the paper coupon's twin (the
 * kit's Copperpeg Hardware "$5 off", `via: 'scan'`); `earlier` are the other
 * two in the demo wallet — including Tidewick's tap coupon, the "earn them
 * with a tap" half of the caption.
 */
export const pocketCoupons: { scanned: KitCoupon; earlier: KitCoupon[] } = {
  scanned: demoCoupons.find((c) => c.id === "c2") ?? demoCoupons[0],
  earlier: demoCoupons.filter((c) => c.id !== "c2"),
}

export { demoStore }
