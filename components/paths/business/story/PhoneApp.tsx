"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { rn as R } from "@/lib/app-kit/rnStyles"
import {
  AppKitRoot,
  CouponDetail,
  CouponRow,
  Fab,
  HeaderCircle,
  ReceiptDetail,
  ReceiptRow,
  Screen,
  SearchField,
  SelectCapsule,
  StatusBar,
  T,
  TabBar,
  TabTitleRow,
  TitleBubble,
  V,
  GlassIcon,
  demoCoupons,
  demoReceipts,
  demoStore,
  demoStores,
  appTheme,
  headerTop,
  type KitCoupon,
  type KitReceipt,
} from "@/components/app-kit"
import { pt, rn } from "@/components/app-kit/rnStyle"
import { PAYMENT_METHOD_STYLES, detectPaymentMethod, extractLastFour, type ReceiptSummary } from "@/lib/receiptSummary"
import s from "../story.module.css"

/**
 * The customer's phone once the §03 story has settled (P3-B5, Nico: "I want
 * to be able to interact with the phone as well"). A small, real-looking
 * PapeX app on top of the App Clip receipt:
 *
 *   App Clip receipt --"Save to PapeX"--> Receipts tab
 *   Receipts tab     rows open the receipt detail (back returns); the list
 *                    scrolls by DRAG (see DragList)
 *   tab bar          Receipts <-> Coupons
 *   Coupons tab      rows open the coupon detail (back returns)
 *
 * Every screen is the code-sourced app kit (components/app-kit, synced from
 * PapeXV2): the two tab roots are composed here from the kit's own parts in
 * the order the kit's ReceiptsScreen / CouponsScreen compose them, only so
 * each row can be a real button and the list a real scroller; the details
 * are the kit's ReceiptDetail / CouponDetail as they are. Layout per
 * docs/design/app-reference.md: the tab bar + FAB only on the tab roots (FAB
 * on Receipts, not Coupons), pushed screens cover both.
 *
 * All units are app points: `--pt` = the phone screen's width / 393.
 */

const PT: CSSProperties = { ["--pt" as string]: "calc(var(--wp-w) / 393)" }

const titleCase = (t: string) => t.toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase())

function paymentLabel(summary: ReceiptSummary): string | undefined {
  const net = summary.paymentLine ? detectPaymentMethod(summary.paymentLine) : null
  const last = summary.paymentLine ? extractLastFour(summary.paymentLine) : null
  if (!net) return undefined
  const label = titleCase(PAYMENT_METHOD_STYLES[net]?.label ?? net)
  return last ? `${label} •••• ${last}` : label
}

/**
 * The story's receipt (just saved from the App Clip) on top, then the kit's
 * other invented receipts re-dated to sit before it — twice over, a week
 * apart, so the list is long enough to scroll like a real one.
 */
export function kitReceipts(summary: ReceiptSummary): KitReceipt[] {
  const mine: KitReceipt = {
    id: "story-receipt",
    merchantName: titleCase(summary.merchantName ?? "Tidewick Cafe"),
    logoUrl: demoStores[0].logoUrl ?? null,
    amount: summary.total ?? null,
    dateLabel: "Jun 8",
    category: "Dining",
    source: "rdh",
    originDetail: "Tapped by you",
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: false,
    reviewed: false,
    section: "Today",
    address: summary.addressLines.slice(0, 2).join(", "),
    dateTime: (summary.dateline ?? "").replace(" • ", " · "),
    items: summary.items.map((i) => ({ name: i.name, quantity: i.qty, price: i.amount })),
    subtotal: summary.subtotal,
    tax: summary.tax,
    payment: paymentLabel(summary),
    sharedWith: [],
  }
  const others = demoReceipts.slice(1)
  // two receipts per day, so each re-dated set spans two days
  const dated = (days: { label: string; section: string }[], suffix: string) =>
    others.map((r, i) => {
      const d = days[Math.min(days.length - 1, Math.floor(i / 2))]
      return {
        ...r,
        id: `${r.id}${suffix}`,
        dateLabel: d.label,
        section: d.section,
        dateTime: r.dateTime?.replace(/^[A-Z][a-z]{2} \d+/, d.label),
      }
    })
  return [
    mine,
    ...dated(
      [
        { label: "Jun 7", section: "Yesterday" },
        { label: "Jun 6", section: "June 6, 2026" },
      ],
      "",
    ),
    ...dated(
      [
        { label: "Jun 1", section: "June 1, 2026" },
        { label: "May 30", section: "May 30, 2026" },
      ],
      "-w",
    ),
  ]
}

// ---------------------------------------------------------------------------
// Geometry, from the kit's own sources (see ReceiptsScreen / CouponsScreen).
const GB = R.glassBubble.consts
const RS = R.receiptsScreen
const CS = R.couponsScreen
const DARK = appTheme("dark").colors
const TWO_LINE = GB.HEADER_BUBBLE_TITLE_LINE_HEIGHT * 2 + GB.BUBBLE_PADDING_VERTICAL * 2
/** The system tab bar capsule, as Chrome.tsx TabBar draws it (measured there). */
const TAB = { inset: 21, height: 59, pad: 4, count: 5 } as const
/** Where the tab bar's receipts (1) / coupons (2) tabs sit, in points. */
function tabBox(index: number): CSSProperties {
  const w = (393 - 2 * TAB.inset - 2 * TAB.pad) / TAB.count
  return {
    left: pt(TAB.inset + TAB.pad + index * w),
    width: pt(w),
    bottom: pt(TAB.inset),
    height: pt(TAB.height),
  }
}
/** Scroll room under the list so its last row clears the floating tab bar. */
const LIST_FOOT = TAB.inset + TAB.height + 24

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
function DragList({ top, children, label }: { top: number; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; y: number; scale: number; moved: boolean; touch: boolean } | null>(null)
  const swallow = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

  return (
    <div
      ref={ref}
      className={cn(s.dragList, grabbing && s.dragging)}
      style={{ paddingTop: pt(top), paddingBottom: pt(LIST_FOOT) }}
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

function Row({ label, onOpen, children }: { label: string; onOpen: () => void; children: ReactNode }) {
  return (
    <button type="button" className={s.rowBtn} aria-label={label} onClick={onOpen}>
      {children}
    </button>
  )
}

/** Receipts / Coupons in the kit's tab bar, as real buttons over its drawing. */
function Tabs({ active, onTab }: { active: "receipts" | "coupons"; onTab: (t: "receipts" | "coupons") => void }) {
  return (
    <>
      <button
        type="button"
        className={s.hot}
        style={tabBox(1)}
        aria-label="Receipts tab"
        aria-current={active === "receipts" ? "page" : undefined}
        onClick={() => onTab("receipts")}
      />
      <button
        type="button"
        className={s.hot}
        style={tabBox(2)}
        aria-label="Coupons tab"
        aria-current={active === "coupons" ? "page" : undefined}
        onClick={() => onTab("coupons")}
      />
    </>
  )
}

function Back({ onBack, label }: { onBack: () => void; label: string }) {
  // over the kit ScreenHeader's back circle (measured, 12-68pt x 52-108pt)
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

function ReceiptsTab({ receipts, onOpen, onTab }: { receipts: KitReceipt[]; onOpen: (id: string) => void; onTab: (t: "receipts" | "coupons") => void }) {
  const S = RS.styles.styles
  const unreviewed = receipts.filter((r) => !r.reviewed).length
  const bubbleH = unreviewed > 0 ? TWO_LINE : GB.HEADER_BUBBLE_HEIGHT
  const searchTop = headerTop() + bubbleH + S.header.paddingBottom + S.searchRow.paddingTop
  const listTop = searchTop + RS.consts.SEARCH_BAR_HEIGHT + RS.consts.HEADER_CONTENT_GAP_BOTTOM
  const sections: [string, KitReceipt[]][] = []
  for (const r of receipts) {
    const last = sections[sections.length - 1]
    if (last && last[0] === r.section) last[1].push(r)
    else sections.push([r.section, [r]])
  }
  return (
    <Screen mode="dark">
      <DragList top={listTop} label="Your receipts">
        {sections.map(([title, rows]) => (
          <V key={title}>
            <T style={rn(S.sectionHeader, { color: DARK.textSecondary })}>{title}</T>
            {rows.map((r) => (
              <Row key={r.id} label={`Open the ${r.merchantName} receipt${r.amount != null ? `, $${r.amount.toFixed(2)}` : ""}`} onOpen={() => onOpen(r.id)}>
                <ReceiptRow receipt={r} mode="dark" />
              </Row>
            ))}
          </V>
        ))}
      </DragList>
      <span className={s.listFade} style={{ height: pt(listTop - 6) }} aria-hidden="true" />
      <TabTitleRow
        left={<SelectCapsule />}
        title={
          <TitleBubble
            title="Receipts"
            meta={
              unreviewed > 0 ? (
                <V style={rn(S.headerMeta, { flexDirection: "row" })}>
                  <T style={rn(S.uncheckedCount, { color: DARK.attention, opacity: 0.6 })}>{unreviewed}</T>
                  <T style={rn(S.uncheckedLabel, { color: DARK.attention, opacity: 0.6 })}>unreviewed</T>
                </V>
              ) : undefined
            }
          />
        }
        right={<HeaderCircle glyph="filter" />}
      />
      <V style={{ ...rn(S.searchRow, { flexDirection: "row" }), position: "absolute", left: 0, right: 0, top: pt(searchTop - S.searchRow.paddingTop), zIndex: 10 }}>
        <SearchField placeholder="Search receipts..." style={{ flex: "1 1 0%" }} />
      </V>
      <Fab />
      <TabBar active="receipts" />
      <StatusBar />
      <Tabs active="receipts" onTab={onTab} />
    </Screen>
  )
}

function CouponsTab({ coupons, onOpen, onTab }: { coupons: KitCoupon[]; onOpen: (id: string) => void; onTab: (t: "receipts" | "coupons") => void }) {
  const S = CS.styles.styles
  const controlsTop = headerTop() + GB.HEADER_BUBBLE_HEIGHT + S.titleRow.paddingBottom
  const listTop = controlsTop + CS.consts.CONTROLS_ROW_HEIGHT
  return (
    <Screen mode="dark">
      <DragList top={listTop} label="Your coupons">
        <V style={{ paddingLeft: pt(16), paddingRight: pt(16), gap: pt(R.couponRow.consts.COUPON_ROW_GAP) }}>
          {coupons.map((c) => {
            const store = demoStore(c.storeId)
            return (
              <Row key={c.id} label={`Open the ${store.name} coupon: ${c.title}`} onOpen={() => onOpen(c.id)}>
                <CouponRow coupon={c} store={store} mode="dark" />
              </Row>
            )
          })}
        </V>
      </DragList>
      <span className={s.listFade} style={{ height: pt(listTop - 6) }} aria-hidden="true" />
      <TabTitleRow
        left={<SelectCapsule />}
        title={<TitleBubble title="Coupons" />}
        right={
          <>
            <HeaderCircle>
              <GlassIcon name="heart" size={CS.consts.HEADER_GLASS_ICON} mode="dark" />
            </HeaderCircle>
            <HeaderCircle>
              <GlassIcon name="bell" size={CS.consts.HEADER_GLASS_ICON} mode="dark" />
            </HeaderCircle>
          </>
        }
      />
      <V style={{ ...rn(S.controlsRow), position: "absolute", left: 0, right: 0, top: pt(controlsTop), flexDirection: "row", gap: pt(8), zIndex: 9 }}>
        <SearchField placeholder="Search" style={{ flex: "1 1 0%" }} />
        <HeaderCircle glyph="filter" />
      </V>
      <TabBar active="coupons" />
      <StatusBar />
      <Tabs active="coupons" onTab={onTab} />
    </Screen>
  )
}

type Tab = "receipts" | "coupons"
type Open = { kind: "receipt" | "coupon"; id: string } | null

/**
 * The tap-through, layered over the clip receipt. Nothing is rendered or
 * focusable until `live` (the story has settled) except what the visitor
 * already opened; `reset` changing sends it back to the clip receipt.
 */
export function PhoneApp({ summary, live, reset }: { summary: ReceiptSummary; live: boolean; reset: number }) {
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<Tab>("receipts")
  const [open, setOpen] = useState<Open>(null)
  // bumped on every tab / screen change, so each new list starts at its top
  const [view, setView] = useState(0)
  useEffect(() => {
    setSaved(false)
    setTab("receipts")
    setOpen(null)
  }, [reset])

  const receipts = kitReceipts(summary)
  const go = (next: () => void) => {
    next()
    setView((n) => n + 1)
  }
  const openReceipt = open?.kind === "receipt" ? receipts.find((r) => r.id === open.id) : undefined
  const openCoupon = open?.kind === "coupon" ? demoCoupons.find((c) => c.id === open.id) : undefined

  let screen: ReactNode = null
  if (saved) {
    if (openReceipt)
      screen = (
        <>
          <ReceiptDetail receipt={openReceipt} mode="dark" />
          {live ? <Back label="Back to receipts" onBack={() => go(() => setOpen(null))} /> : null}
        </>
      )
    else if (openCoupon)
      screen = (
        <>
          <CouponDetail coupon={openCoupon} store={demoStore(openCoupon.storeId)} mode="dark" />
          {live ? <Back label="Back to coupons" onBack={() => go(() => setOpen(null))} /> : null}
        </>
      )
    else if (tab === "receipts")
      screen = (
        <ReceiptsTab
          receipts={receipts}
          onOpen={(id) => go(() => setOpen({ kind: "receipt", id }))}
          onTab={(t) => go(() => setTab(t))}
        />
      )
    else
      screen = (
        <CouponsTab
          coupons={demoCoupons}
          onOpen={(id) => go(() => setOpen({ kind: "coupon", id }))}
          onTab={(t) => go(() => setTab(t))}
        />
      )
  }

  return (
    <>
      {screen ? (
        <AppKitRoot
          key={view}
          style={PT}
          className={cn(s.layer, s.layerOn, s.kitFill, s.appScreen, open ? s.appPush : s.appSwap)}
        >
          {/* not interactive until the story rests: no focus, no clicks */}
          <div className={s.kitFill} inert={!live}>
            {screen}
          </div>
        </AppKitRoot>
      ) : null}
      {live && !saved ? (
        <div className={s.hotspots} style={PT}>
          <button
            type="button"
            className={s.hot}
            style={{ left: pt(12), right: pt(12), bottom: pt(40), height: pt(112) }}
            onClick={() => go(() => setSaved(true))}
          >
            <span className="sr-only">Save to PapeX</span>
          </button>
        </div>
      ) : null}
    </>
  )
}
