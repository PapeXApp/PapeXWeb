"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { receiptMoment } from "../appui/Clip"
import { PhoneChrome } from "../WalkPhone"
import { EmailReceipt, PaperCoupon, PaperReceipt } from "./Paper"
import { pocketCopy, type PocketHalf } from "./pocketCopy"
import { pocketCoupons, pocketReceipts, useDemoReceipt } from "./pocketData"
import { PocketCouponsScreen, PocketReceiptsScreen } from "./PocketScreens"
import { PocketStatic } from "./PocketStatic"
import s from "./pocket.module.css"

/**
 * /customers §02 "Every receipt, in your pocket." — the customer twin of
 * /business §02 (business/intro/IntroScene.tsx, whose pattern this copies).
 * Three beats, email first and longest (Nico, 2026-09-28: "start by
 * advertising the email THEN the scan. but the email is big here"):
 *
 *   EMAIL (0.00-0.425, the biggest share)
 *   0.02-0.10   a mail window with the receipt email (From Quillbrook
 *               Market, "Your Quillbrook Market receipt") grows beside the
 *               phone (Receipts tab, list whole)
 *   0.11-0.14   Forward is pressed in the toolbar
 *   0.135-0.17  the "Fwd:" compose sheet slides up over the message
 *   0.165-0.25  "yourname@papexmail.com" types out in its To field
 *   0.255-0.285 Send is pressed
 *   0.29-0.38   the email shrinks into the phone and squashes into the top
 *               row; a "Today" section opens and the row ("Email by you",
 *               unreviewed) fades in; 1 -> 2 unreviewed
 *   PAPER (0.425-0.70)
 *   0.44-0.50   the Tidewick Cafe paper receipt grows
 *   0.495-0.60  scan brackets close in, the scan line sweeps, capture
 *   0.595-0.685 it flies onto the top of Today; the email row slides down
 *               and the "Scanned by you" row fades in; 2 -> 3 unreviewed
 *   COUPON (0.70-1.00)
 *   0.695-0.73  the phone crossfades to the Coupons tab
 *   0.71-0.955  the paper coupon grows, is scanned, and lands on top of the
 *               coupon list the same way
 *   0.955-1.00  hold
 *
 * A tall runway, a `position: sticky` 100svh pin, ONE progress `p` (0..1 over
 * the runway's scroll), and every frame a pure function of `p` — scrolling up
 * plays it backwards, any `p` always draws the same picture, no timers, no
 * loops.
 *
 * On phones (<=820px) the email / paper grows IN FRONT of the (dimmed)
 * phone, which stays whole and large; on desktop it grows beside it.
 *
 * The section heading (`header`) is placed twice and CSS shows one: at the
 * top of the pin on desktop screens tall enough (>= 821 x 680), in flow above
 * everywhere else. The caption cards highlight in sync and are buttons that
 * scroll to their beat.
 *
 * Perf contract: the frame writes only `transform`, `opacity` and (for the
 * address wipe) `clip-path`, through a cache that drops unchanged values, and
 * reads nothing from layout — every geometric number comes from `measure()`,
 * run on mount, resize, ResizeObserver and fonts.ready.
 */

/** Scroll budget for the scene, in viewport heights. */
const SCROLL_VH = 320
/** The runway: the pinned viewport plus the scene's scroll. */
const RUNWAY_VH = 100 + SCROLL_VH

/** A flyer's grow -> fly -> land clock. */
type Flyer = { growA: number; growB: number; moveA: number; moveB: number; fadeA: number; fadeB: number; rowA: number; rowB: number }
/** A scanned flyer's clock: the flight plus the scanner. */
type Scan = Flyer & { brkA: number; brkB: number; beamA: number; beamB: number; snapA: number; snapB: number; brkOutA: number; brkOutB: number }

const E_BEAT = {
  growA: 0.02,
  growB: 0.1,
  fwdA: 0.11,
  fwdB: 0.14,
  composeA: 0.135,
  composeB: 0.17,
  typeA: 0.165,
  typeB: 0.25,
  sendA: 0.255,
  sendB: 0.285,
  moveA: 0.29,
  moveB: 0.38,
  fadeA: 0.345,
  fadeB: 0.385,
  rowA: 0.335,
  rowB: 0.4,
}
const P_BEAT: Scan = {
  growA: 0.44,
  growB: 0.5,
  brkA: 0.495,
  brkB: 0.52,
  beamA: 0.515,
  beamB: 0.565,
  snapA: 0.565,
  snapB: 0.585,
  brkOutA: 0.585,
  brkOutB: 0.6,
  moveA: 0.595,
  moveB: 0.665,
  fadeA: 0.635,
  fadeB: 0.67,
  rowA: 0.63,
  rowB: 0.685,
}
const shift = (b: Scan, d: number): Scan => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v + d])) as Scan
const C_BEAT = shift(P_BEAT, 0.27)

const T = {
  split1: 0.425,
  split2: 0.7,
  tabA: 0.695,
  tabB: 0.73,
} as const

/** Where a caption card's click lands: mid-forward, mid-scan, mid-scan. */
const JUMP: Record<PocketHalf, number> = { email: 0.21, paper: 0.54, coupons: 0.81 }

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

/** Flyer home centre -> landing centre, and the landing scales. */
type Flight = { dx: number; dy: number; sx: number; sy: number }

export function PocketScene({ header }: { header: ReactNode }) {
  // "ssr": the server render and first client frame carry BOTH versions and
  // CSS shows one (the runway unless prefers-reduced-motion, then the static
  // composition), so the section is its final height from the first paint.
  const [mode, setMode] = useState<"ssr" | "scene" | "static">("ssr")
  const pinned = mode === "scene"
  const [half, setHalf] = useState<PocketHalf>("email")
  // how many of the two receipts have landed (steps the unreviewed count)
  const [arrived, setArrived] = useState(0)
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
  // email beat
  const emailRef = useRef<HTMLDivElement>(null)
  const fwdOnRef = useRef<HTMLSpanElement>(null)
  const composeRef = useRef<HTMLDivElement>(null)
  const addressRef = useRef<HTMLSpanElement>(null)
  const sendOnRef = useRef<HTMLSpanElement>(null)
  // paper beat
  const paperRef = useRef<HTMLDivElement>(null)
  const marksPRef = useRef<HTMLSpanElement>(null)
  const beamPRef = useRef<HTMLSpanElement>(null)
  // the Receipts list
  const headRef = useRef<HTMLDivElement>(null)
  const scanRowRef = useRef<HTMLDivElement>(null)
  const emailRowRef = useRef<HTMLDivElement>(null)
  const restRRef = useRef<HTMLDivElement>(null)
  // coupon beat + the Coupons list
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

    const still: Flight = { dx: 0, dy: 0, sx: 0.5, sy: 0.2 }
    /** Everything the frame needs, in px. Rebuilt by measure() only. */
    const M = {
      runTop: 0,
      runTotal: 0,
      dim: 0,
      arc: 0,
      e: { ...still },
      p: { ...still },
      c: { ...still },
      // Receipts list: Today header, scan row, email row spans (layout)
      h1: 0,
      h2: 0,
      h3: 0,
      // Coupons list: the new coupon's footprint
      cLift: 0,
    }

    /** Flyer home centre -> the target's centre (shifted up by `lift`). */
    const flight = (flyer: HTMLElement | null, target: HTMLElement | null, lift = 0): Flight | null => {
      if (!flyer || !target) return null
      const f = offsetIn(flyer, scene)
      const g = offsetIn(target, scene)
      return {
        dx: g.x + g.w / 2 - (f.x + f.w / 2),
        dy: g.y - lift + g.h / 2 - (f.y + f.h / 2),
        sx: g.w / f.w,
        sy: g.h / f.h,
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
      const phone = phoneRef.current
      if (phone) M.arc = phone.offsetHeight * 0.08

      const head = headRef.current
      const scanRow = scanRowRef.current
      const emailRow = emailRowRef.current
      const rest = restRRef.current
      if (head && scanRow && emailRow && rest) {
        const yH = offsetIn(head, scene).y
        const yS = offsetIn(scanRow, scene).y
        const yE = offsetIn(emailRow, scene).y
        const yR = offsetIn(rest, scene).y
        M.h1 = yS - yH
        M.h2 = yE - yS
        M.h3 = yR - yE
      }
      // the email lands where its row sits BEFORE the scan row exists
      M.e = flight(emailRef.current, emailRow, M.h2) ?? M.e
      M.p = flight(paperRef.current, scanRow) ?? M.p
      M.c = flight(paperCRef.current, slotCRef.current) ?? M.c
      const newC = newCRef.current
      const restC = restCRef.current
      if (newC && restC) M.cLift = offsetIn(restC, scene).y - offsetIn(newC, scene).y
    }

    const last = new Map<string, string>()
    const set = (el: HTMLElement | null | undefined, prop: "transform" | "opacity" | "clip-path", val: string, key: string) => {
      if (!el || last.get(key) === val) return
      last.set(key, val)
      el.style.setProperty(prop, val)
    }
    const op = (el: HTMLElement | null | undefined, v: number, key: string) => set(el, "opacity", clamp01(v).toFixed(3), key)
    const ty = (v: number, sc = 1) => `translateY(${v.toFixed(1)}px) scale(${sc.toFixed(4)})`

    /**
     * Grow from nothing, fly (arcing) onto the target, shrinking to its width
     * and squashing to its height in the last stretch. Returns how much it
     * covers the phone (phones dim it) and the landing bloom.
     */
    const fly = (p: number, b: Flyer, f: Flight, tilt: number, el: HTMLElement | null, k: string) => {
      const g = ease(seg(p, b.growA, b.growB))
      const m = ease(seg(p, b.moveA, b.moveB))
      const squash = ease(seg(p, b.moveA + (b.moveB - b.moveA) * 0.55, b.moveB))
      const sx = g * (1 + (f.sx - 1) * m)
      const sy = sx * (1 + (f.sy / f.sx - 1) * squash)
      const tx = f.dx * m
      const tY = f.dy * m - M.arc * Math.sin(Math.PI * m)
      const rot = tilt * (1 - g) - (tilt / 2.4) * Math.sin(Math.PI * m)
      set(
        el,
        "transform",
        `translate(${tx.toFixed(1)}px, ${tY.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
        `${k}T`,
      )
      op(el, seg(p, b.growA, b.growA + 0.03) * (1 - seg(p, b.fadeA, b.fadeB)), `${k}O`)
      return {
        cover: g * (1 - ease(seg(p, b.moveA, b.moveA + 0.06))),
        flash: bump(p, b.fadeA - 0.01, b.fadeB - 0.005, b.fadeB + 0.045),
      }
    }

    /** The scanner over a paper: brackets close in, squeeze on capture, let go; the line sweeps. */
    const scan = (p: number, b: Scan, marks: HTMLElement | null, beam: HTMLElement | null, k: string) => {
      const bIn = ease(seg(p, b.brkA, b.brkB))
      const bOut = ease(seg(p, b.brkOutA, b.brkOutB))
      const snap = bump(p, b.snapA, (b.snapA + b.snapB) / 2, b.snapB)
      op(marks, bIn * (1 - bOut), `${k}mO`)
      set(marks, "transform", `scale(${(1.1 - 0.1 * bIn - 0.025 * snap + 0.04 * bOut).toFixed(4)})`, `${k}mT`)
      const sweep = seg(p, b.beamA, b.beamB)
      op(beam, seg(p, b.beamA, b.beamA + 0.01) * (1 - seg(p, b.beamB - 0.008, b.snapB)), `${k}bO`)
      set(beam, "transform", `translateY(${((sweep - 1) * 100).toFixed(2)}%)`, `${k}bT`)
    }

    let halfNow: PocketHalf = "email"
    let arrivedNow = 0

    const draw = (p: number) => {
      // ---- 1. the email: forward, type the address, send, fly -------------
      const E = E_BEAT
      const fe = fly(p, E, M.e, -6, emailRef.current, "e")
      op(fwdOnRef.current, ease(seg(p, E.fwdA, E.fwdB)), "fwd")
      const comp = ease(seg(p, E.composeA, E.composeB))
      op(composeRef.current, comp, "cmpO")
      set(composeRef.current, "transform", `translateY(${((1 - comp) * 104).toFixed(2)}%)`, "cmpT")
      set(addressRef.current, "clip-path", `inset(0 ${((1 - seg(p, E.typeA, E.typeB)) * 100).toFixed(1)}% 0 0)`, "addr")
      const press = bump(p, E.sendA, (E.sendA + E.sendB) / 2, E.sendB)
      op(sendOnRef.current, press, "sndO")
      set(sendOnRef.current, "transform", `scale(${(1 + 0.35 * press).toFixed(4)})`, "sndT")

      // ---- 2. the paper receipt: scan, fly --------------------------------
      const fp = fly(p, P_BEAT, M.p, 7, paperRef.current, "p")
      scan(p, P_BEAT, marksPRef.current, beamPRef.current, "p")

      // ---- the Receipts list: Today opens with the email, the scan lands on top
      const e = ease(seg(p, E.rowA, E.rowB))
      const sN = ease(seg(p, P_BEAT.rowA, P_BEAT.rowB))
      op(headRef.current, e, "hdO")
      set(headRef.current, "transform", ty(-(1 - e) * M.h1 * 0.4), "hdT")
      op(emailRowRef.current, e, "erO")
      set(emailRowRef.current, "transform", ty(-M.h2 * (1 - sN) - (1 - e) * M.h3 * 0.35, 0.97 + 0.03 * e), "erT")
      op(scanRowRef.current, sN, "srO")
      set(scanRowRef.current, "transform", ty(-(1 - sN) * M.h2 * 0.35, 0.97 + 0.03 * sN), "srT")
      set(restRRef.current, "transform", ty(-M.h2 * (1 - sN) - (M.h1 + M.h3) * (1 - e)), "rrT")

      // ---- 3. the coupon: scan, fly, the Coupons list opens -----------------
      op(couponsLayerRef.current, ease(seg(p, T.tabA, T.tabB)), "tabO")
      const fc = fly(p, C_BEAT, M.c, 7, paperCRef.current, "c")
      scan(p, C_BEAT, marksCRef.current, beamCRef.current, "c")
      const cr = ease(seg(p, C_BEAT.rowA, C_BEAT.rowB))
      op(newCRef.current, cr, "cnO")
      set(newCRef.current, "transform", ty(-(1 - cr) * M.cLift * 0.35, 0.97 + 0.03 * cr), "cnT")
      set(restCRef.current, "transform", ty(-(1 - cr) * M.cLift), "crT")

      // ---- the phone: dims behind big paper (phones only), blooms on merge
      op(phoneRef.current, 1 - M.dim * Math.max(fe.cover, fp.cover, fc.cover), "phO")
      const flash = Math.max(fe.flash, fp.flash, fc.flash)
      op(flashRef.current, flash, "flash")
      set(phoneRef.current, "transform", `scale(${(1 + 0.018 * flash).toFixed(4)})`, "phT")

      // ---- state crossings (React re-renders only here) --------------------
      const nextHalf: PocketHalf = p < T.split1 ? "email" : p < T.split2 ? "paper" : "coupons"
      if (nextHalf !== halfNow) {
        halfNow = nextHalf
        setHalf(nextHalf)
      }
      const nextArrived = (p >= (E.rowA + E.rowB) / 2 ? 1 : 0) + (p >= (P_BEAT.rowA + P_BEAT.rowB) / 2 ? 1 : 0)
      if (nextArrived !== arrivedNow) {
        arrivedNow = nextArrived
        setArrived(nextArrived)
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
              {/* data-flow-static: own palette, never the page ground (see
                  [data-flow-static] in shared/flow.module.css) */}
              <div className={s.scene} ref={sceneRef} aria-hidden="true" inert data-flow-static="">
                <div className={s.paperHome}>
                  <EmailReceipt
                    ref={emailRef}
                    forwardOnRef={fwdOnRef}
                    composeRef={composeRef}
                    addressRef={addressRef}
                    sendOnRef={sendOnRef}
                    className={s.fly}
                  />
                  <PaperReceipt ref={paperRef} marksRef={marksPRef} beamRef={beamPRef} summary={summary} className={s.fly} />
                  <PaperCoupon ref={paperCRef} marksRef={marksCRef} beamRef={beamCRef} className={s.fly} />
                </div>
                <div className={s.phoneSlot}>
                  <div className={s.phone} ref={phoneRef}>
                    <PhoneChrome>
                      <div className={cn(s.layer, s.layerBase)}>
                        <PocketReceiptsScreen
                          emailed={receipts.emailed}
                          scanned={receipts.scanned}
                          earlier={receipts.earlier}
                          unreviewed={unreviewedBefore + arrived}
                          time={moment.time}
                          headRef={headRef}
                          scanRef={scanRowRef}
                          emailRef={emailRowRef}
                          restRef={restRRef}
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
              {t.halves.map((h, i) => {
                const active = half === h.key
                return (
                  <button
                    key={h.key}
                    type="button"
                    aria-current={active ? "step" : undefined}
                    onClick={() => jump(h.key)}
                    className={cn(s.card, i === 0 && s.cardLead, active && s.cardOn)}
                  >
                    <span className={s.cardTitle}>{h.title}</span>
                    <span className={s.cardBody}>{h.body}</span>
                  </button>
                )
              })}
              {/* phones: the active beat's words under the three title buttons */}
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
