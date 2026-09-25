"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion"
import { ClipLockScreen } from "../../customer/appui"
import { receiptMoment } from "../../customer/appui/Clip"
import { ClipReceiptScreen } from "../../customer/ReceiptCard"
import { PhoneChrome } from "../../customer/WalkPhone"
import { tapToRetain } from "../content"
import { clamp01, ease, seg } from "../story/fold"
import { useDemoReceipt } from "../story/receipt"
import { CouponsScreen } from "./CouponsScreen"
import { IntroStatic } from "./IntroStatic"
import { PaperCoupon, PaperReceipt } from "./Paper"
import s from "./intro.module.css"
import cardStyles from "../tapToRetain.module.css"

/**
 * §02 "What is Tap to Retain?" — the two halves, driven by scroll (Web 2.1 W3,
 * Nico's brief 2026-09-24). Same pattern as §03's RetainStory: a tall runway,
 * a `position: sticky` 100svh pin, ONE progress `p` (0..1 over the runway's
 * scroll), and every frame a pure function of `p` — scrolling up plays it
 * backwards, any `p` always draws the same picture, no timers, no loops.
 *
 *   0.00-0.17  RECEIPT   a paper receipt (the demo Nook Cafe sale) grows from
 *                        nothing until it clearly reads as a store receipt
 *   0.17-0.25            hold: read it
 *   0.25-0.38            it flies to the phone and sinks into the screen,
 *                        which becomes the App Clip's receipt (the same
 *                        ClipReceiptScreen /customers draws)
 *   0.38-0.47            hold
 *   0.50-0.64  COUPON    a paper coupon ("$2 OFF your next visit", stamped
 *                        Demo) grows the same way
 *   0.64-0.71            hold
 *   0.71-0.84            it flies onto the coupon row's spot and squashes into
 *                        it as the phone crossfades to the app's Coupons tab
 *   0.84-1.00            hold on the coupon in the app
 *
 * On phones (<=820px) the paper grows IN FRONT of the (dimmed) phone, which
 * stays whole and large; on desktop it grows beside it.
 *
 * The caption cards highlight in sync (receipt beat / coupon beat) and are
 * buttons that scroll to their beat's "paper fully readable" point.
 *
 * Perf contract: the frame writes only `transform` and `opacity`, through a
 * cache that drops unchanged values, and reads nothing from layout — every
 * geometric number comes from `measure()`, run on mount, resize,
 * ResizeObserver and fonts.ready.
 */

/** Scroll budget for the scene, in viewport heights. */
const SCROLL_VH = 230
/** The runway: the pinned viewport plus the scene's scroll. */
const RUNWAY_VH = 100 + SCROLL_VH

const T = {
  rGrowA: 0.02,
  rGrowB: 0.17,
  rMoveA: 0.25,
  rMoveB: 0.37,
  rFadeA: 0.325,
  rFadeB: 0.375,
  rScreenA: 0.31,
  rScreenB: 0.37,
  split: 0.475,
  cGrowA: 0.5,
  cGrowB: 0.64,
  cMoveA: 0.71,
  cMoveB: 0.83,
  cFadeA: 0.79,
  cFadeB: 0.84,
  cScreenA: 0.765,
  cScreenB: 0.815,
  cRowA: 0.795,
  cRowB: 0.86,
} as const

/** Where a caption card's click lands: that half's paper, fully readable. */
const JUMP = { receipts: 0.21, coupons: 0.675 } as const

type Half = keyof typeof JUMP

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

/** 0 -> 1 -> 0 across [a, c], peaking at b. */
const bump = (p: number, a: number, b: number, c: number) => (p <= b ? seg(p, a, b) : 1 - seg(p, b, c))

export function IntroScene() {
  const reduced = useSafeReducedMotion()
  // Client-only: the server (and reduced motion) renders the static version.
  const [pinned, setPinned] = useState(false)
  const [half, setHalf] = useState<Half>("receipts")
  const [locked, setLocked] = useState(true)
  const summary = useDemoReceipt()
  const moment = receiptMoment(summary.dateline)
  const t = tapToRetain

  const runwayRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const paperRRef = useRef<HTMLDivElement>(null)
  const paperCRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const couponsRef = useRef<HTMLDivElement>(null)
  const rowWrapRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLSpanElement>(null)
  // where the runway sits, for the cards' jump (written by measure())
  const geo = useRef({ runTop: 0, runTotal: 0 })

  useEffect(() => {
    setPinned(!reduced)
  }, [reduced])

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
      // receipt: home centre -> screen point, and the landing scale
      rDx: 0,
      rDy: 0,
      rS: 0.8,
      // coupon: home centre -> the coupon row's centre, landing scales
      cDx: 0,
      cDy: 0,
      cSx: 0.8,
      cSy: 0.3,
      arc: 0,
      rise: 0,
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

      const paperR = paperRRef.current
      const paperC = paperCRef.current
      const phone = phoneRef.current
      const row = rowRef.current
      if (!paperR || !paperC || !phone || !row) return

      const ph = offsetIn(phone, scene)
      // The frame's box is the screen plus the band + bezel ring: 1.1 x the
      // screen width (iphone.module.css), and the screen is centred in it.
      const screenW = ph.w / 1.1
      const screenH = ph.h - (ph.w - screenW)
      const scx = ph.x + ph.w / 2
      const scy = ph.y + ph.h / 2

      const pr = offsetIn(paperR, scene)
      M.rDx = scx - (pr.x + pr.w / 2)
      // the clip receipt's card sits in the upper half of the screen
      M.rDy = scy - screenH * 0.06 - (pr.y + pr.h / 2)
      M.rS = Math.min((screenW * 0.86) / pr.w, (screenH * 0.7) / pr.h)

      const pc = offsetIn(paperC, scene)
      const rw = offsetIn(row, scene)
      M.cDx = rw.x + rw.w / 2 - (pc.x + pc.w / 2)
      M.cDy = rw.y + rw.h / 2 - (pc.y + pc.h / 2)
      M.cSx = rw.w / pc.w
      M.cSy = rw.h / pc.h

      M.arc = ph.h * 0.08
      M.rise = rw.h * 0.35
    }

    const last = new Map<string, string>()
    const set = (el: HTMLElement | null | undefined, prop: "transform" | "opacity", val: string, key: string) => {
      if (!el || last.get(key) === val) return
      last.set(key, val)
      el.style.setProperty(prop, val)
    }
    const op = (el: HTMLElement | null | undefined, v: number, key: string) =>
      set(el, "opacity", clamp01(v).toFixed(3), key)

    let halfNow: Half = "receipts"
    let lockedNow = true

    const draw = (p: number) => {
      // ---- the receipt ----------------------------------------------------
      const rg = ease(seg(p, T.rGrowA, T.rGrowB))
      const rm = ease(seg(p, T.rMoveA, T.rMoveB))
      const rs = rg * (1 + (M.rS - 1) * rm)
      const rTx = M.rDx * rm
      const rTy = M.rDy * rm - M.arc * Math.sin(Math.PI * rm)
      const rRot = -7 * (1 - rg) + 3 * Math.sin(Math.PI * rm)
      set(
        paperRRef.current,
        "transform",
        `translate(${rTx.toFixed(1)}px, ${rTy.toFixed(1)}px) rotate(${rRot.toFixed(2)}deg) scale(${rs.toFixed(4)})`,
        "rT",
      )
      op(paperRRef.current, seg(p, T.rGrowA, T.rGrowA + 0.035) * (1 - seg(p, T.rFadeA, T.rFadeB)), "rO")
      op(clipRef.current, ease(seg(p, T.rScreenA, T.rScreenB)), "clipO")

      // ---- the coupon -----------------------------------------------------
      const cg = ease(seg(p, T.cGrowA, T.cGrowB))
      const cm = ease(seg(p, T.cMoveA, T.cMoveB))
      // uniform shrink to the row's width, then squash to its height in the
      // last stretch of the flight, as it sinks into the row
      const squash = ease(seg(p, T.cMoveA + (T.cMoveB - T.cMoveA) * 0.55, T.cMoveB))
      const csx = cg * (1 + (M.cSx - 1) * cm)
      const csy = csx * (1 + (M.cSy / M.cSx - 1) * squash)
      const cTx = M.cDx * cm
      const cTy = M.cDy * cm - M.arc * Math.sin(Math.PI * cm)
      const cRot = 7 * (1 - cg) - 3 * Math.sin(Math.PI * cm)
      set(
        paperCRef.current,
        "transform",
        `translate(${cTx.toFixed(1)}px, ${cTy.toFixed(1)}px) rotate(${cRot.toFixed(2)}deg) scale(${csx.toFixed(4)}, ${csy.toFixed(4)})`,
        "cT",
      )
      op(paperCRef.current, seg(p, T.cGrowA, T.cGrowA + 0.035) * (1 - seg(p, T.cFadeA, T.cFadeB)), "cO")
      op(couponsRef.current, ease(seg(p, T.cScreenA, T.cScreenB)), "cpnO")
      const cr = ease(seg(p, T.cRowA, T.cRowB))
      op(rowWrapRef.current, cr, "rowO")
      set(rowWrapRef.current, "transform", `translateY(${((1 - cr) * M.rise).toFixed(1)}px) scale(${(0.96 + 0.04 * cr).toFixed(4)})`, "rowT")

      // ---- the phone: dims behind big paper (phones only), blooms on merge
      const coverR = rg * (1 - ease(seg(p, T.rMoveA, T.rMoveA + 0.07)))
      const coverC = cg * (1 - ease(seg(p, T.cMoveA, T.cMoveA + 0.07)))
      op(phoneRef.current, 1 - M.dim * Math.max(coverR, coverC), "phO")
      const flash = Math.max(bump(p, T.rFadeA - 0.01, T.rFadeB - 0.005, T.rFadeB + 0.05), bump(p, T.cFadeA - 0.01, T.cFadeB - 0.005, T.cFadeB + 0.05))
      op(flashRef.current, flash, "flash")
      set(phoneRef.current, "transform", `scale(${(1 + 0.018 * flash).toFixed(4)})`, "phT")

      // ---- state crossings (React re-renders only here) --------------------
      const nextHalf: Half = p < T.split ? "receipts" : "coupons"
      if (nextHalf !== halfNow) {
        halfNow = nextHalf
        setHalf(nextHalf)
      }
      const nextLocked = p < (T.rScreenA + T.rScreenB) / 2
      if (nextLocked !== lockedNow) {
        lockedNow = nextLocked
        setLocked(nextLocked)
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

  const jump = useCallback((key: Half) => {
    const { runTop, runTotal } = geo.current
    window.scrollTo({ top: Math.round(runTop + JUMP[key] * runTotal), behavior: "smooth" })
  }, [])

  if (!pinned) return <IntroStatic />

  return (
    <div ref={runwayRef} className={s.runway} style={{ height: `${RUNWAY_VH}vh` }}>
      <div className={s.pin} ref={pinRef}>
        <div className={s.layout}>
          <div className={s.sceneWrap}>
            <span className={s.demoTag}>{t.demoTag}</span>
            {/* The picture is decorative (the cards carry the words) and
                inert: the reused clip screen holds a button and a <summary>
                that must never take focus. */}
            <div className={s.scene} ref={sceneRef} aria-hidden="true" inert>
              <div className={s.paperHome}>
                <PaperReceipt ref={paperRRef} summary={summary} className={s.flyer} />
                <PaperCoupon ref={paperCRef} merchant={summary.merchantName} className={s.flyer} />
              </div>
              <div className={s.phoneSlot}>
                <div className={s.phone} ref={phoneRef}>
                  <PhoneChrome islandLock={locked}>
                    <div className={cn(s.layer, s.layerBase)}>
                      <ClipLockScreen card={false} moment={moment} />
                    </div>
                    <div className={cn(s.layer, s.layerClip)} ref={clipRef}>
                      <ClipReceiptScreen summary={summary} />
                    </div>
                    <div className={s.layer} ref={couponsRef}>
                      <CouponsScreen time={moment.time} rowRef={rowRef} rowWrapRef={rowWrapRef} />
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
                  className={cn(cardStyles.card, active && cardStyles.cardOn)}
                >
                  <span className={cardStyles.cardTitle}>{h.title}</span>
                  <span className={cardStyles.cardBody}>{h.body}</span>
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
  )
}
