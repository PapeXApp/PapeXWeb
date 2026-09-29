import { forwardRef, type Ref } from "react"
import { cn } from "@/lib/utils"
import type { ReceiptSummary } from "@/lib/receiptSummary"
import { money } from "./pocketData"
import { pocketCopy } from "./pocketCopy"
import s from "./pocket.module.css"

/**
 * The two pieces of PAPER the §02 pocket scene scans and sends into the phone,
 * each wearing its own scanner overlay (`Scanner`): four orange corner
 * brackets and a sweeping scan line. Adapted from /business §02's paper
 * (business/intro/Paper.tsx — copied, not imported: the two scenes evolve
 * separately).
 *
 * Both are decorative pictures: the caller hides them from assistive tech and
 * the caption cards carry the words. Text is sized in CSS so it never drops
 * under 13px, including on a 390px phone.
 */

type ScanRefs = { marksRef?: Ref<HTMLSpanElement>; beamRef?: Ref<HTMLSpanElement> }

/**
 * The scanner, drawn over a piece of paper. The scene drives two parts:
 * `marksRef` (the brackets: fade + scale) and `beamRef` (a full-height layer
 * whose bottom edge is the scan line: translateY -100% -> 0, inside a clip
 * the size of the paper). `still` draws the brackets locked on, no beam — the
 * static version's picture.
 */
function Scanner({ marksRef, beamRef, still = false }: ScanRefs & { still?: boolean }) {
  return (
    <>
      <span className={s.beamClip} aria-hidden="true">
        <span ref={beamRef} className={s.beam} />
      </span>
      <span ref={marksRef} className={cn(s.marks, still && s.marksStill)} aria-hidden="true">
        <span className={cn(s.mark, s.markTL)} />
        <span className={cn(s.mark, s.markTR)} />
        <span className={cn(s.mark, s.markBL)} />
        <span className={cn(s.mark, s.markBR)} />
      </span>
    </>
  )
}

type PaperProps = ScanRefs & { className?: string; still?: boolean }

export const PaperReceipt = forwardRef<HTMLDivElement, PaperProps & { summary: ReceiptSummary }>(function PaperReceipt(
  { summary, className, marksRef, beamRef, still },
  ref,
) {
  return (
    <div ref={ref} className={cn(s.flyer, className)}>
      <div className={cn(s.paper, s.receipt)}>
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
        <div className={s.pCard}>{pocketCopy.cardLine}</div>
        <div className={s.pFoot}>THANK YOU</div>
      </div>
      <Scanner marksRef={marksRef} beamRef={beamRef} still={still} />
    </div>
  )
})

/**
 * A decorative barcode for the printed coupon: bars derived from the digits,
 * so it's stable between server and browser. Not a real symbology.
 */
function Bars({ code }: { code: string }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  for (const ch of `9${code}7`) {
    const d = Number(ch) || 0
    const widths = [1 + (d % 3), 1 + ((d + 1) % 2), 1 + ((d * 7) % 3), 1]
    widths.forEach((w, i) => {
      if (i % 2 === 0) bars.push({ x, w })
      x += w + 1
    })
  }
  return (
    <svg viewBox={`0 0 ${x} 24`} preserveAspectRatio="none" className={s.cBars} aria-hidden="true">
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={24} fill="currentColor" />
      ))}
    </svg>
  )
}

export const PaperCoupon = forwardRef<HTMLDivElement, PaperProps>(function PaperCoupon(
  { className, marksRef, beamRef, still },
  ref,
) {
  const c = pocketCopy.paperCoupon
  return (
    <div ref={ref} className={cn(s.flyer, className)}>
      <div className={cn(s.paper, s.coupon)}>
        <div className={s.cInner}>
          <div className={cn(s.pHead, s.cHead)}>{c.store.toUpperCase()}</div>
          <div className={s.cKicker}>{c.kicker}</div>
          <div className={s.cValue}>{c.value}</div>
          <div className={s.cLine}>{c.line}</div>
          <div className={s.cTerms}>{c.terms}</div>
          <Bars code={c.barcode} />
          <div className={s.cCode}>{c.barcode}</div>
          <div className={s.cValid}>{c.valid}</div>
          <span className={s.cStamp}>{c.stamp}</span>
        </div>
      </div>
      <Scanner marksRef={marksRef} beamRef={beamRef} still={still} />
    </div>
  )
})
