import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { Chevron, StatusBar, TabBar } from "../../customer/appui"
import a from "../../customer/appui/appui.module.css"
import { tapToRetain } from "../content"
import s from "./intro.module.css"

/**
 * The PapeX app's Coupons tab with ONE coupon in it: the demo "$2 off your
 * next visit" from Tidewick Cafe that the paper coupon turns into.
 *
 * Layout per docs/design/app-reference.md "Coupons (app/(tabs)/coupons.tsx)":
 *   1. title row — Select capsule, "Coupons" bubble, glass heart + bell
 *   2. controls row — search field ("Search") + filter circle
 *   3. (PromoCarousel — renders nothing with zero paid slots,
 *      PapeXV2 components/coupons/PromoCarousel.tsx `if (count === 0) return null`)
 *   4. the shopper's own coupon rows (earned or scanned only)
 *   5. tab bar, Coupons selected, NO FAB
 *
 * The row follows PapeXV2 components/coupons/CouponRow.tsx +
 * CouponStoreThumb.tsx: receipt-row height (91.2pt), a full-bleed 76pt brand
 * stub with the store's monogram as a 52pt seal, notches + perforation at the
 * seam, store name (Barlow-Medium 17) with a neutral kind Tag, the offer
 * (Regular 15), the expiry (Medium 12, textSecondary when not urgent), then
 * the heart + left-pointing chevron in two 28pt slots.
 *
 * Sized by appui's `--u` (one iPhone point), which PhoneChrome's frame sets.
 * `rowRef` is the row the scene aims the paper coupon at.
 */

/** Tidewick Cafe's brand field — the same gradient appui/data.ts gives its logo. */
const TIDEWICK_FIELD = "linear-gradient(160deg,#9a5a2c,#5a2f14)"

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function HeartGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...line} d="M12 19.6s-7.2-4.4-7.2-9.6A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.2 2.4c0 5.2-7.2 9.6-7.2 9.6Z" />
    </svg>
  )
}

function BellGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...line} d="M6.4 16.4V11a5.6 5.6 0 0 1 11.2 0v5.4l1.6 1.6H4.8Z" />
      <path {...line} d="M10.2 20.2a2 2 0 0 0 3.6 0" />
    </svg>
  )
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={a.searchIcon} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="10.6" cy="10.6" r="6.4" />
      <path d="m15.4 15.4 4.2 4.2" />
    </svg>
  )
}

function FilterGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={a.circleGlyph} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 7.2h16M4 12h16M4 16.8h16" />
      <circle cx="9" cy="7.2" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16.8" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TagGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.kindGlyph} aria-hidden="true">
      <path {...line} d="M3.8 12.6V4.8a1 1 0 0 1 1-1h7.8l7.6 7.6a1.4 1.4 0 0 1 0 2l-6.8 6.8a1.4 1.4 0 0 1-2 0Z" />
      <circle cx="8.4" cy="8.4" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function CouponRow({ rowRef }: { rowRef?: React.Ref<HTMLDivElement> }) {
  const c = tapToRetain.appCoupon
  return (
    <div ref={rowRef} className={s.cRow}>
      <span className={s.stub} style={{ background: TIDEWICK_FIELD }}>
        <span className={s.seal}>T</span>
      </span>
      <span className={s.perf} />
      <span className={s.cBody}>
        <span className={s.cIdentity}>
          <span className={s.cStore}>Tidewick Cafe</span>
          <span className={s.kind}>
            <TagGlyph />
            {c.kind}
          </span>
        </span>
        <span className={s.cTitle}>{c.title}</span>
        <span className={s.cDetail}>{c.expiry}</span>
      </span>
      <span className={s.trail}>
        <span className={s.trailSlot}>
          <HeartGlyph className={s.trailHeart} />
        </span>
        <span className={s.trailSlot}>
          <Chevron back />
        </span>
      </span>
    </div>
  )
}

export const CouponsScreen = forwardRef<
  HTMLDivElement,
  { time?: string; rowRef?: React.Ref<HTMLDivElement>; rowWrapRef?: React.Ref<HTMLDivElement> }
>(function CouponsScreen({ time, rowRef, rowWrapRef }, ref) {
  return (
    <div ref={ref} className={cn(a.screen, a.titleOneLine)}>
      <div className={a.ground} aria-hidden="true" />
      <StatusBar time={time} />

      <div className={a.listScroll}>
        <div ref={rowWrapRef} className={s.rowWrap}>
          <CouponRow rowRef={rowRef} />
        </div>
      </div>

      <div className={a.headerRow}>
        <span className={a.headerSide}>
          <span className={a.selectPill} aria-hidden="true">
            Select
          </span>
        </span>
        <div className={a.headerPill}>
          <span className={a.headerTitle}>Coupons</span>
        </div>
        <span className={cn(a.headerSide, a.headerSideEnd, s.headerPair)}>
          <span className={a.circleBtn} aria-hidden="true">
            <HeartGlyph className={a.circleGlyph} />
          </span>
          <span className={a.circleBtn} aria-hidden="true">
            <BellGlyph className={a.circleGlyph} />
          </span>
        </span>
      </div>

      <div className={cn(a.searchRow, s.controls)}>
        <div className={cn(a.search, s.controlsSearch)}>
          <SearchGlyph />
          <span className={a.searchText}>Search</span>
        </div>
        <span className={a.circleBtn} aria-hidden="true">
          <FilterGlyph />
        </span>
      </div>

      <TabBar active="coupons" />
    </div>
  )
})
