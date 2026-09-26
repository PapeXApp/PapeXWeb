import { cn } from "@/lib/utils"
import s from "./hero.module.css"

/**
 * Line art for the hero's checkout scene (LoopVisual.tsx): the person behind
 * the counter and the customer's hand holding the phone (P3-B6, Nico: "the
 * hand + cashier look crude" -> clean, refined line art).
 *
 * Same language as the §05 setup illustrations (setup/Illustrations.tsx),
 * turned for the navy ground: ONE stroke weight per drawing (set in CSS, see
 * .art* in hero.module.css), rounded caps and joins, solid fills a step or two
 * lighter than the ground, softer ink for inner lines (creases, seams). No
 * orange on the people: the accent is kept for what matters (the tap, the
 * coupon). No faces, no skin tone, no brands.
 *
 * All decorative (aria-hidden): the numbered steps under the scene carry the
 * words.
 */

/**
 * The person behind the counter, in two layers that share one box (viewBox
 * 0 0 400 600; LoopVisual places it so y=500 is the counter's BACK edge and
 * y=600 its front lip; 1 unit = 0.001 of the scene's height):
 *   CashierBody   head, neck, shoulders, arms and apron, standing behind the
 *                 counter (painted before it, so the counter hides the rest)
 *   CashierHands  the forearms lying on the counter top and the hands resting
 *                 on it (painted after the counter)
 */
export function CashierBody({ className, raised = false }: { className?: string; raised?: boolean }) {
  return (
    <svg viewBox="0 0 400 600" className={className} aria-hidden="true" focusable="false">
      {/* neck (runs down under the collar) */}
      <path className={s.artFill} d="M184 240H216V296H184Z" />
      <path className={s.artInk} d="M184 246V278M216 246V278" />
      {/* ears, then the head over them */}
      <path className={s.artFill} d="M153 186C145 184 141 190 142 197C143 205 148 210 155 209Z" />
      <path className={s.artFill} d="M247 186C255 184 259 190 258 197C257 205 252 210 245 209Z" />
      <path
        className={s.artFill}
        d="M200 136C229 136 250 160 250 194C250 230 229 256 200 256C171 256 150 230 150 194C150 160 171 136 200 136Z"
      />
      {/* short hair with a soft fringe */}
      <path
        className={s.artHair}
        d="M151 190C145 154 168 130 200 130C234 130 256 152 251 188C249 178 244 170 236 164C222 170 196 170 178 160C168 166 156 176 151 190Z"
      />
      {/* their left arm (our right), hanging down behind the counter: its own
          shape, so it can fade out when they reach the scanner forward
          (ScannerArm) — never two arms on one side */}
      <g className={cn(s.restHand, raised && s.restHandUp)}>
        <path className={s.artFill} d="M292 300C312 306 321 326 323 350L328 520H290L288 352C288 332 289 314 292 300Z" />
        <path className={s.artInkSoft} d="M290 410C300 412 314 410 325 404" />
      </g>
      {/* shirt: shoulders, the torso and their right arm (our left) in one
          silhouette, down behind the counter */}
      <path
        className={s.artFill}
        d="M178 268C150 272 118 278 100 292C84 304 78 324 77 350L72 520H292C292 460 290 400 288 352C292 330 300 312 300 292C282 278 250 272 222 268C212 290 188 290 178 268Z"
      />
      {/* where the arm meets the body, and its short sleeve's hem */}
      <path className={s.artInk} d="M112 352C110 400 108 460 108 520" />
      <path className={s.artInkSoft} d="M75 404C86 410 100 412 110 410" />
      {/* apron: bib, neck straps, a pocket */}
      <path className={s.artApron} d="M158 322H242L250 520H150Z" />
      <path className={s.artInk} d="M160 323C163 302 172 290 184 284M240 323C237 302 228 290 216 284" />
      <path className={s.artInk} d="M176 430H224V468A6 6 0 0 1 218 474H182A6 6 0 0 1 176 468ZM200 430V474" />
    </svg>
  )
}

export function CashierHands({ className, raised = false }: { className?: string; raised?: boolean }) {
  return (
    <svg viewBox="0 0 400 600" className={className} aria-hidden="true" focusable="false">
      {/* their right arm (our left): forearm on the counter top, hand flat */}
      <path className={s.artFill} d="M73 470C72 500 80 526 98 542L140 540C128 520 114 496 108 470Z" />
      <path
        className={s.artFill}
        d="M98 538C92 552 96 570 110 580C124 590 150 590 162 580C168 572 166 562 158 554C152 546 144 540 138 538Z"
      />
      <path className={s.artInkSoft} d="M122 566L128 584M134 564L142 586M146 560L154 580" />
      {/* their left arm, the mirror image: it lifts off the counter when
          they pick up the scanner (ScannerArm), so it can fade out */}
      <g className={cn(s.restHand, raised && s.restHandUp)}>
        <path className={s.artFill} d="M327 470C328 500 320 526 302 542L260 540C272 520 286 496 292 470Z" />
        <path
          className={s.artFill}
          d="M302 538C308 552 304 570 290 580C276 590 250 590 238 580C232 572 234 562 242 554C248 546 256 540 262 538Z"
        />
        <path className={s.artInkSoft} d="M278 566L272 584M266 564L258 586M254 560L246 580" />
      </g>
    </svg>
  )
}

/**
 * The cashier's left arm (our right) reaching FORWARD over the counter with a
 * handheld barcode scanner, nose towards the customer's phone (P3-B7; redrawn
 * in P3-B9, Nico: "when he lifts his hand and scans the phone, let's make that
 * look a little less 2D, more 3D"). Drawn to read in depth, in the scene's
 * line style:
 *   - the upper arm points at us, so it is short (a short sleeve from the
 *     shoulder, the elbow in front of the body); the forearm rises from the
 *     elbow to the fist ABOVE the PapeX device (never across it)
 *   - the scanner is a small volume, not a flat outline: a lit top face, the
 *     side facing us, and its nose face (the red window) turned towards the
 *     phone; its head flares towards the nose, which is the end nearest us
 * Its own box, in the cashier's units (1 unit = 0.001 of the scene's height):
 * viewBox 240..560 x 180..440 (the scanner's nose runs a little past it:
 * overflow shows), placed by .scanArm; .scanArm turns and scales it about the
 * shoulder (298, 300) as it comes up and forward. The window's centre, (533,
 * 254) before the hand's 1.35x = (561.4, 237.9) in this box, is where the
 * beam (.beam) starts.
 */
export function ScannerArm({ className, done = false }: { className?: string; done?: boolean }) {
  return (
    <svg viewBox="240 180 320 260" className={className} aria-hidden="true" focusable="false">
      {/* the arm: from the sleeve's hem, a short upper arm to the elbow,
          then the forearm rising to the wrist */}
      <path
        className={s.artFill}
        d="M338 312C352 314 362 318 371 323C391 312 413 300 434 292L447 317C427 330 409 344 395 356C387 364 375 370 365 365C357 361 352 353 350 346Z"
      />
      {/* the inside of the elbow */}
      <path className={s.artInkSoft} d="M371 323C374 330 378 336 384 340" />
      {/* the short sleeve, from the shoulder, its hem near the elbow */}
      <path
        className={s.artFill}
        d="M294 292C314 286 332 296 342 311C348 322 352 334 352 347C336 353 314 352 298 346C300 328 299 308 294 292Z"
      />
      <path className={s.artInkSoft} d="M339 314C345 324 349 335 350 346" />
      {/* The hand and the scanner are NEARER to us than the cashier (the arm
          reaches forward), so they are drawn 1.35x the cashier's scale,
          about the fist's centre (452, 300). */}
      <g transform="translate(452 300) scale(1.35) translate(-452 -300)">
        {/* the scanner's grip, down into the fist (behind it), and the trigger */}
        <path className={s.artDevice} d="M450 268L476 272L468 312C467 318 460 321 453 319L446 316C441 314 439 309 441 303Z" />
        <path className={s.artInkSoft} d="M478 279C482 284 482 291 478 296" />
        {/* the scanner's head, a small volume: the top face (lit, seen from
            above), the side facing us, and the nose face with the window */}
        <path className={s.artDeviceTop} d="M437 243L449 226L525 222C532 222 537 226 535 232L527 239Z" />
        <path
          className={s.artDevice}
          d="M436 246C436 241 440 238 445 238L516 236C523 236 528 240 528 246V270C528 276 523 280 516 280L446 272C440 271 436 268 436 263Z"
        />
        <path className={s.artDeviceNose} d="M528 242L535 232V268L528 279Z" />
        <path className={s.artInkSoft} d="M446 249L512 247" />
        <path className={s.scanWindow} d="M529.5 246L533.5 240.5V266.5L529.5 273.5Z" />
        {/* green once the coupon has scanned (a second window over the red
            one, so only its opacity changes) */}
        <path className={cn(s.scanWindowOk, done && s.scanWindowOkOn)} d="M529.5 246L533.5 240.5V266.5L529.5 273.5Z" />
        {/* the fist round the grip: curled fingers, a thumb over the top */}
        <path
          className={s.artFill}
          d="M436 290C441 281 459 279 469 287C477 295 476 310 468 318C460 326 444 326 436 318C430 312 430 298 436 290Z"
        />
        <path className={s.artInkSoft} d="M440 299C448 297 458 298 468 301M440 310C448 308 458 309 466 312" />
        <path className={s.artFill} d="M444 287C448 277 458 273 467 277C472 281 470 287 463 291Z" />
      </g>
    </svg>
  )
}

/**
 * The customer's right hand, holding the phone with the screen towards us.
 * Both halves are drawn in the PHONE FRAME's own box (viewBox 0 0 100 206.3 =
 * the iPhone frame's 0.4847 aspect, see customer/iphone.module.css), so they
 * scale and turn with the phone (the frame's 100 units are a ~72mm-wide
 * iPhone, so a finger is ~18-22 units thick, the wrist ~60).
 *
 * P3-B7 (Nico: "the hand holding it has a flat line. That should be more
 * curved to make it look more like a hand"): no straight edge anywhere. Every
 * contour is a curve — the palm's heel, the ball of the thumb, the wrist, the
 * cuff and the sleeve's folds — and the four fingers are four separate,
 * rounded fingers, each bending round the phone's left edge (a rounded middle
 * knuckle behind, a rounded fingertip on the bezel, a nail), stepping in and
 * getting shorter towards the little finger.
 *   HandBack   behind the phone: the palm (its heel shows under the phone,
 *              the ball of the thumb right of it), the wrist, a cuff and the
 *              sleeve, which widens as it leaves the scene down and right
 *   HandFront  in front of it: the four fingers and the thumb, which rises
 *              along the right edge with its tip on the bezel
 */
export function HandBack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 206.3"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* sleeve: soft, slightly bowed sides and a rounded end */}
      <path
        className={s.artSleeve}
        d="M31 256C27 312 31 392 38 470C76 494 132 494 172 470C160 400 138 328 108 250C84 264 54 266 31 256Z"
      />
      <path className={s.artInkSoft} d="M58 292C66 344 70 396 72 450M104 290C118 332 128 376 134 420" />
      {/* palm: the heel under the phone, the ball of the thumb to its right */}
      <path
        className={s.artFill}
        d="M6 126C34 116 72 118 97 131C112 139 122 154 123.5 172C125 190 119 207 109 219C102 228 99 237 99 246C81 255 59 256 41 250C27 243 13 232 4 218C-3 207 -8 196 -8 184C-8 160 -4 138 6 126Z"
      />
      {/* the heel's crease */}
      <path className={s.artInkSoft} d="M24 222C37 232 55 237 76 235" />
      {/* cuff: a curved band round the wrist */}
      <path
        className={s.artCuff}
        d="M35 246C57 256 83 256 101 244C104 250 106 256 107 263C86 276 56 277 33 266C33 259 34 252 35 246Z"
      />
    </svg>
  )
}

/** One finger bending round the phone's left edge: top edge out to the
 *  rounded tip on the bezel (x = tip), back along the underside to the
 *  rounded middle knuckle at x = knuckle. `y` is its top, `h` its thickness. */
function finger(y: number, h: number, tip: number, knuckle: number): string {
  const r = (n: number) => Math.round(n * 10) / 10
  return [
    `M${r(knuckle + 8)} ${r(y + 1)}`,
    `C${r(knuckle + 16)} ${r(y - 1)} ${r(tip - 6)} ${r(y - 0.5)} ${r(tip - 1)} ${r(y + h * 0.18)}`,
    `C${r(tip + 2.5)} ${r(y + h * 0.36)} ${r(tip + 2.5)} ${r(y + h * 0.7)} ${r(tip - 1.5)} ${r(y + h * 0.9)}`,
    `C${r(tip - 5)} ${r(y + h * 1.04)} ${r(knuckle + 16)} ${r(y + h * 1.06)} ${r(knuckle + 7)} ${r(y + h * 0.98)}`,
    `C${r(knuckle - 1)} ${r(y + h * 0.92)} ${r(knuckle - 2.5)} ${r(y + h * 0.66)} ${r(knuckle - 1.5)} ${r(y + h * 0.44)}`,
    `C${r(knuckle - 0.5)} ${r(y + h * 0.18)} ${r(knuckle + 3)} ${r(y + h * 0.04)} ${r(knuckle + 8)} ${r(y + 1)}Z`,
  ].join("")
}
/** The nail on a fingertip: a short arc just inside the tip. */
function nail(y: number, h: number, tip: number): string {
  const r = (n: number) => Math.round(n * 10) / 10
  return `M${r(tip - 5)} ${r(y + h * 0.26)}C${r(tip - 1.5)} ${r(y + h * 0.34)} ${r(tip - 1.5)} ${r(y + h * 0.66)} ${r(tip - 5)} ${r(y + h * 0.74)}`
}
/** Index, middle, ring, little: [top, thickness, tip x, knuckle x]. The
 *  little finger is drawn first so each finger above overlaps the next. */
const FINGERS: [number, number, number, number][] = [
  [108, 21, 9, -17],
  [128, 21, 10, -18],
  [148, 19.5, 9, -16.5],
  [166, 17, 6.5, -13],
]

export function HandFront({ className }: { className?: string }) {
  const drawOrder = [...FINGERS].reverse()
  return (
    <svg
      viewBox="0 0 100 206.3"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {drawOrder.map(([y, h, tip, knuckle]) => (
        <g key={y}>
          <path className={s.artFill} d={finger(y, h, tip, knuckle)} />
          <path className={s.artInkSoft} d={nail(y, h, tip)} />
        </g>
      ))}
      {/* the thumb, up along the right edge; its base is open (it grows out of
          the ball of the thumb behind the phone), so the fill and the outline
          are two paths */}
      <path
        className={s.artFillOnly}
        d="M123 200C124.5 181 120 162 112 148C107 139 101 132 95.5 129.5C89.5 127 84.5 131.5 85.5 138.5C86.5 147 91 157 94 168C97 180 97.5 194 96.5 207C104 212 116 210 123 200Z"
      />
      <path
        className={s.artInk}
        d="M123 200C124.5 181 120 162 112 148C107 139 101 132 95.5 129.5C89.5 127 84.5 131.5 85.5 138.5C86.5 147 91 157 94 168C97 180 97.5 194 96.5 207"
      />
      {/* thumbnail, and the crease at the thumb's joint */}
      <path className={s.artInkSoft} d="M88 136C89.5 131.5 94 131 97 134" />
      <path className={s.artInkSoft} d="M93 160C98 157.5 104 157.5 109 160" />
    </svg>
  )
}

export function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        d="m6 12.4 4 4 8-8.8"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
