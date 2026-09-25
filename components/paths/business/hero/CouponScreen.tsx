import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { AppKitRoot, CouponDetail, StatusBar, demoCoupons, demoStore, type KitCoupon } from "@/components/app-kit"
import { CheckGlyph } from "./SceneArt"
import { loop } from "./loop"
import s from "./hero.module.css"

/**
 * Beats 3 and 4 of the hero loop, on the phone: the coupon the customer was
 * just sent, as the PapeX app shows it — the app kit's own CouponDetail
 * (components/app-kit, synced from PapeXV2 app/couponDetail.tsx), imported,
 * not forked. It is the site's one partner-tap coupon (sampleData `c1`,
 * Tidewick Cafe, "$2 off your next visit", expires in 30 days) plus a demo
 * barcode, so the counter has something to scan.
 *
 * Hero-only layers on top, all transform/opacity, driven by `state`:
 *   "landed"  a one-shot orange glow round the coupon card as it arrives
 *   "scan"    an orange scan line sweeps the barcode once (beat 4)
 *   "used"    a "Coupon used" stamp over the barcode (beat 4, and the still)
 *
 * Positions are app points (the kit's --pt), measured from the kit's own
 * layout of this coupon (card, stub) — see CARD / STUB below.
 */

export type CouponState = "pending" | "landed" | "shown" | "scan" | "used"

const TAP = demoCoupons.find((c) => c.via === "tap") ?? demoCoupons[0]
const COUPON: KitCoupon = { ...TAP, barcode: loop.coupon.barcode }
const STORE = demoStore(COUPON.storeId)

/** One app point = the phone screen's width / 393 (same as story/PhoneApp). */
const PT: CSSProperties = { ["--pt" as string]: "calc(var(--wp-w) / 393)" }

/** The coupon card and its barcode stub, in app points: measured from the
 *  kit's layout of THIS coupon (offsetLeft/Top in the 393pt screen, P3-B6).
 *  If the kit's CouponDetail changes, re-measure. */
const CARD = { left: 15.6, top: 113, width: 360, height: 292, radius: 22 }
const STUB = { left: 34.8, top: 281.7, width: 316.5, height: 99.1, radius: 12 }

const box = (b: typeof CARD): CSSProperties => ({
  left: `calc(${b.left} * var(--pt))`,
  top: `calc(${b.top} * var(--pt))`,
  width: `calc(${b.width} * var(--pt))`,
  height: `calc(${b.height} * var(--pt))`,
  borderRadius: `calc(${b.radius} * var(--pt))`,
})

export function CouponScreen({ state, time }: { state: CouponState; time?: string }) {
  return (
    <AppKitRoot style={PT} className={s.kitFill}>
      <CouponDetail coupon={COUPON} store={STORE} mode="dark" statusBar={false} showRemove={false} />
      <StatusBar time={time} />
      <span className={cn(s.cardGlow, state === "landed" && s.cardGlowPlay)} style={box(CARD)} aria-hidden="true" />
      <span className={s.stubBox} style={box(STUB)} aria-hidden="true">
        {state === "scan" ? <span className={s.scanLine} /> : null}
        <span className={cn(s.stamp, state === "used" && s.stampOn)}>
          <CheckGlyph className={s.stampGlyph} />
          {loop.applied}
        </span>
      </span>
    </AppKitRoot>
  )
}
