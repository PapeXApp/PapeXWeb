"use client"

import { cn } from "@/lib/utils"
import { receiptMoment } from "../appui/Clip"
import { PhoneChrome } from "../WalkPhone"
import { EmailReceipt, PaperCoupon, PaperReceipt } from "./Paper"
import { pocketCopy } from "./pocketCopy"
import { pocketCoupons, pocketReceipts, useDemoReceipt } from "./pocketData"
import { PocketCouponsScreen, PocketReceiptsScreen } from "./PocketScreens"
import s from "./pocket.module.css"

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className={s.staticArrow} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h15" />
      <path d="m13.5 6.5 5.5 5.5-5.5 5.5" />
    </svg>
  )
}

/**
 * §02 with no motion: what the server renders, what a no-JS visitor keeps,
 * and what `prefers-reduced-motion` gets instead of the pinned scene. The
 * same three moments — the email forwarded to your PapeX address (first and
 * full width: the headline), the paper receipt scanned, the coupon scanned —
 * each with the phone after it lands and captioned with its card's words, so
 * nothing the scene says is lost for search or assistive tech.
 */
export function PocketStatic() {
  const t = pocketCopy
  const summary = useDemoReceipt()
  const moment = receiptMoment(summary.dateline)
  const receipts = pocketReceipts(summary)
  const coupons = pocketCoupons
  const [emailHalf, paperHalf, couponsHalf] = t.halves
  const L = t.staticLabels
  const before = receipts.earlier.filter((r) => !r.reviewed).length

  return (
    <div className={s.static}>
      <span className={cn(s.demoTag, s.staticDemo)}>{t.demoTag}</span>
      <figure className={cn(s.staticFig, s.staticLead)}>
        <div className={s.staticArt}>
          <div className={s.staticPaper} role="img" aria-label={L.email}>
            <EmailReceipt still />
          </div>
          <Arrow />
          <div className={s.staticPhone} role="img" aria-label={L.phoneEmail}>
            {/* inert: a picture of the screen; nothing in it takes focus */}
            <div inert>
              <PhoneChrome>
                <div className={cn(s.layer, s.layerBase)}>
                  <PocketReceiptsScreen
                    emailed={receipts.emailed}
                    scanned={receipts.scanned}
                    earlier={receipts.earlier}
                    unreviewed={before + 1}
                    time={moment.time}
                    landed="email"
                  />
                </div>
              </PhoneChrome>
            </div>
          </div>
        </div>
        <figcaption>
          <strong className={cn(s.staticTitle, s.staticTitleLead)}>{emailHalf.title}</strong>
          <span className={s.staticBody}>{emailHalf.body}</span>
        </figcaption>
      </figure>

      <figure className={s.staticFig}>
        <div className={s.staticArt}>
          <div className={s.staticPaper} role="img" aria-label={L.paperReceipt}>
            <PaperReceipt summary={summary} still />
          </div>
          <Arrow />
          <div className={s.staticPhone} role="img" aria-label={L.phoneReceipt}>
            <div inert>
              <PhoneChrome>
                <div className={cn(s.layer, s.layerBase)}>
                  <PocketReceiptsScreen
                    emailed={receipts.emailed}
                    scanned={receipts.scanned}
                    earlier={receipts.earlier}
                    unreviewed={before + 2}
                    time={moment.time}
                    landed="both"
                  />
                </div>
              </PhoneChrome>
            </div>
          </div>
        </div>
        <figcaption>
          <strong className={s.staticTitle}>{paperHalf.title}</strong>
          <span className={s.staticBody}>{paperHalf.body}</span>
        </figcaption>
      </figure>

      <figure className={s.staticFig}>
        <div className={s.staticArt}>
          <div className={s.staticPaper} role="img" aria-label={L.paperCoupon}>
            <PaperCoupon still />
          </div>
          <Arrow />
          <div className={s.staticPhone} role="img" aria-label={L.phoneCoupon}>
            <div inert>
              <PhoneChrome>
                <div className={cn(s.layer, s.layerBase)}>
                  <PocketCouponsScreen scanned={coupons.scanned} earlier={coupons.earlier} time={moment.time} landed />
                </div>
              </PhoneChrome>
            </div>
          </div>
        </div>
        <figcaption>
          <strong className={s.staticTitle}>{couponsHalf.title}</strong>
          <span className={s.staticBody}>{couponsHalf.body}</span>
        </figcaption>
      </figure>
    </div>
  )
}
