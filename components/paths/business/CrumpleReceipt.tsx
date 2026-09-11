"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { whyMerchants } from "./content"
import styles from "./business.module.css"

/**
 * 3.2's four reasons, delivered the way a merchant gets them today: printed.
 *
 * A thermal printer feeds out a receipt whose line items ARE the four claims
 * ($0 / 1 port / 1 tap / 0 rolls — the amount column of a receipt is exactly
 * the shape of those numbers). The visitor crumples the paper by dragging it,
 * throws it in the bin, and the same four reasons re-form as digital cards.
 *
 * The metaphor is deliberately "the paper was the delivery, not the message":
 * binning the reasons to switch would argue the opposite of the section. What
 * gets thrown away is the paper; the four reasons survive it.
 *
 * The cards are real DOM the whole time — `hidden` until the throw lands, but
 * present for reduced motion, for keyboard, and for anyone who never plays.
 * Nothing here is the only route to the content.
 *
 * The printer is drawn locally rather than lifted from the customer path's
 * FlipCards.tsx `Printer`, which is welded to that scene's gradient ids and
 * print choreography. Same light direction (top-left) and same palette, so the
 * two read as one family; unifying them is a refactor for another day.
 */

const PRINT_MS = 2300
/** Accumulated pointer travel, in px, that takes the sheet from flat to balled. */
const CRUMPLE_TRAVEL = 560
const BUTTON_CRUMPLE_MS = 850
/** Pointer travel, in px, that separates a deliberate flick from a let-go. */
const CARRY_TO_THROW = 34
const THROW_MS = 720

type Phase = "idle" | "printing" | "ready" | "crumpled" | "throwing" | "done"

export function CrumpleReceipt() {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [crumple, setCrumple] = useState(0)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const binRef = useRef<HTMLDivElement>(null)
  const travel = useRef(0)
  /** Pointer travel since the ball formed — a throw has to be a throw. */
  const carried = useRef(0)
  const last = useRef<{ x: number; y: number } | null>(null)
  const throwTo = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Reduced motion gets the end state outright: no print, no paper, no throw.
  useEffect(() => {
    if (reduced) setPhase("done")
  }, [reduced])

  // Print on arrival, not on mount — the feed should happen where it's seen.
  useEffect(() => {
    if (reduced) return
    const el = stageRef.current
    if (!el || phase !== "idle") return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("printing")
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [phase, reduced])

  useEffect(() => {
    if (phase !== "printing") return
    const t = window.setTimeout(() => setPhase("ready"), PRINT_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  /** Where the balled paper has to land, measured rather than guessed. */
  const aimAtBin = useCallback(() => {
    const paper = paperRef.current?.getBoundingClientRect()
    const bin = binRef.current?.getBoundingClientRect()
    if (!paper || !bin) return
    throwTo.current = {
      x: bin.left + bin.width / 2 - (paper.left + paper.width / 2),
      // into the mouth, not the middle of the can
      y: bin.top + bin.height * 0.3 - (paper.top + paper.height / 2),
    }
  }, [])

  const launch = useCallback(() => {
    aimAtBin()
    setDrag(null)
    setPhase("throwing")
    window.setTimeout(() => setPhase("done"), THROW_MS)
  }, [aimAtBin])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== "ready" && phase !== "crumpled") return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // capture is an optimisation for dragging past the element's bounds, not
      // a requirement; a pointer the browser no longer considers active throws.
    }
    last.current = { x: e.clientX, y: e.clientY }
    if (phase === "crumpled") {
      carried.current = 0
      setDrag({ x: 0, y: 0 })
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!last.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y

    if (phase === "ready") {
      travel.current += Math.hypot(dx, dy)
      const next = Math.min(1, travel.current / CRUMPLE_TRAVEL)
      setCrumple(next)
      if (next >= 1) {
        // Hand the SAME gesture straight over to carrying the ball: scribble,
        // keep moving, release to throw, all without lifting. Ending the drag
        // here instead would strand the visitor holding a ball that ignores
        // them until they let go and grab it again.
        setPhase("crumpled")
        carried.current = 0
        setDrag({ x: 0, y: 0 })
        last.current = { x: e.clientX, y: e.clientY }
        return
      }
    } else if (phase === "crumpled") {
      carried.current += Math.hypot(dx, dy)
      setDrag((d) => ({ x: (d?.x ?? 0) + dx, y: (d?.y ?? 0) + dy }))
    }
    last.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = () => {
    // A thrown ball always goes in — missing is not a failure state anyone
    // wants on a marketing page, so the arc corrects for it. But it has to be
    // an actual throw: letting go the instant the paper balls up leaves it in
    // hand, so the "flick it at the bin" beat still gets its moment.
    if (phase === "crumpled" && drag && carried.current > CARRY_TO_THROW) launch()
    last.current = null
  }

  /** Keyboard / tap route through the same two beats. */
  const pressAction = () => {
    if (phase === "ready") {
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / BUTTON_CRUMPLE_MS)
        setCrumple(p)
        if (p < 1) requestAnimationFrame(step)
        else setPhase("crumpled")
      }
      requestAnimationFrame(step)
    } else if (phase === "crumpled") {
      launch()
    }
  }

  const showPaper = phase === "printing" || phase === "ready" || phase === "crumpled" || phase === "throwing"
  const grabbable = phase === "ready" || phase === "crumpled"
  const level = Math.min(4, Math.round(crumple * 4))

  return (
    <div className={styles.crStage} ref={stageRef}>
      <CrumpleFilters />

      {/* ---- the scene: decorative, the cards below carry the content ---- */}
      <div
        className={cn(styles.crScene, phase === "done" && styles.crSceneOut)}
        aria-hidden={phase === "done" ? "true" : undefined}
      >
        <span aria-hidden="true" className={styles.crGround} />
        <Printer printing={phase === "printing"} />

        {showPaper && (
          <div
            ref={paperRef}
            className={cn(
              styles.crPaper,
              phase === "printing" && styles.crPaperPrinting,
              phase === "throwing" && styles.crPaperThrown,
              grabbable && styles.crPaperGrab,
            )}
            data-level={level}
            style={
              {
                "--c": crumple,
                "--dx": `${drag?.x ?? 0}px`,
                "--dy": `${drag?.y ?? 0}px`,
                "--tx": `${throwTo.current.x}px`,
                "--ty": `${throwTo.current.y}px`,
                "--print-ms": `${PRINT_MS}ms`,
                "--throw-ms": `${THROW_MS}ms`,
              } as CSSProperties
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className={styles.crSheet}>
              <div className={styles.crSlipHead}>PAPEX</div>
              <div className={styles.crRule} />
              <div className={styles.crSlipSub}>REASONS TO SWITCH</div>
              <div className={styles.crItems}>
                {whyMerchants.cards.map((card) => (
                  <div key={card.value} className={styles.crItem}>
                    <span>{card.title}</span>
                    <span className={styles.crItemValue}>{card.value}</span>
                  </div>
                ))}
              </div>
              <div className={styles.crRule} />
              <div className={cn(styles.crItem, styles.crTotal)}>
                <span>TOTAL</span>
                <span>4</span>
              </div>
              <div className={styles.crSlipFoot}>NONE TO SAY NO</div>
              <div aria-hidden="true" className={styles.crBarcode} />
            </div>
            {/* folds only exist once it starts balling up */}
            <span aria-hidden="true" className={styles.crFolds} />
          </div>
        )}

        <Bin ref={binRef} landed={phase === "done"} />
      </div>

      {/* ---- the affordance ---- */}
      {!reduced && phase !== "done" && (
        <div className={styles.crPrompt}>
          <button type="button" className={styles.crButton} onClick={pressAction} disabled={!grabbable}>
            {phase === "crumpled" || phase === "throwing" ? "Throw it away" : "Crumple it"}
          </button>
          <span className={styles.crHint}>
            {phase === "printing" && "Printing your reasons…"}
            {phase === "ready" && "Drag the receipt to crumple it"}
            {phase === "crumpled" && "Now flick it at the bin"}
            {phase === "throwing" && " "}
          </span>
        </div>
      )}

      {/* ---- the payoff: the same four reasons, no paper ---- */}
      <div className={cn(styles.crCards, phase === "done" && styles.crCardsIn)} hidden={phase !== "done"}>
        <p className={styles.crCardsLead}>Same four reasons. No paper.</p>
        <div className={styles.crCardGrid}>
          {whyMerchants.cards.map((card) => (
            <div key={card.value} className={cn(styles.crCard, card.isLead && styles.crCardLead)}>
              <div className={styles.crCardValue}>{card.value}</div>
              <div className={styles.crCardRule} />
              <div className={styles.crCardTitle}>{card.title}</div>
              <p className={styles.crCardBody}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Five discrete crumple levels rather than one animated displacement: scaling
 * feDisplacementMap every frame of a drag is the expensive way to do this, and
 * real paper creases in jumps anyway. The smooth part of the motion is the
 * transform, which is free.
 */
function CrumpleFilters() {
  return (
    <svg aria-hidden="true" className={styles.crDefs} focusable="false">
      <defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <filter key={i} id={`cr-crumple-${i}`} x="-18%" y="-18%" width="136%" height="136%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.012 + i * 0.008}
              numOctaves={3}
              seed={7 + i * 13}
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={i * 5.5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>
    </svg>
  )
}

function Printer({ printing }: { printing: boolean }) {
  return (
    <div className={cn(styles.crPrinter, printing && styles.crPrinterBusy)}>
      <svg viewBox="0 0 260 150" className={styles.crPrinterSvg} aria-hidden="true">
        <defs>
          <linearGradient id="cr-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A4753" />
            <stop offset="1" stopColor="#1B242E" />
          </linearGradient>
          <linearGradient id="cr-lid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#55636F" />
            <stop offset="1" stopColor="#2C3742" />
          </linearGradient>
        </defs>
        {/* cast shadow on the ground plane */}
        <ellipse cx="130" cy="132" rx="106" ry="9" fill="#00121D" opacity="0.14" />
        {/* paper roll hump on top, then the body, then the front bezel */}
        <rect x="48" y="6" width="164" height="34" rx="17" fill="url(#cr-lid)" />
        <rect x="70" y="14" width="120" height="9" rx="4.5" fill="#0C141C" opacity="0.45" />
        <rect x="18" y="34" width="224" height="90" rx="16" fill="url(#cr-body)" />
        <rect x="18" y="34" width="224" height="30" rx="16" fill="#FFFFFF" opacity="0.05" />
        {/* front bezel carrying the tear-off slot at the bottom edge */}
        <rect x="34" y="92" width="192" height="32" rx="12" fill="#141C24" />
        <rect x="52" y="112" width="156" height="9" rx="4.5" fill="#02070C" />
        <rect x="52" y="112" width="156" height="3" rx="1.5" fill="#000" opacity="0.65" />
        <circle cx="214" cy="78" r="6" className={styles.crLed} />
        <rect x="44" y="72" width="54" height="6" rx="3" fill="#FFFFFF" opacity="0.09" />
      </svg>
    </div>
  )
}

function Bin({ ref, landed }: { ref: React.Ref<HTMLDivElement>; landed: boolean }) {
  return (
    <div className={cn(styles.crBin, landed && styles.crBinLanded)} ref={ref}>
      <svg viewBox="0 0 140 170" className={styles.crBinSvg} aria-hidden="true">
        <ellipse cx="70" cy="162" rx="52" ry="7" fill="#00121D" opacity="0.16" />
        {/* lid lifts when something lands in it */}
        <g className={styles.crBinLid}>
          <rect x="12" y="26" width="116" height="14" rx="7" fill="#37424E" />
          <rect x="56" y="16" width="28" height="10" rx="5" fill="#37424E" />
        </g>
        <path d="M22 44H118L108 156A8 8 0 0 1 100 163H40A8 8 0 0 1 32 156Z" fill="#46525F" />
        <path d="M22 44H70V163H40A8 8 0 0 1 32 156Z" fill="#FFFFFF" opacity="0.06" />
        <path d="M48 60V148M70 60V148M92 60V148" stroke="#00121D" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}
