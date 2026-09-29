"use client"

import { useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { rn as R } from "@/lib/app-kit/rnStyles"
import { appTheme, headerContentTop, headerTop } from "@/components/app-kit"
import { pt } from "@/components/app-kit/rnStyle"
import s from "../../story.module.css"

/**
 * Shared pieces of the §03 phone (PhoneApp.tsx): the geometry every screen
 * reads, the drag-only scroller, and the real buttons laid over the kit's
 * drawn controls. All units are app points (`--pt` = screen width / 393).
 */

export const PT: CSSProperties = { ["--pt" as string]: "calc(var(--wp-w) / 393)" }

export const GB = R.glassBubble.consts
export const RS = R.receiptsScreen
export const CS = R.couponsScreen
export const DARK = appTheme("dark").colors
export const THEME = appTheme("dark")
/** GlassBubble.tsx `headerBubbleTwoLineHeight()` at fontScale 1. */
export const TWO_LINE = GB.HEADER_BUBBLE_TITLE_LINE_HEIGHT * 2 + GB.BUBBLE_PADDING_VERTICAL * 2

/** Receipts / Stores: where the pinned search field and the list start
 *  (receipts.tsx header + searchRow + HEADER_CONTENT_GAP_BOTTOM). */
export function pinnedSearchGeometry(bubbleH: number = GB.HEADER_BUBBLE_HEIGHT) {
  const S = RS.styles.styles
  const searchTop = headerTop() + bubbleH + S.header.paddingBottom + S.searchRow.paddingTop
  const listTop = searchTop + RS.consts.SEARCH_BAR_HEIGHT + RS.consts.HEADER_CONTENT_GAP_BOTTOM
  return { searchTop, listTop, rowTop: searchTop - S.searchRow.paddingTop }
}

/** Where a pushed screen's content starts (GlassScreenHeader `glassHeaderContentTop`). */
export const PUSHED_TOP = headerContentTop()

/** The system tab bar capsule, as the kit's Chrome.tsx TabBar draws it. */
const TAB = { inset: 21, height: 59, pad: 4 } as const
export const TAB_ORDER = ["home", "receipts", "coupons", "stores", "settings"] as const
export type TabName = (typeof TAB_ORDER)[number]
const TAB_LABEL: Record<TabName, string> = {
  home: "Home",
  receipts: "Receipts",
  coupons: "Coupons",
  stores: "Stores",
  settings: "Settings",
}

/** One tab's box in the capsule, in points. */
function tabBox(index: number): CSSProperties {
  const w = (393 - 2 * TAB.inset - 2 * TAB.pad) / TAB_ORDER.length
  return {
    left: pt(TAB.inset + TAB.pad + index * w),
    width: pt(w),
    bottom: pt(TAB.inset),
    height: pt(TAB.height),
  }
}

/** Scroll room under a tab root's list so its last row clears the floating tab bar. */
export const LIST_FOOT = TAB.inset + TAB.height + 24
/** A pushed screen has no tab bar: just the home indicator's room. */
export const PUSHED_FOOT = 48

/** The five tabs of the kit's TabBar, as real buttons over its drawing. */
export function TabHotspots({ active, onTab }: { active: TabName; onTab: (t: TabName) => void }) {
  return (
    <>
      {TAB_ORDER.map((t, i) => (
        <button
          key={t}
          type="button"
          className={s.hot}
          style={tabBox(i)}
          aria-label={`${TAB_LABEL[t]} tab`}
          aria-current={active === t ? "page" : undefined}
          onClick={() => onTab(t)}
        />
      ))}
    </>
  )
}

/** Over the kit ScreenHeader's back circle (12-68pt x 52-108pt). */
export function Back({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button
      type="button"
      className={s.hot}
      style={{ left: pt(12), top: pt(52), width: pt(56), height: pt(56) }}
      aria-label={label}
      onClick={onBack}
    />
  )
}

/** Rows scrolled up fade out under the pinned header (web stand-in for the
 *  app's scroll-edge effect). */
export function ListFade({ height }: { height: number }) {
  return <span className={s.listFade} style={{ height: pt(height) }} aria-hidden="true" />
}

/** A drawn row / tile as a real button (no box of its own). */
export function Row({ label, onOpen, children, style }: { label: string; onOpen: () => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <button type="button" className={s.rowBtn} aria-label={label} onClick={onOpen} style={style}>
      {children}
    </button>
  )
}

/**
 * Equal-width real buttons laid over a drawn segmented control (the kit's
 * SegmentedControl draws; this makes each segment tappable). The wrapper is
 * the control's own box, so no position is measured or guessed.
 */
export function Segmented({ items, value, onChange, children, label }: { items: readonly string[]; value: string; onChange: (v: string) => void; children: ReactNode; label: string }) {
  return (
    <div style={{ position: "relative" }} role="group" aria-label={label}>
      {children}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {items.map((it) => (
          <button
            key={it}
            type="button"
            className={s.hot}
            style={{ position: "relative", flex: "1 1 0%", height: "100%", borderRadius: pt(20) }}
            aria-label={it}
            aria-pressed={it === value}
            onClick={() => onChange(it)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * A list that scrolls by DRAG only (mouse, pen or finger), never by wheel.
 *
 * Why: this phone sits in a scroll-driven page. A wheel or trackpad over it
 * must keep scrolling the PAGE, or the visitor is trapped in a 400px box. So
 * the box is `overflow: hidden` (which no browser scrolls by wheel; wheel
 * events pass straight to the page) and a pointer drag moves `scrollTop`.
 * A finger drag that runs past either end of the list hands the rest of its
 * movement to the page (window.scrollBy), so even on a touch screen the phone
 * can never hold the page. A drag longer than a few px swallows the click it
 * would otherwise end in, so dragging over a row never opens it.
 *
 * The phone is scaled by the scene's camera, so screen px are divided by the
 * box's on-screen scale (read once per drag) before they move `scrollTop`.
 */
export function DragList({ top, foot = LIST_FOOT, children, label, style }: { top: number; foot?: number; children: ReactNode; label: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; y: number; scale: number; moved: boolean; touch: boolean } | null>(null)
  const swallow = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

  return (
    <div
      ref={ref}
      className={cn(s.dragList, grabbing && s.dragging)}
      // z 0: its own stacking context, so a button inside the list can never
      // sit over the pinned header (10) or the tab bar (20)
      style={{ zIndex: 0, paddingTop: pt(top), paddingBottom: pt(foot), ...style }}
      role="group"
      aria-label={label}
      onPointerDown={(e) => {
        const el = ref.current
        if (!el || (e.pointerType === "mouse" && e.button !== 0)) return
        const scale = el.getBoundingClientRect().height / (el.offsetHeight || 1) || 1
        drag.current = { id: e.pointerId, y: e.clientY, scale, moved: false, touch: e.pointerType === "touch" }
        swallow.current = false
      }}
      onPointerMove={(e) => {
        const d = drag.current
        const el = ref.current
        if (!d || !el || d.id !== e.pointerId) return
        const dy = e.clientY - d.y
        if (!d.moved) {
          if (Math.abs(dy) < 5) return
          d.moved = true
          swallow.current = true
          setGrabbing(true)
          try {
            el.setPointerCapture(e.pointerId)
          } catch {
            // a pointer the browser no longer tracks: the drag still works
          }
        }
        d.y = e.clientY
        const want = el.scrollTop - dy / d.scale
        const max = el.scrollHeight - el.clientHeight
        const next = Math.max(0, Math.min(max, want))
        el.scrollTop = next
        // touch: whatever the list could not take goes to the page
        const rest = (want - next) * d.scale
        if (d.touch && Math.abs(rest) >= 1) window.scrollBy(0, rest)
      }}
      onPointerUp={(e) => {
        if (drag.current?.id === e.pointerId) drag.current = null
        setGrabbing(false)
      }}
      onPointerCancel={() => {
        drag.current = null
        setGrabbing(false)
      }}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (!swallow.current) return
        swallow.current = false
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}
