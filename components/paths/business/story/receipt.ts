"use client"

import { useMemo } from "react"
import { parseEscPos } from "@/lib/escpos"
import { summarizeReceipt, type ReceiptSummary } from "@/lib/receiptSummary"
import { demoReceiptBytes } from "../../customer/demoReceipt"

/**
 * The one sale this whole scene follows: the /customers demo receipt, decoded
 * through this repo's own ESC/POS parser (never a second, hand-typed copy), so
 * the paper slip, the phone and the dashboard all show the same numbers.
 */
export function useDemoReceipt(): ReceiptSummary {
  return useMemo(() => summarizeReceipt(parseEscPos(demoReceiptBytes()).lines), [])
}

export const money = (n?: number) => (typeof n === "number" ? n.toFixed(2) : "")
export const usd = (n?: number) => (typeof n === "number" ? `$${n.toFixed(2)}` : "—")

/** "Order #1042" from the receipt's dateline, if it carries one. */
export function orderLabel(summary: ReceiptSummary): string | undefined {
  const m = /Order\s*#\s*(\d+)/i.exec(summary.dateline ?? "")
  return m ? `Order #${m[1]}` : undefined
}

/** The receipt's hour (0-23), for the dashboard's hour-of-day chart. */
export function receiptHour(summary: ReceiptSummary): number {
  const t = /\b(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(summary.dateline ?? "")
  if (!t) return 10
  let h = Number(t[1]) % 12
  if (t[3]?.toUpperCase() === "PM") h += 12
  else if (!t[3]) h = Number(t[1])
  return h
}
