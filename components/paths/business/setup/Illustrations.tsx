import type { ReactElement } from "react"
import s from "./setup.module.css"

/**
 * The five setup illustrations for §05 "How do I get it?" — line art in one
 * 200x150 box, one stroke weight (set by CSS on the <svg>, so the ink stays
 * the same weight across the five), navy ink (`currentColor` = the running
 * ground's ink), soft tinted fills and orange for the one thing that matters
 * in each step. No brands, no logos, no text.
 *
 * Every piece is a <path> (never <rect>/<circle>) with pathLength=1 so the
 * scene can draw it with stroke-dashoffset:
 *   data-d  a stroke that draws in, in DOM order
 *   data-f  a fill that fades in once the outline is mostly drawn
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
      <F d={circ(x + 10, y + 20, 2.6)} accent />
    </>
  )
}

/** The counter the hardware stands on. */
const COUNTER = "M16 124H184"

/** 01 — the device plugged into power at the counter. */
function PowerUp() {
  return (
    <>
      <F d={rr(142, 26, 42, 84, 8)} />
      <D d={COUNTER} />
      <Device x={28} y={87} />
      {/* the wall outlet: top socket taken by the plug, lower one free */}
      <D d={rr(142, 26, 42, 84, 8)} />
      <D d="M156 82V90M170 82V90" />
      <D d={circ(163, 99, 2.6)} />
      {/* the cable, from the device's end up into the plug */}
      <D d="M111 106C132 106 140 90 163 70" />
      <F d={rr(154, 44, 18, 24, 4)} tone={2} />
      <D d={rr(154, 44, 18, 24, 4)} accent />
      <D d="M160 52V58M166 52V58" accent />
    </>
  )
}

/** Wi-Fi arcs, opening upward from (cx, cy). */
function wifiArc(cx: number, cy: number, r: number) {
  const k = Math.SQRT1_2 * r
  return `M${(cx - k).toFixed(2)} ${(cy - k).toFixed(2)}A${r} ${r} 0 0 1 ${(cx + k).toFixed(2)} ${(cy - k).toFixed(2)}`
}

/** 02 — the device joins the store's Wi-Fi. */
function JoinWifi() {
  return (
    <>
      <D d={COUNTER} />
      <Device x={60} y={87} />
      <F d={circ(104, 72, 3)} accent />
      <D d={wifiArc(104, 72, 13)} accent />
      <D d={wifiArc(104, 72, 25)} accent />
      <D d={wifiArc(104, 72, 37)} accent />
    </>
  )
}

/** 03 — a generic register adds the device as one more network printer. */
function AddPrinter() {
  return (
    <>
      <F d={rr(20, 26, 78, 54, 6)} />
      <F d={circ(124, 48, 12)} tone={2} />
      <D d={COUNTER} />
      {/* the register: a screen on a stand, no brand */}
      <D d={rr(20, 26, 78, 54, 6)} />
      <D d="M59 80V114" />
      <D d={rr(38, 114, 42, 6, 3)} />
      <D d="M29 37H58" />
      <D d={rr(29, 45, 60, 10, 2.5)} />
      {/* the new printer in the list, ticked */}
      <D d={rr(29, 60, 60, 10, 2.5)} accent />
      <D d="M75 65l3 3l6-6" accent />
      <Device x={114} y={87} w={60} />
      {/* over the network, not a cable: a printer badge on the link */}
      <D d="M99 53Q106 48 112 48" accent />
      <D d="M136 50Q150 58 150 84" accent />
      <D d={circ(124, 48, 12)} accent />
      <D d="M119 46V41H129V46M117 46H131V52H117ZM119.5 52V55H128.5V52" />
    </>
  )
}

/** 04 — a test sale: the receipt, and a phone tapped on the device. */
function TestReceipt() {
  const teeth = Array.from({ length: 10 }, (_, i) => `l-4.6 ${i % 2 === 0 ? 4 : -4}`).join("")
  const slip = `M26 22H72V104${teeth}Z`
  return (
    <>
      <F d={slip} />
      <D d={COUNTER} />
      <D d={slip} />
      <D d="M34 34H64M34 44H56M34 52H60M34 60H52" />
      <D d="M34 72H64" />
      <D d="M34 84H64" accent />
      <Device x={94} y={89} w={66} />
      <g transform="rotate(-14 136 62)">
        <F d={rr(118, 28, 36, 64, 7)} tone={2} />
        <D d={rr(118, 28, 36, 64, 7)} />
        <D d="M131 33H141" />
        <D d="M126 46H146M126 54H140M126 62H144" />
        <D d="M126 74H146" accent />
      </g>
      {/* the tap */}
      <D d="M160 80q7 6 0 13" accent />
      <D d="M167 74q13 12 0 25" accent />
    </>
  )
}

/** 05 — hand-over: the dashboard is live. */
function DashboardLive() {
  return (
    <>
      <F d={rr(40, 38, 104, 68, 5)} tone={2} />
      <F d="M26 106H158L150 118H34Z" />
      <F d={circ(160, 38, 15)} tone={2} />
      <D d={COUNTER} />
      <D d={rr(40, 38, 104, 68, 5)} />
      <D d="M26 106H158L150 118H34Z" />
      <D d="M50 50H78" />
      <F d={circ(134, 50, 2.6)} accent />
      <D d={`${rr(50, 58, 24, 13, 2)}${rr(80, 58, 24, 13, 2)}${rr(110, 58, 24, 13, 2)}`} />
      <D d="M50 98H134" />
      <D d="M58 98V88M72 98V84M86 98V89" />
      <D d="M100 98V78" accent />
      <D d="M114 98V86M128 98V82" />
      {/* live: checked */}
      <D d={circ(160, 38, 15)} accent />
      <D d="M153 38l5 5l9-10" accent />
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
