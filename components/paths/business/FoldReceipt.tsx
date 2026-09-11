"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { PlaneMark } from "@/components/brand/plane-mark"
import { whyMerchants } from "./content"
import styles from "./business.module.css"

/**
 * 3.2's four reasons, delivered the way a merchant gets them today: printed.
 *
 * A thermal printer feeds out a full-height receipt whose line items ARE the
 * four claims ($0 / 1 port / 1 tap / 0 rolls — the amount column of a receipt
 * is exactly the shape of those numbers). Then one tap folds it away: four
 * creases, a fold in half, and the paper becomes the PapeX plane and flies
 * into the bin.
 *
 * It replaces a drag-to-crumple that read as a scribble. Folding is the better
 * verb for the same point (paper leaves, nothing is lost) and it lands on the
 * brand mark instead of a wad, so the section's last frame is the logo.
 *
 * The receipt IS the section's content — there is no card grid under it. That
 * has one consequence worth stating: the claims have to be in the server HTML,
 * and they have to survive a visitor who never plays. So the slip renders
 * complete on the server (every block visible) and the client rewinds it to an
 * empty slot on mount before starting the feed. Reduced motion never rewinds
 * it: it gets the finished slip, no printer, no prompt, nothing to fold.
 */

/** The slip prints in beats, not as one reveal: head, the four claims, foot. */
const PRINT_BLOCKS = 6
const BLOCK_MS = 430
/** Four creases, then the fold in half. One beat each. */
const FOLD_STEPS = 5
const FOLD_MS = 260
/** The dart opens out into the plane: the one tweened beat in the sequence. */
const SNAP_MS = 320
const FLY_MS = 980

type Phase = "idle" | "printing" | "ready" | "folding" | "planing" | "flying" | "done"

/**
 * The paper's silhouette AFTER each fold, in its own 0-100 box, plus the
 * creases that fold leaves behind and how much of the print is still showing.
 *
 * The clip-path SNAPS and the transform tweens. Paper creases in jumps — the
 * smooth part of a fold is the flick of the hand, not the crease — which is
 * the same reasoning the crumple this replaces used for its stepped filters,
 * and it is why `transition` below lists `transform` and nothing else.
 *
 * `sy` is an EXTRA vertical squash on top of `sx`, because folding a long slip
 * shortens it as well as narrowing it; a strip that only narrows reads as a
 * strip being trimmed.
 */
type FoldState = {
  clip: string
  sx: number
  sy: number
  tilt: number
  ink: number
  creases: [number, number, number, number][]
  /** Where the paper now lies on itself. Doubled paper is what reads as a fold:
      a crease line alone just looks like a line drawn on a sheet. */
  shades: [number, number][][]
}

const FOLD_STATES: FoldState[] = [
  // 0 — flat: the printed slip, torn edge and all (that clip lives on .frSheet)
  { clip: "", sx: 1, sy: 1, tilt: 0, ink: 1, creases: [], shades: [] },
  // 1 — top corners in to the centre line: the slip gets a nose
  {
    clip: "polygon(50% 0, 100% 13%, 100% 100%, 0 100%, 0 13%)",
    sx: 0.97,
    sy: 0.95,
    tilt: -2,
    ink: 0.75,
    creases: [
      [50, 0, 0, 13],
      [50, 0, 100, 13],
    ],
    shades: [
      [[50, 0], [0, 13], [50, 26]],
      [[50, 0], [100, 13], [50, 26]],
    ],
  },
  // 2 — the long edges fold in to meet the middle
  {
    clip: "polygon(50% 0, 86% 17%, 82% 100%, 18% 100%, 14% 17%)",
    sx: 0.94,
    sy: 0.88,
    tilt: 2,
    ink: 0.4,
    creases: [
      [50, 0, 14, 17],
      [50, 0, 86, 17],
    ],
    shades: [
      [[50, 0], [14, 17], [50, 34]],
      [[50, 0], [86, 17], [50, 34]],
    ],
  },
  // 3 — again, and the spine appears where it will fold in half
  {
    clip: "polygon(50% 0, 74% 24%, 70% 100%, 30% 100%, 26% 24%)",
    sx: 0.9,
    sy: 0.78,
    tilt: -3,
    ink: 0.12,
    creases: [
      [50, 0, 26, 24],
      [50, 0, 74, 24],
      [50, 5, 50, 100],
    ],
    shades: [
      [[50, 0], [26, 24], [50, 48]],
      [[50, 0], [74, 24], [50, 48]],
    ],
  },
  // 4 — the dart body, long and thin
  {
    clip: "polygon(50% 0, 66% 31%, 62% 100%, 38% 100%, 34% 31%)",
    sx: 0.87,
    sy: 0.68,
    tilt: 3,
    ink: 0,
    creases: [
      [50, 0, 34, 31],
      [50, 0, 66, 31],
      [50, 3, 50, 100],
    ],
    shades: [
      [[50, 0], [34, 31], [50, 62]],
      [[50, 0], [66, 31], [50, 62]],
    ],
  },
  // 5 — folded in half along the spine: one keel, seen edge on. Every layer is
  // stacked now, so the whole silhouette is doubled paper.
  {
    clip: "polygon(50% 0, 66% 31%, 62% 100%, 50% 100%)",
    sx: 0.85,
    sy: 0.6,
    tilt: 0,
    ink: 0,
    creases: [[50, 0, 50, 100]],
    shades: [[[50, 0], [66, 31], [62, 100], [50, 100]]],
  },
]

export function FoldReceipt() {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  // Starts complete so the server renders every claim; the client rewinds it.
  const [blocks, setBlocks] = useState(PRINT_BLOCKS)
  const [fold, setFold] = useState(0)

  const stageRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const binRef = useRef<HTMLDivElement>(null)
  const flyTo = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Rewind to an empty slot so the feed has something to do. Reduced motion
  // keeps the finished slip exactly as the server sent it.
  useEffect(() => {
    if (reduced) {
      setPhase("ready")
      return
    }
    setBlocks(0)
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
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [phase, reduced])

  // One block per beat. The slip's own height is what grows, so the paper
  // genuinely feeds out of the slot instead of being unmasked in place.
  useEffect(() => {
    if (phase !== "printing") return
    if (blocks >= PRINT_BLOCKS) {
      const t = window.setTimeout(() => setPhase("ready"), 420)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setBlocks((n) => n + 1), BLOCK_MS)
    return () => window.clearTimeout(t)
  }, [phase, blocks])

  // One crease per beat, then hand over to the plane.
  useEffect(() => {
    if (phase !== "folding") return
    if (fold >= FOLD_STEPS) {
      const t = window.setTimeout(() => setPhase("planing"), FOLD_MS)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setFold((n) => n + 1), FOLD_MS)
    return () => window.clearTimeout(t)
  }, [phase, fold])

  /** Where the plane has to land, measured rather than guessed. */
  const aimAtBin = useCallback(() => {
    const paper = paperRef.current?.getBoundingClientRect()
    const bin = binRef.current?.getBoundingClientRect()
    if (!paper || !bin) return
    flyTo.current = {
      x: bin.left + bin.width / 2 - (paper.left + paper.width / 2),
      // into the mouth, not the middle of the can
      y: bin.top + bin.height * 0.26 - (paper.top + paper.height / 2),
    }
  }, [])

  useEffect(() => {
    if (phase !== "planing") return
    const t = window.setTimeout(() => {
      aimAtBin()
      setPhase("flying")
    }, SNAP_MS)
    return () => window.clearTimeout(t)
  }, [phase, aimAtBin])

  useEffect(() => {
    if (phase !== "flying") return
    const t = window.setTimeout(() => setPhase("done"), FLY_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  const planing = phase === "planing" || phase === "flying"
  const showPaper = phase !== "done"
  // The dart HOLDS its last silhouette while the plane crosses over it. Clearing
  // the clip-path here instead would un-fold the paper back to a full rectangle
  // for one beat, which is exactly what the sequence is trying not to look like.
  const shape = FOLD_STATES[Math.min(fold, FOLD_STATES.length - 1)]
  const shown = (i: number) => i < blocks

  return (
    <div className={styles.frStage} ref={stageRef}>
      <div className={cn(styles.frScene, phase === "done" && styles.frSceneDone)}>
        <span aria-hidden="true" className={styles.frGround} />
        <Printer printing={phase === "printing"} />

        {showPaper && (
          <div
            ref={paperRef}
            className={cn(styles.frPaper, phase === "flying" && styles.frPaperFlown)}
            style={
              {
                "--fold-ms": `${FOLD_MS}ms`,
                "--snap-ms": `${SNAP_MS}ms`,
                "--fold-sx": shape.sx,
                "--fold-sy": shape.sy,
                "--fold-tilt": `${shape.tilt}deg`,
                "--ink": shape.ink,
                "--tx": `${flyTo.current.x}px`,
                "--ty": `${flyTo.current.y}px`,
                "--fly-ms": `${FLY_MS}ms`,
              } as CSSProperties
            }
          >
            {/* The fold box carries the silhouette and the creases; the plane is
                its sibling, not its child, so clipping the paper never clips the
                wings off the mark that replaces it. */}
            <div
              className={cn(styles.frFold, planing && styles.frFoldGone)}
              style={{ clipPath: shape.clip || undefined }}
            >
              <div className={styles.frSheet}>
                <div className={styles.frInk}>
                  {shown(0) && (
                    <div className={styles.frBlock}>
                      <div className={styles.frSlipHead}>PAPEX</div>
                      <div className={styles.frRule} />
                      <div className={styles.frSlipSub}>REASONS TO SWITCH</div>
                    </div>
                  )}

                  {whyMerchants.cards.map((card, i) =>
                    shown(i + 1) ? (
                      <div key={card.value} className={cn(styles.frBlock, styles.frItem)}>
                        <span className={styles.frItemLabel}>{card.title}</span>
                        <span className={styles.frItemValue}>{card.value}</span>
                      </div>
                    ) : null,
                  )}

                  {shown(5) && (
                    <div className={styles.frBlock}>
                      <div className={styles.frRule} />
                      <div className={cn(styles.frItem, styles.frTotal)}>
                        <span>TOTAL</span>
                        <span>4</span>
                      </div>
                      <div className={styles.frSlipFoot}>NONE TO SAY NO</div>
                      <div aria-hidden="true" className={styles.frBarcode} />
                    </div>
                  )}
                </div>
              </div>

              {/* drawn in the fold box's own coordinates, so every crease lands
                  exactly on a clip-path edge rather than near one */}
              <svg
                aria-hidden="true"
                className={styles.frCreases}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                focusable="false"
              >
                {shape.shades.map((pts) => (
                  <polygon key={pts.flat().join("-")} points={pts.map(([x, y]) => `${x},${y}`).join(" ")} />
                ))}
                {shape.creases.map(([x1, y1, x2, y2]) => (
                  <line
                    key={`${x1}-${y1}-${x2}-${y2}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            </div>

            {planing && (
              <PlaneMark
                className={styles.frPlane}
                body="#FDFDFB"
                lines="rgba(27, 36, 46, 0.34)"
                size={100}
              />
            )}
          </div>
        )}

        <Bin ref={binRef} landed={phase === "done"} />
      </div>

      {!reduced && (
        <div className={styles.frPrompt}>
          <button
            type="button"
            className={styles.frButton}
            onClick={() => setPhase("folding")}
            disabled={phase !== "ready"}
            hidden={phase === "done"}
          >
            Fold it away
          </button>
          <span className={styles.frHint}>
            {phase === "printing" && "Printing your reasons…"}
            {phase === "ready" && "One tap and the paper is gone"}
            {(phase === "folding" || phase === "planing" || phase === "flying") && "Folding…"}
            {phase === "done" && "That is the switch. No more paper."}
          </span>
        </div>
      )}
    </div>
  )
}

function Printer({ printing }: { printing: boolean }) {
  return (
    <div className={cn(styles.frPrinter, printing && styles.frPrinterBusy)}>
      <svg viewBox="0 0 260 150" className={styles.frPrinterSvg} aria-hidden="true">
        <defs>
          <linearGradient id="fr-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A4753" />
            <stop offset="1" stopColor="#1B242E" />
          </linearGradient>
          <linearGradient id="fr-lid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#55636F" />
            <stop offset="1" stopColor="#2C3742" />
          </linearGradient>
        </defs>
        <ellipse cx="130" cy="132" rx="106" ry="9" fill="#00121D" opacity="0.14" />
        {/* paper roll hump on top, then the body, then the front bezel */}
        <rect x="48" y="6" width="164" height="34" rx="17" fill="url(#fr-lid)" />
        <rect x="70" y="14" width="120" height="9" rx="4.5" fill="#0C141C" opacity="0.45" />
        <rect x="18" y="34" width="224" height="90" rx="16" fill="url(#fr-body)" />
        <rect x="18" y="34" width="224" height="30" rx="16" fill="#FFFFFF" opacity="0.05" />
        {/* front bezel carrying the tear-off slot at the bottom edge */}
        <rect x="34" y="92" width="192" height="32" rx="12" fill="#141C24" />
        <rect x="52" y="112" width="156" height="9" rx="4.5" fill="#02070C" />
        <rect x="52" y="112" width="156" height="3" rx="1.5" fill="#000" opacity="0.65" />
        <circle cx="214" cy="78" r="6" className={styles.frLed} />
        <rect x="44" y="72" width="54" height="6" rx="3" fill="#FFFFFF" opacity="0.09" />
      </svg>
    </div>
  )
}

function Bin({ ref, landed }: { ref: React.Ref<HTMLDivElement>; landed: boolean }) {
  return (
    <div className={cn(styles.frBin, landed && styles.frBinLanded)} ref={ref}>
      <svg viewBox="0 0 140 170" className={styles.frBinSvg} aria-hidden="true">
        <ellipse cx="70" cy="162" rx="52" ry="7" fill="#00121D" opacity="0.16" />
        <g className={styles.frBinLid}>
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
