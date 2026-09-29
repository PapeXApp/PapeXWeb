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

type EmailRefs = {
  /** The Forward button's pressed (orange) look, faded in by the scene. */
  forwardOnRef?: Ref<HTMLSpanElement>
  /** The "Fwd:" compose sheet, slid up from the window's bottom edge. */
  composeRef?: Ref<HTMLDivElement>
  /** The To address, typed out by a clip-path wipe. */
  addressRef?: Ref<HTMLSpanElement>
  /** The Send button's pressed look. */
  sendOnRef?: Ref<HTMLSpanElement>
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function ForwardGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.eGlyph} aria-hidden="true">
      <path {...stroke} d="M14 6l6 6-6 6" />
      <path {...stroke} d="M20 12H9a5 5 0 0 0-5 5v1" />
    </svg>
  )
}

function ReplyGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.eGlyph} aria-hidden="true">
      <path {...stroke} d="M10 6l-6 6 6 6" />
      <path {...stroke} d="M4 12h11a5 5 0 0 1 5 5v1" />
    </svg>
  )
}

function TrashGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.eGlyph} aria-hidden="true">
      <path {...stroke} d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7" />
    </svg>
  )
}

function SendGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.eSendGlyph} aria-hidden="true">
      <path {...stroke} strokeWidth={2.4} d="M12 19V5" />
      <path {...stroke} strokeWidth={2.4} d="m6 11 6-6 6 6" />
    </svg>
  )
}

/** Reply + Forward as they sit in the toolbar; the pressed copy overlays it. */
function ForwardLabel() {
  return (
    <>
      <ForwardGlyph />
      {pocketCopy.email.forward}
    </>
  )
}

/**
 * The email receipt of the §02 headline beat, drawn as a real mail client:
 * window chrome (traffic lights, "Inbox", Delete / Reply / Forward), the
 * message header (sender + address, To, date, bold subject), and the body as
 * the merchant's HTML receipt email (colour band + logo, greeting, item table,
 * total, card line, footer). Pressing Forward slides up a compose sheet —
 * "Fwd: Your Quillbrook Market receipt" — whose To field types out
 * `yourname@papexmail.com`; Send; then the scene flies the whole window into
 * the phone. `still` draws the forwarded state (static version).
 */
export const EmailReceipt = forwardRef<HTMLDivElement, EmailRefs & { className?: string; still?: boolean }>(function EmailReceipt(
  { className, still = false, forwardOnRef, composeRef, addressRef, sendOnRef },
  ref,
) {
  const e = pocketCopy.email
  return (
    <div ref={ref} className={cn(s.flyer, className)}>
      <div className={cn(s.email, still && s.emailStill)}>
        {/* window chrome + Mail's message toolbar */}
        <div className={s.eChrome}>
          <span className={s.eDots} aria-hidden="true">
            <span className={cn(s.eDot, s.eDotR)} />
            <span className={cn(s.eDot, s.eDotY)} />
            <span className={cn(s.eDot, s.eDotG)} />
          </span>
          <span className={s.eBox}>{e.mailbox}</span>
          <span className={s.eTools}>
            <span className={s.eTool} aria-hidden="true">
              <TrashGlyph />
            </span>
            <span className={s.eTool} aria-label={e.reply}>
              <ReplyGlyph />
            </span>
            <span className={s.eFwd}>
              <ForwardLabel />
              <span ref={forwardOnRef} className={s.eFwdOn} aria-hidden="true">
                <ForwardLabel />
              </span>
            </span>
          </span>
        </div>

        {/* the message header */}
        <div className={s.eHead}>
          <span className={s.eAvatar}>Q</span>
          <span className={s.eMeta}>
            <span className={s.eFromRow}>
              <strong className={s.eFrom}>{e.from}</strong>
              <span className={s.eDate}>{e.date}</span>
            </span>
            <span className={s.eAddr}>&lt;{e.fromAddress}&gt;</span>
            <span className={s.eAddr}>
              {e.toLabel}: {e.to}
            </span>
          </span>
        </div>
        <div className={s.eSubject}>{e.subject}</div>

        <div className={s.eBodyWrap}>
          {/* the body: the merchant's HTML receipt email */}
          <div className={s.eCanvas}>
            <div className={s.eMail}>
              <div className={s.eBand}>
                <span className={s.eLogo}>Q</span>
                <span className={s.eBrand}>{e.brand}</span>
              </div>
              <div className={s.eInner}>
                <div className={s.eGreeting}>{e.greeting}</div>
                {e.items.map((item) => (
                  <div key={item.name} className={s.eRow}>
                    <span>{item.name}</span>
                    <span>${money(item.amount)}</span>
                  </div>
                ))}
                <div className={cn(s.eRow, s.eTotal)}>
                  <span>Total</span>
                  <span>${money(e.total)}</span>
                </div>
                <div className={s.eCard}>{pocketCopy.cardLine}</div>
              </div>
              <div className={s.eFoot}>{e.footer}</div>
            </div>
          </div>

          {/* Forward: the compose sheet slides up over the body */}
          <div ref={composeRef} className={s.eCompose}>
            <span className={s.eGrab} aria-hidden="true" />
            <div className={s.eCRow}>
              <span className={s.eCLabel}>{e.toLabel}:</span>
              <span ref={addressRef} className={s.eAddress}>
                {e.address}
              </span>
              <span className={s.eSend}>
                <span ref={sendOnRef} className={s.eSendOn} aria-hidden="true" />
                <SendGlyph />
              </span>
            </div>
            <div className={s.eCRow}>
              <span className={s.eCLabel}>{e.fwdSubjectLabel}:</span>
              <span className={s.eFwdSubject}>{e.fwdSubject}</span>
            </div>
            <div className={s.eQuote}>
              <div className={s.eQuoteHead}>{e.fwdBanner}</div>
              <div>
                {e.fromLabel}: {e.from} &lt;{e.fromAddress}&gt;
              </div>
              <div>
                {e.fwdSubjectLabel}: {e.subject}
              </div>
              <div className={s.eQuoteTotal}>
                <span>Total</span>
                <span>${money(e.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
