import type { ReactElement } from "react"
import s from "./setup.module.css"

/**
 * The five setup illustrations for §05 "How do I get it?" — line art in one
 * 200x150 box, one stroke weight (set by CSS on the <svg>, so the ink stays
 * the same weight across the five), navy ink (`currentColor` = the running
 * ground's ink), soft tinted fills and orange for the one thing that matters
 * in each step. No brands, no logos, no text.
 *
 * One HERO OBJECT per step, big and centred, so no two share a silhouette
 * and each reads at the phone overview's ~96px width (Nico, 2026-09-25:
 * "some of them are a little repetitive and hard to understand"):
 *   01 a power plug, prongs up, bolt on its face, cable to a small device
 *   02 a big Wi-Fi fan landing on a small device
 *   03 a POS tablet on its stand, showing a Printers list with the new row
 *   04 a phone, tilted, with tap waves and a receipt on its screen
 *   05 a laptop with a live chart
 *
 * Every piece is a <path> (never <rect>/<circle>) with pathLength=1 so the
 * scene can draw it with stroke-dashoffset:
 *   data-d  a stroke that draws in, in DOM order
 *   data-f  a fill that fades in once the outline is mostly drawn
 * Fills come before strokes in each drawing so the ink always sits on top.
 * Without the pinned scene (reduced motion, short screens, the server
 * render) no dash is set and every drawing is simply complete.
 */

/** Rounded-rectangle outline as a path. */
function rr(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
}

/** Circle as a path. */
function circ(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
}

/**
 * An open arc of radius `r` around (cx, cy), centred on direction `deg`
 * (0 = right, 90 = up, 180 = left) and `span` degrees wide.
 */
function arc(cx: number, cy: number, r: number, deg: number, span = 90) {
  const rad = (a: number) => (a * Math.PI) / 180
  const a0 = rad(deg + span / 2)
  const a1 = rad(deg - span / 2)
  const p = (a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy - r * Math.sin(a)).toFixed(2)}`
  return `M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}`
}

/** Ink stroke that draws in. */
function D({ d, accent }: { d: string; accent?: boolean }) {
  return <path data-d="" pathLength={1} d={d} className={accent ? s.acc : undefined} />
}

/** Soft fill that fades in (`tone` 2 is the lighter top face). */
function F({ d, tone = 1, accent }: { d: string; tone?: 1 | 2; accent?: boolean }) {
  return <path data-f="" d={d} className={accent ? s.accFill : tone === 2 ? s.soft2 : s.soft} />
}

/**
 * The PapeX device, drawn from the same three-quarter box as
 * public/product/rdh-device.svg: a top face, a front face and a right side,
 * with the status light on the front. `x, y` is the top face's back-left.
 * Only ever a supporting actor here (small, off to the side); the hero of
 * each step is something else.
 */
function Device({ x, y, w = 74 }: { x: number; y: number; w?: number }) {
  const top = `M${x} ${y + 9}L${x + 9} ${y}H${x + w + 9}L${x + w} ${y + 9}Z`
  const side = `M${x + w} ${y + 9}L${x + w + 9} ${y}V${y + 21}L${x + w} ${y + 31}Z`
  const front = rr(x, y + 9, w, 22, 3)
  return (
    <>
      <F d={top} tone={2} />
      <F d={front} />
      <F d={side} />
      <D d={front} />
      <D d={top} />
      <D d={side} />
      <D d={`M${x + w * 0.34} ${y + 4.5}H${x + w * 0.66}`} />
      <F d={circ(x + 10, y + 20, 3)} accent />
    </>
  )
}

/** 01 — power it up: the plug is the hero (prongs up, a bolt on its face), its cable runs to the device. */
function PowerUp() {
  const head = "M87 34H129A5 5 0 0 1 134 39V58C134 68 128 74 120 78V90H96V78C88 74 82 68 82 58V39A5 5 0 0 1 87 34Z"
  const bolt = "M113 39L100 58H109L104 73L119 52H110L117 39Z"
  return (
    <>
      <F d={head} />
      <Device x={14} y={104} w={40} />
      {/* the cable, from the device's end up into the plug */}
      <D d="M60 121C92 124 108 118 108 90" />
      {/* the plug */}
      <D d={rr(95, 12, 7, 22, 3.5)} />
      <D d={rr(114, 12, 7, 22, 3.5)} />
      <D d={head} accent />
      <D d="M96 84H120" accent />
      <F d={bolt} accent />
      <D d={bolt} accent />
    </>
  )
}

/** 02 — join the Wi-Fi: a big Wi-Fi fan whose dot lands on the (small) device. */
function JoinWifi() {
  const cx = 100
  const cy = 100
  return (
    <>
      <Device x={77} y={112} w={46} />
      <F d={circ(cx, cy, 5.5)} accent />
      <D d={arc(cx, cy, 22, 90)} accent />
      <D d={arc(cx, cy, 44, 90)} accent />
      <D d={arc(cx, cy, 66, 90)} accent />
    </>
  )
}

/** A small printer glyph, 14 wide, 13 tall, from its top-left (x, y). */
function printerGlyph(x: number, y: number) {
  return `M${x + 3} ${y + 3}V${y}H${x + 11}V${y + 3}${rr(x, y + 3, 14, 7, 1.5)}M${x + 3} ${y + 10}V${y + 13}H${x + 11}V${y + 10}`
}

/** 03 — add it as a printer: the register's Printers list, the new row being added. */
function AddPrinter() {
  return (
    <>
      <F d={rr(28, 10, 144, 100, 10)} tone={2} />
      <F d={rr(36, 18, 128, 84, 4)} />
      <F d={rr(44, 76, 112, 22, 5)} tone={2} />
      {/* the tablet on its stand */}
      <D d={rr(28, 10, 144, 100, 10)} />
      <D d={rr(36, 18, 128, 84, 4)} />
      <D d="M100 110V126" />
      <D d={rr(68, 126, 64, 8, 4)} />
      {/* the list header: printer icon + title */}
      <D d={printerGlyph(44, 25)} />
      <D d="M66 32H102" />
      {/* the printer that was already there */}
      <D d={rr(44, 46, 112, 22, 5)} />
      <D d={printerGlyph(51, 50)} />
      <D d="M73 57H116" />
      <D d="M144 53l4 4l-4 4" />
      {/* the new one: the PapeX device, being added */}
      <D d={rr(44, 76, 112, 22, 5)} accent />
      <D d={rr(51, 82, 14, 10, 2)} />
      <D d="M73 87H108" />
      <D d={circ(145, 87, 6.5)} accent />
      <D d="M141.5 87H148.5M145 83.5V90.5" accent />
    </>
  )
}

/** 04 — test a receipt: a phone with tap waves and the receipt on its screen. */
function TestReceipt() {
  const teeth = Array.from({ length: 8 }, (_, i) => `l-5 ${i % 2 === 0 ? 4 : -4}`).join("")
  const slip = `M88 34H128V104${teeth}Z`
  return (
    <>
      <g transform="rotate(-9 108 74)">
        <F d={rr(76, 10, 64, 128, 12)} tone={2} />
        <F d={slip} />
        <D d={rr(76, 10, 64, 128, 12)} />
        <D d={rr(99, 17, 18, 5, 2.5)} />
        {/* the receipt, landed on the phone */}
        <D d={slip} />
        <D d="M95 46H121" />
        <D d="M95 58H113M95 67H117M95 76H109" />
        <D d="M95 90H121" accent />
      </g>
      {/* the tap */}
      <D d={arc(72, 64, 12, 180, 84)} accent />
      <D d={arc(72, 64, 25, 180, 84)} accent />
      <D d={arc(72, 64, 38, 180, 84)} accent />
    </>
  )
}

/** 05 — hand-over: the dashboard is live (a laptop, a chart, a live dot). */
function DashboardLive() {
  const chart = "M52 82L70 72L86 76L104 58L120 64L140 42"
  return (
    <>
      <F d={rr(38, 16, 124, 84, 6)} tone={2} />
      <F d="M22 100H178L170 114H30Z" />
      <F d={`${chart}V88H52Z`} />
      {/* the laptop */}
      <D d={rr(38, 16, 124, 84, 6)} />
      <D d="M22 100H178L170 114H30Z" />
      <D d="M88 100V104H112V100" />
      {/* the dashboard: a title bar and a chart */}
      <D d="M50 29H80" />
      <D d="M50 88H150" />
      <D d={chart} />
      {/* live */}
      <D d={circ(140, 42, 9)} accent />
      <F d={circ(140, 42, 4)} accent />
    </>
  )
}

const ART: ReactElement[] = [<PowerUp key="1" />, <JoinWifi key="2" />, <AddPrinter key="3" />, <TestReceipt key="4" />, <DashboardLive key="5" />]

/** Decorative: every step's words are in its <h3> and body. */
export function SetupIllustration({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 200 150" className={s.art} aria-hidden="true" focusable="false">
      {ART[index]}
    </svg>
  )
}
