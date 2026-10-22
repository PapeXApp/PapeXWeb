import type { ReactElement } from "react"
import { PlaneMark } from "@/components/brand/plane-mark"
import s from "./setup.module.css"

/**
 * The four setup illustrations for §05 "How do I get it?" — line art in one
 * 200x150 box, one stroke weight (set by CSS on the <svg>, so the ink stays
 * the same weight across the four), navy ink (`currentColor` = the running
 * ground's ink), soft tinted fills and orange for the one thing that matters
 * in each step. No brands and no text; the only logo is our own plane mark,
 * drawn as outline in 01.
 *
 * One HERO OBJECT per step, big and centred, so no two share a silhouette
 * and each reads at the phone overview's ~96px width (Nico, 2026-09-25:
 * "some of them are a little repetitive and hard to understand"):
 *   01 a POS tablet linked to the PapeX plane by a dashed line, a key on it
 *      (the API key that connects them)
 *   02 the PapeX sticker lying flat on the counter (true isometric, the
 *      website art's camera): tap rings, the phone and its waves, the coupon
 *      badge; the register it belongs to, small, behind
 *   03 a phone, tilted, with tap waves and a receipt on its screen
 *   04 a laptop with a live chart
 * (Web 2.2: the box's power / Wi-Fi / add-as-printer steps are gone; there
 * is no hardware to set up.)
 *
 * Every piece is a <path> (never <rect>/<circle>) with pathLength=1 so the
 * scene can draw it with stroke-dashoffset:
 *   data-d  a stroke that draws in, in DOM order
 *   data-f  a fill that fades in once the outline is mostly drawn
 * Fills come before strokes in each drawing so the ink always sits on top.
 * A dashed line is drawn as separate short strokes (a dasharray of its own
 * would fight the draw-in's). Without the pinned scene (reduced motion,
 * short screens, the server render) no dash is set and every drawing is
 * simply complete.
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

/** 01 — connect your POS: the register's tablet, a dashed link with the API
 *  key on it, and the PapeX plane at the other end. */
function ConnectPos() {
  return (
    <>
      <F d={rr(8, 30, 70, 52, 8)} tone={2} />
      <F d={rr(14, 36, 58, 40, 3.5)} />
      <F d={circ(162, 56, 28)} />
      {/* the POS: a tablet on its stand, a sale on its screen */}
      <D d={rr(8, 30, 70, 52, 8)} />
      <D d={rr(14, 36, 58, 40, 3.5)} />
      <D d="M43 82V100" />
      <D d={rr(26, 100, 34, 8, 4)} />
      <D d="M22 46H48M22 55H62M22 64H42" />
      {/* the link: a dash, the key, a dash */}
      <D d="M82 56H86" accent />
      <D d={circ(98, 56, 8)} accent />
      <D d={circ(98, 56, 2.5)} accent />
      <D d="M106 56H126M119 56V62M124 56V60.5" accent />
      <D d="M130 56H133" accent />
      {/* PapeX: the real plane mark, outline only (Nico, 2026-10-21: "just
          the lines no fill so it matches the tone"), centred in its circle.
          It fades in with the fills: its paths are artwork, not draw-in ink. */}
      <D d={circ(162, 56, 28)} />
      <g data-f="" className={s.logoLine} transform="translate(139 42.5)">
        <PlaneMark size={46} />
      </g>
    </>
  )
}

/**
 * The PapeX sticker lying flat, in the true-isometric camera of the
 * website's art (public/product/rds-sticker.webp, from
 * public/_rds-review/sticker-iso.html): a card point (x, y) on its 502 x 426
 * face goes to B + x*U + y*V, B its near corner. A circle of the face
 * becomes an upright ellipse, rx = |(Ux, Vx)| r, ry = |(Uy, Vy)| r (√3:1),
 * and the map keeps orientation (det > 0), so an arc keeps its sweep flag.
 */
const ISO = { bx: 106.4, by: 140, ux: -0.1687, uy: -0.0974, vx: 0.1687, vy: -0.0974 }
const ISO_RX = Math.hypot(ISO.ux, ISO.vx)
const ISO_RY = Math.hypot(ISO.uy, ISO.vy)
/** A card point, as "x y" in the drawing. */
function ip(x: number, y: number) {
  return `${(ISO.bx + x * ISO.ux + y * ISO.vx).toFixed(2)} ${(ISO.by + x * ISO.uy + y * ISO.vy).toFixed(2)}`
}
/** An arc of a card circle of radius r, to the card point (x, y). */
function ia(r: number, sweep: 0 | 1, x: number, y: number) {
  return `A${(r * ISO_RX).toFixed(2)} ${(r * ISO_RY).toFixed(2)} 0 0 ${sweep} ${ip(x, y)}`
}
/** A card circle, as the ellipse it lies as. */
function icirc(cx: number, cy: number, r: number) {
  return `M${ip(cx - r, cy)}${ia(r, 1, cx + r, cy)}${ia(r, 1, cx - r, cy)}Z`
}

/** 02 — get your sticker: the sticker, flat on the counter by its register. */
function GetSticker() {
  // the card's outline, its 22px corners rounded on the face
  const card = `M${ip(22, 0)}L${ip(480, 0)}${ia(22, 1, 502, 22)}L${ip(502, 404)}${ia(22, 1, 480, 426)}L${ip(22, 426)}${ia(22, 1, 0, 404)}L${ip(0, 22)}${ia(22, 1, 22, 0)}Z`
  // the phone in the dial (sticker-iso.html's path, laid flat)
  const phone = `M${ip(266, 158)}L${ip(230, 158)}${ia(16, 0, 214, 174)}L${ip(214, 246)}${ia(16, 0, 230, 262)}L${ip(266, 262)}Z`
  return (
    <>
      <F d={rr(140, 8, 46, 32, 5)} tone={2} />
      <F d={card} />
      <F d={icirc(272, 198, 96)} tone={2} />
      <F d={phone} tone={2} />
      <F d={icirc(334, 274, 30)} accent />
      {/* the sticker */}
      <D d={card} />
      {/* "TAP HERE" and "Collect and Save.", as lines along the face */}
      <D d={`M${ip(440, 70)}L${ip(440, 165)}`} />
      <D d={`M${ip(440, 188)}L${ip(440, 356)}`} accent />
      <D d={`M${ip(118, 108)}L${ip(118, 318)}`} />
      {/* the tap target: two rings, the phone, its waves */}
      <D d={icirc(272, 198, 116)} />
      <D d={icirc(272, 198, 96)} accent />
      <D d={phone} />
      <D d={`M${ip(277, 196)}${ia(16, 1, 277, 224)}`} accent />
      <D d={`M${ip(284, 184)}${ia(30, 1, 284, 236)}`} accent />
      <D d={`M${ip(291.5, 171)}${ia(45, 1, 291.5, 249)}`} accent />
      {/* the coupon badge */}
      <D d={icirc(334, 274, 30)} accent />
      {/* the register it belongs to: small, behind */}
      <D d={rr(140, 8, 46, 32, 5)} />
      <D d={rr(145, 13, 36, 22, 2.5)} />
      <D d="M163 40V51" />
      <D d={rr(151, 51, 24, 5, 2.5)} />
    </>
  )
}

/** 03 — test a receipt: a phone with tap waves and the receipt on its screen. */
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

/** 04 — you're live: the dashboard is live (a laptop, a chart, a live dot). */
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

/** One per step, in content.ts howItWorks.steps order. */
const ART: ReactElement[] = [<ConnectPos key="1" />, <GetSticker key="2" />, <TestReceipt key="3" />, <DashboardLive key="4" />]

/** Decorative: every step's words are in its <h3> and body. */
export function SetupIllustration({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 200 150" className={s.art} aria-hidden="true" focusable="false">
      {ART[index]}
    </svg>
  )
}
