"use client"

import { cn } from "@/lib/utils"
import { PhoneChrome } from "../../customer/WalkPhone"
import { story } from "../story"
import { DeviceArt } from "./Furniture"
import { FitFrame } from "./merchant/FitFrame"
import { MerchantDemo } from "./merchant/MerchantDemo"
import { ClipScreen, PhoneApp } from "./PhoneKit"
import { useDemoReceipt } from "./receipt"
import { SlipBody } from "./Slip"
import s from "../story.module.css"

/**
 * The story with no motion (the dashboard here is the live, interactive demo
 * straight away): what the server renders, what a no-JS visitor
 * keeps, and what `prefers-reduced-motion` gets instead of the pinned scene.
 * Same three moments, stacked — the paper receipt, the phone with the same
 * receipt on it at the PapeX device (usable: Save to PapeX, the app's
 * Receipts tab, the receipt), and the dashboard it lands on (usable). The
 * heading block and the three columns follow both versions (RetainStory
 * renders them once, after). Every piece of copy the scene
 * carries is here, so nothing is lost for search or assistive tech.
 */
export function StaticStory() {
  const summary = useDemoReceipt()
  const [paper, tap, dash] = story.staticSteps

  return (
    <div className={s.static}>
      <div className={s.staticRow}>
        <figure className={s.staticStep}>
          <div className={s.staticArt}>
            {/* aria-hidden like the scene's stage: the caption tells it */}
            <div className={s.staticSlip} aria-hidden="true">
              <div className={s.sheet}>
                <SlipBody summary={summary} />
              </div>
            </div>
          </div>
          <figcaption className={s.staticCap}>
            <strong>{paper.title}</strong>
            {paper.body}
          </figcaption>
        </figure>

        <figure className={s.staticStep}>
          <div className={cn(s.staticArt, s.staticTap)}>
            <div className={s.staticPhone} role="region" aria-label={story.phoneLabel}>
              <PhoneChrome>
                <div className={cn(s.layer, s.layerClip)} style={{ opacity: 1 }}>
                  <ClipScreen summary={summary} />
                </div>
                <PhoneApp summary={summary} live reset={0} />
              </PhoneChrome>
            </div>
            <div className={s.staticDevice} role="img" aria-label={story.deviceLabel}>
              <DeviceArt className={s.fill} />
            </div>
          </div>
          <figcaption className={s.staticCap}>
            <strong>{tap.title}</strong>
            {tap.body}
          </figcaption>
        </figure>
      </div>

      <figure className={cn(s.staticStep, s.staticDash)}>
        {/* a region, not an image: the dashboard inside is a real, usable UI,
            and role="img" would make its controls presentational */}
        <div className={s.staticLaptop} role="region" aria-label={story.laptopLabel}>
          <div className={s.staticScreen}>
            <FitFrame width={960} height={600} fallback={0.9}>
              <MerchantDemo layout="desktop" />
            </FitFrame>
          </div>
          <div className={s.staticDeck} aria-hidden="true" />
          {/* <=820px: the dashboard's mobile layout on a phone instead of the
              laptop (CSS shows one) */}
          <div className={s.pdStatic}>
            <PhoneChrome>
              <FitFrame width={393} height={852} fallback={0.68}>
                  <MerchantDemo layout="mobile" />
                </FitFrame>
            </PhoneChrome>
          </div>
        </div>
        <figcaption className={s.staticCap}>
          <strong>{dash.title}</strong>
          {dash.body}
        </figcaption>
      </figure>
    </div>
  )
}
