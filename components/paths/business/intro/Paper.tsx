import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import type { ReceiptSummary } from "@/lib/receiptSummary"
import { money } from "../story/receipt"
import { tapToRetain } from "../content"
import s from "./intro.module.css"

/**
 * The two pieces of PAPER the §02 scene grows and sends into the phone.
 *
 * The receipt prints the /customers demo sale ("Nook Cafe", invented),
 * decoded through lib/escpos.ts by `useDemoReceipt()` — the same numbers the
 * App Clip screen shows once it lands, and the same sale §03 follows. The
 * coupon is a demo coupon from the same store, stamped "Demo" on its face.
 *
 * Both are decorative pictures: the caller hides them from assistive tech and
 * the cards beside the scene carry the words. Text is sized in CSS so it never
 * drops under 13px, including on a 390px phone.
 */
export const PaperReceipt = forwardRef<HTMLDivElement, { summary: ReceiptSummary; className?: string }>(
  function PaperReceipt({ summary, className }, ref) {
    return (
      <div ref={ref} className={cn(s.paper, s.receipt, className)}>
        <div className={s.pHead}>{summary.merchantName ?? "RECEIPT"}</div>
        {summary.addressLines[0] ? <div className={s.pSub}>{summary.addressLines[0]}</div> : null}
        <div className={s.pRule} />
        {summary.items.map((item) => (
          <div key={item.label} className={s.pRow}>
            <span className={s.pName}>{item.name}</span>
            <span>{money(item.amount)}</span>
          </div>
        ))}
        <div className={s.pRule} />
        {typeof summary.subtotal === "number" ? (
          <div className={s.pRow}>
            <span>Subtotal</span>
            <span>{money(summary.subtotal)}</span>
          </div>
        ) : null}
        {typeof summary.tax === "number" ? (
          <div className={s.pRow}>
            <span>Tax</span>
            <span>{money(summary.tax)}</span>
          </div>
        ) : null}
        <div className={cn(s.pRow, s.pTotal)}>
          <span>TOTAL</span>
          <span>{money(summary.total)}</span>
        </div>
        <div className={s.pFoot}>THANK YOU</div>
      </div>
    )
  },
)

export const PaperCoupon = forwardRef<HTMLDivElement, { merchant?: string; className?: string }>(
  function PaperCoupon({ merchant, className }, ref) {
    const c = tapToRetain.paperCoupon
    return (
      <div ref={ref} className={cn(s.paper, s.coupon, className)}>
        <div className={s.cInner}>
          <div className={s.pHead}>{merchant ?? "NOOK CAFE"}</div>
          <div className={s.cKicker}>{c.kicker}</div>
          <div className={s.cValue}>{c.value}</div>
          <div className={s.cLine}>{c.line}</div>
          <div className={s.cValid}>{c.valid}</div>
          <span className={s.cStamp}>{c.stamp}</span>
        </div>
      </div>
    )
  },
)
