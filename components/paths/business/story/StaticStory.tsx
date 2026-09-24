"use client"

import { cn } from "@/lib/utils"
import { ClipReceiptScreen } from "../../customer/ReceiptCard"
import { PhoneChrome } from "../../customer/WalkPhone"
import { CustomerLine, DashboardColumns, DashboardCopy } from "../DashboardPreview"
import { story } from "../story"
import { Dashboard } from "./Dashboard"
import { DeviceArt } from "./Furniture"
import { useDemoReceipt } from "./receipt"
import { SlipBody } from "./Slip"
import s from "../story.module.css"

/**
 * The story with no motion (the dashboard here is the live, interactive demo
 * straight away): what the server renders, what a no-JS visitor
 * keeps, and what `prefers-reduced-motion` gets instead of the pinned scene.
 * Same three moments, stacked — the paper receipt, the phone with the same
 * receipt on it at the PapeX device, and the dashboard it lands on — then the
 * same dashboard info the scene ends on. Every piece of copy the scene carries
 * is here, so nothing is lost for search or assistive tech.
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
            <div className={s.staticPhone} role="img" aria-label={story.phoneLabel}>
              {/* inert: a picture of the screen; its <summary> must not take focus */}
              <div inert>
                <PhoneChrome>
                  <div className={cn(s.layer, s.layerClip)} style={{ opacity: 1 }}>
                    <ClipReceiptScreen summary={summary} />
                  </div>
                </PhoneChrome>
              </div>
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
        <div className={s.staticLaptop} role="img" aria-label={story.laptopLabel}>
          <div className={s.staticScreen}>
            <Dashboard live />
          </div>
          <div className={s.staticDeck} aria-hidden="true" />
        </div>
        <figcaption className={s.staticCap}>
          <strong>{dash.title}</strong>
          {dash.body}
        </figcaption>
      </figure>

      <div className={s.staticInfo}>
        <DashboardCopy className={s.infoCopy} />
        <DashboardColumns />
        <div className={s.infoCust}>
          <CustomerLine />
          <p className={s.paperNote}>{story.paperNote}</p>
        </div>
      </div>
    </div>
  )
}
