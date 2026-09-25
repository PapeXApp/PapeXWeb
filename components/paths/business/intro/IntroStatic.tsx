"use client"

import { cn } from "@/lib/utils"
import { ClipReceiptScreen } from "../../customer/ReceiptCard"
import { PhoneChrome } from "../../customer/WalkPhone"
import { tapToRetain } from "../content"
import { useDemoReceipt } from "../story/receipt"
import { CouponsScreen } from "./CouponsScreen"
import { PaperCoupon, PaperReceipt } from "./Paper"
import { receiptMoment } from "../../customer/appui/Clip"
import s from "./intro.module.css"

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
 * and what `prefers-reduced-motion` gets instead of the pinned scene. The same
 * two moments side by side — paper receipt -> the App Clip receipt, paper
 * coupon -> the coupon in the app — each captioned with its card's words, so
 * nothing the scene says is lost for search or assistive tech.
 */
export function IntroStatic() {
  const t = tapToRetain
  const summary = useDemoReceipt()
  const moment = receiptMoment(summary.dateline)
  const [receipts, coupons] = t.halves
  const L = t.staticLabels

  return (
    <div className={s.static}>
      <span className={cn(s.demoTag, s.staticDemo)}>{t.demoTag}</span>
      <figure className={s.staticFig}>
        <div className={s.staticArt}>
          <div className={s.staticPaper} role="img" aria-label={L.paperReceipt}>
            <PaperReceipt summary={summary} />
          </div>
          <Arrow />
          <div className={s.staticPhone} role="img" aria-label={L.phoneReceipt}>
            {/* inert: a picture of the screen; its controls must not take focus */}
            <div inert>
              <PhoneChrome>
                <div className={cn(s.layer, s.layerClip)} style={{ opacity: 1 }}>
                  <ClipReceiptScreen summary={summary} />
                </div>
              </PhoneChrome>
            </div>
          </div>
        </div>
        <figcaption>
          <strong className="block text-[length:clamp(20px,1.9vw,24px)] font-bold leading-[1.15] [font-family:var(--font-display)]">
            {receipts.title}
          </strong>
          <span className="mt-2 block text-[16px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {receipts.body}
          </span>
        </figcaption>
      </figure>

      <figure className={s.staticFig}>
        <div className={s.staticArt}>
          <div className={s.staticPaper} role="img" aria-label={L.paperCoupon}>
            <PaperCoupon merchant={summary.merchantName} />
          </div>
          <Arrow />
          <div className={s.staticPhone} role="img" aria-label={L.phoneCoupon}>
            <div inert>
              <PhoneChrome>
                <div className={s.layer} style={{ opacity: 1 }}>
                  <CouponsScreen time={moment.time} />
                </div>
              </PhoneChrome>
            </div>
          </div>
        </div>
        <figcaption>
          <strong className="block text-[length:clamp(20px,1.9vw,24px)] font-bold leading-[1.15] [font-family:var(--font-display)]">
            {coupons.title}
          </strong>
          <span className="mt-2 block text-[16px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {coupons.body}
          </span>
        </figcaption>
      </figure>
    </div>
  )
}
