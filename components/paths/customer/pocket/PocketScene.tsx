"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { receiptMoment } from "../appui/Clip"
import { PhoneChrome } from "../WalkPhone"
import { PaperCoupon, PaperReceipt } from "./Paper"
import { pocketCopy, type PocketHalf } from "./pocketCopy"
import { pocketCoupons, pocketReceipts, useDemoReceipt } from "./pocketData"
import { PocketCouponsScreen, PocketReceiptsScreen } from "./PocketScreens"
import { PocketStatic } from "./PocketStatic"
import s from "./pocket.module.css"

/**
 * /customers §02 "Every receipt, in your pocket." — the customer twin of
 * /business §02 (business/intro/IntroScene.tsx, whose pattern this copies).
 * The customer's action is SCANNING, so each half is: paper grows -> the
 * scanner locks on and reads it -> it shrinks into the phone and becomes the
 * new row in the app.
 *
 * A tall runway, a `position: sticky` 100svh pin, ONE progress `p` (0..1 over
 * the runway's scroll), and every frame a pure function of `p` — scrolling up
 * plays it backwards, any `p` always draws the same picture, no timers, no
 * loops.
 *
 *   0.02-0.14  RECEIPT  the demo Tidewick Cafe receipt grows beside the phone
 *                       (the phone shows the Receipts tab, list whole)
 *   0.13-0.17           orange scan brackets close in on the paper
 *   0.165-0.25          the scan line sweeps top to bottom
 *   0.25-0.28           capture: the brackets squeeze once
 *   0.29-0.40           the paper shrinks into the phone, onto the top of the
 *                       list, and squashes into the row as the list slides
 *                       down to make room; the new row (Today, "Scanned by
 *                       you", unreviewed) fades in; "1 -> 2 unreviewed"
 *   0.42-0.47           hold
 *   0.47-0.52  COUPON   the phone crossfades to the Coupons tab
 *   0.50-0.62           a paper coupon (Copperpeg Hardware, "$5 OFF",
 *                       stamped Demo) grows
 *   0.61-0.76           the same scan: brackets, sweep, capture
 *   0.77-0.88           it flies onto the top coupon slot and squashes into
 *                       it as the list slides down; the coupon fades in
 *   0.90-1.00           hold on the coupon in the app
 *
 * On phones (<=820px) the paper grows IN FRONT of the (dimmed) phone, which
 * stays whole and large; on desktop it grows beside it.
 *
 * The section heading (`header`) is placed twice and CSS shows one: at the
 * top of the pin on desktop screens tall enough (>= 821 x 680), in flow above
 * everywhere else.
 *
 * The caption cards highlight in sync and are buttons that scroll to their
 * half's "paper being scanned" point.
 *
 * Perf contract: the frame writes only `transform` and `opacity`, through a
 * cache that drops unchanged values, and reads nothing from layout — every
 * geometric number comes from `measure()`, run on mount, resize,
 * ResizeObserver and fonts.ready.
 */

/** Scroll budget for the scene, in viewport heights. */
const SCROLL_VH = 240
/** The runway: the pinned viewport plus the scene's scroll. */
const RUNWAY_VH = 100 + SCROLL_VH

/** One half's clock. The coupon half is the receipt half shifted by 0.48. */
type Beat = {
  growA: number
  growB: number
  brkA: number
  brkB: number
  beamA: number
  beamB: number
  snapA: number
  snapB: number
  brkOutA: number
  brkOutB: number
  moveA: number
  moveB: number
  fadeA: number
  fadeB: number
  rowA: number
  rowB: number
}
const R_BEAT: Beat = {
  growA: 0.02,
  growB: 0.14,
  brkA: 0.13,
  brkB: 0.17,
  beamA: 0.165,
  beamB: 0.25,
  snapA: 0.25,
  snapB: 0.28,
  brkOutA: 0.28,
  brkOutB: 0.305,
  moveA: 0.29,
  moveB: 0.4,
  fadeA: 0.365,
  fadeB: 0.405,
  rowA: 0.355,
  rowB: 0.42,
}
const shift = (b: Beat, d: number): Beat =>
  Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v + d])) as Beat
const C_BEAT = shift(R_BEAT, 0.48)

const T = {
  split: 0.475,
  tabA: 0.47,
  tabB: 0.52,
} as const

/** Where a caption card's click lands: that half's paper, mid-scan. */
const JUMP: Record<PocketHalf, number> = { receipts: 0.21, coupons: 0.69 }

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const ease = (t: number) => t * t * (3 - 2 * t)
/** 0 -> 1 -> 0 across [a, c], peaking at b. */
const bump = (p: number, a: number, b: number, c: number) => (p <= b ? seg(p, a, b) : 1 - seg(p, b, c))

/** Offset of `el` inside `root`, from layout boxes (transforms don't count). */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== root) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

type Flight = { dx: number; dy: number; sx: number; sy: number; lift: number }

export function PocketScene({ header }: { header: ReactNode }) {
  // "ssr": the server render and first client frame carry BOTH versions and
  // CSS shows one (the runway unless prefers-reduced-motion, then the static
  // composition), so the section is its final height from the first paint.
  const [mode, setMode] = useState<"ssr" | "scene" | "static">("ssr")
  const pinned = mode === "scene"
  const [half, setHalf] = useState<PocketHalf>("receipts")
  const [scannedIn, setScannedIn] = useState(false)
  const summary = useDemoReceipt()
  const moment = receiptMoment(summary.dateline)
  const receipts = pocketReceipts(summary)
  const coupons = pocketCoupons
  const unreviewedBefore = receipts.earlier.filter((r) => !r.reviewed).length
  const t = pocketCopy

  const runwayRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLSpanElement>(null)
  const couponsLayerRef = useRef<HTMLDivElement>(null)
  // receipt half
  const paperRRef = useRef<HTMLDivElement>(null)
  const marksRRef = useRef<HTMLSpanElement>(null)
  const beamRRef = useRef<HTMLSpanElement>(null)
  const newRRef = useRef<HTMLDivElement>(null)
  const restRRef = useRef<HTMLDivElement>(null)
  const slotRRef = useRef<HTMLDivElement>(null)
  // coupon half
  const paperCRef = useRef<HTMLDivElement>(null)
  const marksCRef = useRef<HTMLSpanElement>(null)
  const beamCRef = useRef<HTMLSpanElement>(null)
  const newCRef = useRef<HTMLDivElement>(null)
  const restCRef = useRef<HTMLDivElement>(null)
  const slotCRef = useRef<HTMLDivElement>(null)
  // where the runway sits, for the cards' jump (written by measure())
  const geo = useRef({ runTop: 0, runTotal: 0 })

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setMode(mq.matches ? "static" : "scene")
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    if (!pinned) return
    const scene = sceneRef.current
    const pin = pinRef.current
    if (!scene || !pin) return

    /** Everything the frame needs, in px. Rebuilt by measure() only. */
    const M = {
      runTop: 0,
      runTotal: 0,
      dim: 0,
      arc: 0,
      r: { dx: 0, dy: 0, sx: 0.5, sy: 0.2, lift: 0 } as Flight,
      c: { dx: 0, dy: 0, sx: 0.5, sy: 0.2, lift: 0 } as Flight,
    }

    /** Paper home centre -> the slot's centre, and the landing scales. */
    const flight = (paper: HTMLElement | null, slot: HTMLElement | null, block: HTMLElement | null, rest: HTMLElement | null): Flight | null => {
      if (!paper || !slot || !block || !rest) return null
      const pp = offsetIn(paper, scene)
      const sl = offsetIn(slot, scene)
      // the list's lift = the new block's footprint (its height + the gap
      // after it), read as the distance between the two boxes' tops
      const lift = offsetIn(rest, scene).y - offsetIn(block, scene).y
      return {
        dx: sl.x + sl.w / 2 - (pp.x + pp.w / 2),
        dy: sl.y + sl.h / 2 - (pp.y + pp.h / 2),
        sx: sl.w / pp.w,
        sy: sl.h / pp.h,
        lift,
      }
    }

    const measure = () => {
      const runway = runwayRef.current
      if (runway) {
        M.runTop = runway.getBoundingClientRect().top + window.scrollY
        M.runTotal = Math.max(0, runway.offsetHeight - window.innerHeight)
        geo.current = { runTop: M.runTop, runTotal: M.runTotal }
      }
      const dim = parseFloat(getComputedStyle(scene).getPropertyValue("--dim"))
      M.dim = Number.isFinite(dim) ? dim : 0
      const r = flight(paperRRef.current, slotRRef.current, newRRef.current, restRRef.current)
      const c = flight(paperCRef.current, slotCRef.current, newCRef.current, restCRef.current)
      if (r) M.r = r
      if (c) M.c = c
      const phone = phoneRef.current
      if (phone) M.arc = phone.offsetHeight * 0.08
    }

    const last = new Map<string, string>()
    const set = (el: HTMLElement | null | undefined, prop: "transform" | "opacity", val: string, key: string) => {
      if (!el || last.get(key) === val) return
      last.set(key, val)
      el.style.setProperty(prop, val)
    }
    const op = (el: HTMLElement | null | undefined, v: number, key: string) => set(el, "opacity", clamp01(v).toFixed(3), key)

    /**
     * One half: grow, scan, fly + squash into the slot, open the list.
     * Returns how much the paper covers the phone (phones dim it) and the
     * landing bloom.
     */
    const drawHalf = (
      p: number,
      b: Beat,
      f: Flight,
      tilt: number,
      el: {
        paper: HTMLElement | null
        marks: HTMLElement | null
        beam: HTMLElement | null
        block: HTMLElement | null
        rest: HTMLElement | null
      },
      k: string,
    ) => {
      const g = ease(seg(p, b.growA, b.growB))
      const m = ease(seg(p, b.moveA, b.moveB))
      // uniform shrink to the slot's width, then squash to its height in the
      // last stretch of the flight, as it sinks into the row
      const squash = ease(seg(p, b.moveA + (b.moveB - b.moveA) * 0.55, b.moveB))
      const sx = g * (1 + (f.sx - 1) * m)
      const sy = sx * (1 + (f.sy / f.sx - 1) * squash)
      const tx = f.dx * m
      const ty = f.dy * m - M.arc * Math.sin(Math.PI * m)
      const rot = tilt * (1 - g) - (tilt / 2.4) * Math.sin(Math.PI * m)
      set(
        el.paper,
        "transform",
        `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
        `${k}T`,
      )
      op(el.paper, seg(p, b.growA, b.growA + 0.035) * (1 - seg(p, b.fadeA, b.fadeB)), `${k}O`)

      // the scanner: brackets close in, squeeze once on capture, let go
      const bIn = ease(seg(p, b.brkA, b.brkB))
      const bOut = ease(seg(p, b.brkOutA, b.brkOutB))
      const snap = bump(p, b.snapA, (b.snapA + b.snapB) / 2, b.snapB)
      op(el.marks, bIn * (1 - bOut), `${k}mO`)
      set(el.marks, "transform", `scale(${(1.1 - 0.1 * bIn - 0.025 * snap + 0.04 * bOut).toFixed(4)})`, `${k}mT`)
      // the scan line: top -> bottom, fading in and out at its ends
      const beam = seg(p, b.beamA, b.beamB)
      op(el.beam, seg(p, b.beamA, b.beamA + 0.012) * (1 - seg(p, b.beamB - 0.01, b.snapB)), `${k}bO`)
      set(el.beam, "transform", `translateY(${((beam - 1) * 100).toFixed(2)}%)`, `${k}bT`)

      // the list opens: the rest slides down, the new item fades in
      const row = ease(seg(p, b.rowA, b.rowB))
      set(el.rest, "transform", `translateY(${(-(1 - row) * f.lift).toFixed(1)}px)`, `${k}rT`)
      op(el.block, row, `${k}nO`)
      set(el.block, "transform", `translateY(${(-(1 - row) * f.lift * 0.35).toFixed(1)}px) scale(${(0.97 + 0.03 * row).toFixed(4)})`, `${k}nT`)

      return {
        cover: g * (1 - ease(seg(p, b.moveA, b.moveA + 0.07))),
        flash: bump(p, b.fadeA - 0.01, b.fadeB - 0.005, b.fadeB + 0.05),
      }
    }

    let halfNow: PocketHalf = "receipts"
    let inNow = false

    const draw = (p: number) => {
      const r = drawHalf(
        p,
        R_BEAT,
        M.r,
        -7,
        { paper: paperRRef.current, marks: marksRRef.current, beam: beamRRef.current, block: newRRef.current, rest: restRRef.current },
        "r",
      )
      const c = drawHalf(
        p,
        C_BEAT,
        M.c,
        7,
        { paper: paperCRef.current, marks: marksCRef.current, beam: beamCRef.current, block: newCRef.current, rest: restCRef.current },
        "c",
      )
      op(couponsLayerRef.current, ease(seg(p, T.tabA, T.tabB)), "tabO")

      // the phone: dims behind big paper (phones only), blooms on merge
      op(phoneRef.current, 1 - M.dim * Math.max(r.cover, c.cover), "phO")
      const flash = Math.max(r.flash, c.flash)
      op(flashRef.current, flash, "flash")
      set(phoneRef.current, "transform", `scale(${(1 + 0.018 * flash).toFixed(4)})`, "phT")

      // ---- state crossings (React re-renders only here) --------------------
      const nextHalf: PocketHalf = p < T.split ? "receipts" : "coupons"
      if (nextHalf !== halfNow) {
        halfNow = nextHalf
        setHalf(nextHalf)
      }
      const nextIn = p >= (R_BEAT.rowA + R_BEAT.rowB) / 2
      if (nextIn !== inNow) {
        inNow = nextIn
        setScannedIn(nextIn)
      }
    }

    let raf: number | null = null
    const update = () => {
      raf = null
      const p = M.runTotal > 0 ? clamp01((window.scrollY - M.runTop) / M.runTotal) : 0
      draw(p)
    }
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      last.clear()
      onScroll()
    }

    measure()
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(scene)
    ro.observe(pin)
    // anything above the runway changing height moves where it starts
    ro.observe(document.documentElement)
    document.fonts?.ready.then(onResize).catch(() => {})
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      ro.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [pinned])

  const jump = useCallback((key: PocketHalf) => {
    const { runTop, runTotal } = geo.current
    window.scrollTo({ top: Math.round(runTop + JUMP[key] * runTotal), behavior: "smooth" })
  }, [])

  // In flow above the runway / static version; hidden by CSS on desktop while
  // the pinned copy shows (data-nojs="static": no-JS always shows this one).
  const flowHead = (
    <div className={s.flowHead} data-nojs="static">
      {header}
    </div>
  )
  const staticVersion =
    mode === "scene" ? null : (
      <div className={s.staticSlot} data-nojs="static">
        <PocketStatic />
      </div>
    )
  if (mode === "static")
    return (
      <>
        {flowHead}
        {staticVersion}
      </>
    )

  return (
    <>
      {flowHead}
      {staticVersion}
      <div ref={runwayRef} className={s.runway} data-nojs="runway" style={{ height: `${RUNWAY_VH}vh` }}>
        <div className={s.pin} ref={pinRef}>
          <div className={s.pinHead}>{header}</div>
          <div className={s.layout}>
            <div className={s.sceneWrap}>
              <span className={s.demoTag}>{t.demoTag}</span>
              {/* The picture is decorative (the cards carry the words) and inert. */}
              <div className={s.scene} ref={sceneRef} aria-hidden="true" inert>
                <div className={s.paperHome}>
                  <PaperReceipt ref={paperRRef} marksRef={marksRRef} beamRef={beamRRef} summary={summary} className={s.fly} />
                  <PaperCoupon ref={paperCRef} marksRef={marksCRef} beamRef={beamCRef} className={s.fly} />
                </div>
                <div className={s.phoneSlot}>
                  <div className={s.phone} ref={phoneRef}>
                    <PhoneChrome>
                      <div className={cn(s.layer, s.layerBase)}>
                        <PocketReceiptsScreen
                          scanned={receipts.scanned}
                          earlier={receipts.earlier}
                          unreviewed={unreviewedBefore + (scannedIn ? 1 : 0)}
                          time={moment.time}
                          newRef={newRRef}
                          restRef={restRRef}
                          slotRef={slotRRef}
                        />
                      </div>
                      <div className={s.layer} ref={couponsLayerRef}>
                        <PocketCouponsScreen
                          scanned={coupons.scanned}
                          earlier={coupons.earlier}
                          time={moment.time}
                          newRef={newCRef}
                          restRef={restCRef}
                          slotRef={slotCRef}
                        />
                      </div>
                      <span className={s.flash} ref={flashRef} />
                    </PhoneChrome>
                  </div>
                </div>
              </div>
            </div>

            <div className={s.cards} role="group" aria-label={t.eyebrow}>
              {t.halves.map((h) => {
                const active = half === h.key
                return (
                  <button
                    key={h.key}
                    type="button"
                    aria-current={active ? "step" : undefined}
                    onClick={() => jump(h.key)}
                    className={cn(s.card, active && s.cardOn)}
                  >
                    <span className={s.cardTitle}>{h.title}</span>
                    <span className={s.cardBody}>{h.body}</span>
                  </button>
                )
              })}
              {/* phones: the active half's words under the two title buttons */}
              <div className={s.mBodies} aria-hidden="true">
                {t.halves.map((h) => (
                  <p key={h.key} className={cn(s.mBody, half === h.key && s.mBodyOn)}>
                    {h.body}
                  </p>
                ))}
              </div>
              <span className={cn(s.demoTag, s.mDemo)}>{t.demoTag}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
