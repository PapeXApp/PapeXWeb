"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import {
  AppKitRoot,
  ClipReceipt,
  ReceiptDetail,
  ReceiptsScreen,
  demoReceipts,
  demoStores,
  type ClipReceiptData,
  type KitReceipt,
} from "@/components/app-kit"
import { PAYMENT_METHOD_STYLES, detectPaymentMethod, extractLastFour, type ReceiptSummary } from "@/lib/receiptSummary"
import s from "../story.module.css"

/**
 * The customer's iPhone screens in the §03 story, drawn with the code-sourced
 * app kit (components/app-kit, synced from PapeXV2 + Papex_AppClip):
 *   - `ClipScreen`  the App Clip's receipt (Papex_AppClip ReceiptView.swift)
 *   - `PhoneApp`    once the story has settled, the phone is usable: "Save to
 *                   PapeX" files the receipt into the app's Receipts tab
 *                   (app/(tabs)/receipts.tsx), and its row opens the app's
 *                   receipt detail (app/receiptDetail.tsx), with a way back.
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

function kitReceipts(summary: ReceiptSummary): KitReceipt[] {
  const mine: KitReceipt = {
    id: "story-receipt",
    merchantName: titleCase(summary.merchantName ?? "Tidewick Cafe"),
    logoUrl: demoStores[0].logoUrl ?? null,
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
    payment: paymentLabel(summary),
    sharedWith: [],
  }
  // the kit's other invented receipts, re-dated to sit before this one
  const earlier = demoReceipts.slice(1, 4).map((r, i) => ({
    ...r,
    dateLabel: i < 2 ? "Jun 7" : "Jun 6",
    section: i < 2 ? "Yesterday" : "June 6, 2026",
  }))
  return [mine, ...earlier]
}

/** The App Clip's receipt, filling the phone screen. */
export function ClipScreen({ summary }: { summary: ReceiptSummary }) {
  return (
    <AppKitRoot style={PT} className={s.kitFill}>
      <ClipReceipt data={clipData(summary)} />
    </AppKitRoot>
  )
}

type Step = "clip" | "list" | "detail"

/**
 * The tap-through, layered over the clip receipt. Nothing is rendered or
 * focusable until `live` (the story has settled); `reset` changing sends it
 * back to the clip receipt.
 */
export function PhoneApp({ summary, live, reset }: { summary: ReceiptSummary; live: boolean; reset: number }) {
  const [step, setStep] = useState<Step>("clip")
  useEffect(() => setStep("clip"), [reset])
  const list = kitReceipts(summary)

  return (
    <>
      {step !== "clip" ? (
        <AppKitRoot style={PT} className={cn(s.layer, s.layerOn, s.kitFill)}>
          {step === "list" ? <ReceiptsScreen receipts={list} /> : <ReceiptDetail receipt={list[0]} />}
        </AppKitRoot>
      ) : null}
      {live ? (
        <div className={s.hotspots} style={PT}>
          {step === "clip" ? (
            <button type="button" className={s.hot} style={{ left: "calc(12 * var(--pt))", right: "calc(12 * var(--pt))", bottom: "calc(40 * var(--pt))", height: "calc(112 * var(--pt))" }} onClick={() => setStep("list")}>
              <span className="sr-only">Save to PapeX</span>
            </button>
          ) : step === "list" ? (
            // over the first row (measured from the kit's ReceiptsScreen:
            // "Today" header + row, 230-318pt)
            <button type="button" className={s.hot} style={{ left: "calc(16 * var(--pt))", right: "calc(16 * var(--pt))", top: "calc(230 * var(--pt))", height: "calc(88 * var(--pt))" }} onClick={() => setStep("detail")}>
              <span className="sr-only">Open the {list[0].merchantName} receipt</span>
            </button>
          ) : (
            <button type="button" className={s.hot} style={{ left: "calc(12 * var(--pt))", top: "calc(52 * var(--pt))", width: "calc(56 * var(--pt))", height: "calc(56 * var(--pt))" }} onClick={() => setStep("list")}>
              <span className="sr-only">Back to receipts</span>
            </button>
          )}
        </div>
      ) : null}
    </>
  )
}
