import type { ReceiptSummary } from "@/lib/receiptSummary"
import { money } from "./receipt"
import s from "../story.module.css"

/**
 * The printed face of the paper receipt: the same decoded sale the phone and
 * the dashboard show later. The slip's box has a fixed 1:2.04 ratio (the fold
 * keys in fold.ts are tuned to it), so the print is sized to fill it.
 */
export function SlipBody({ summary }: { summary: ReceiptSummary }) {
  return (
    <>
      <div className={s.slipHead}>{summary.merchantName ?? "RECEIPT"}</div>
      {summary.addressLines[0] ? <div className={s.slipSub}>{summary.addressLines[0]}</div> : null}
      <div className={s.slipRule} />
      {summary.items.map((item) => (
        <div key={item.label} className={s.slipRow}>
          <span className={s.slipName}>{item.name}</span>
          <span>{money(item.amount)}</span>
        </div>
      ))}
      <div className={s.slipRule} />
      {typeof summary.subtotal === "number" ? (
        <div className={s.slipRow}>
          <span>Subtotal</span>
          <span>{money(summary.subtotal)}</span>
        </div>
      ) : null}
      {typeof summary.tax === "number" ? (
        <div className={s.slipRow}>
          <span>Tax</span>
          <span>{money(summary.tax)}</span>
        </div>
      ) : null}
      <div className={s.slipTotal}>
        <span>TOTAL</span>
        <span>{money(summary.total)}</span>
      </div>
      <div className={s.slipFoot}>THANK YOU</div>
      <div aria-hidden="true" className={s.slipBarcode} />
    </>
  )
}
