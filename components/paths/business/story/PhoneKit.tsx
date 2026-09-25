"use client"

import type { CSSProperties } from "react"
import { AppKitRoot, ClipReceipt, type ClipReceiptData } from "@/components/app-kit"
import { PAYMENT_METHOD_STYLES, detectPaymentMethod, extractLastFour, type ReceiptSummary } from "@/lib/receiptSummary"
import s from "../story.module.css"

/**
 * The customer's iPhone screens in the §03 story, drawn with the code-sourced
 * app kit (components/app-kit, synced from PapeXV2 + Papex_AppClip):
 *   - `ClipScreen`  the App Clip's receipt (Papex_AppClip ReceiptView.swift)
 *   - once the story has settled the phone is usable: PhoneApp.tsx (Save to
 *     PapeX -> the app's Receipts / Coupons tabs and their details).
 * The lock screen, the App Clip card and "Reading your receipt" are iOS
 * system chrome, not app code, so they stay the /customers drawings
 * (customer/appui ClipLockScreen / ClipReading) — the kit has none.
 *
 * All units are app points: `--pt` = the phone screen's width / 393, from
 * the phone frame's own `--wp-w` (customer/iphone.module.css).
 */

const PT: CSSProperties = { ["--pt" as string]: "calc(var(--wp-w) / 393)" }

const titleCase = (t: string) => t.toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase())

function paymentLabel(summary: ReceiptSummary): string | undefined {
  const net = summary.paymentLine ? detectPaymentMethod(summary.paymentLine) : null
  const last = summary.paymentLine ? extractLastFour(summary.paymentLine) : null
  if (!net) return undefined
  const label = titleCase(PAYMENT_METHOD_STYLES[net]?.label ?? net)
  return last ? `${label} •••• ${last}` : label
}

export function clipData(summary: ReceiptSummary): ClipReceiptData {
  return {
    merchantName: titleCase(summary.merchantName ?? "Tidewick Cafe"),
    addressLines: summary.addressLines.slice(0, 2),
    dateline: summary.dateline,
    items: summary.items.map((i) => ({ label: i.name, quantity: i.qty, amount: i.amount })),
    subtotal: summary.subtotal,
    tax: summary.tax,
    total: summary.total ?? 0,
    payment: paymentLabel(summary),
  }
}

/** The App Clip's receipt, filling the phone screen. */
export function ClipScreen({ summary }: { summary: ReceiptSummary }) {
  return (
    <AppKitRoot style={PT} className={s.kitFill}>
      <ClipReceipt data={clipData(summary)} />
    </AppKitRoot>
  )
}
