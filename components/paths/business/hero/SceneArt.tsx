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
export function CashierBody({ className }: { className?: string }) {
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
      {/* shirt: shoulders and both arms in one silhouette, down behind the counter */}
      <path
        className={s.artFill}
        d="M178 268C150 272 118 278 100 292C84 304 78 324 77 350L72 520H328L323 350C322 324 316 304 300 292C282 278 250 272 222 268C212 290 188 290 178 268Z"
      />
      {/* where the arms meet the body, and the short sleeves' hems */}
      <path className={s.artInk} d="M112 352C110 400 108 460 108 520M288 352C290 400 292 460 292 520" />
      <path className={s.artInkSoft} d="M75 404C86 410 100 412 110 410M290 410C300 412 314 410 325 404" />
      {/* apron: bib, neck straps, a pocket */}
      <path className={s.artApron} d="M158 322H242L250 520H150Z" />
      <path className={s.artInk} d="M160 323C163 302 172 290 184 284M240 323C237 302 228 290 216 284" />
      <path className={s.artInk} d="M176 430H224V468A6 6 0 0 1 218 474H182A6 6 0 0 1 176 468ZM200 430V474" />
    </svg>
  )
}

export function CashierHands({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 600" className={className} aria-hidden="true" focusable="false">
      {/* their right arm (our left): forearm on the counter top, hand flat */}
      <path className={s.artFill} d="M73 470C72 500 80 526 98 542L140 540C128 520 114 496 108 470Z" />
      <path
        className={s.artFill}
        d="M98 538C92 552 96 570 110 580C124 590 150 590 162 580C168 572 166 562 158 554C152 546 144 540 138 538Z"
      />
      <path className={s.artInkSoft} d="M122 566L128 584M134 564L142 586M146 560L154 580" />
      {/* their left arm, the mirror image */}
      <path className={s.artFill} d="M327 470C328 500 320 526 302 542L260 540C272 520 286 496 292 470Z" />
      <path
        className={s.artFill}
        d="M302 538C308 552 304 570 290 580C276 590 250 590 238 580C232 572 234 562 242 554C248 546 256 540 262 538Z"
      />
      <path className={s.artInkSoft} d="M278 566L272 584M266 564L258 586M254 560L246 580" />
    </svg>
  )
}

/**
 * The customer's right hand, holding the phone with the screen towards us.
 * Both halves are drawn in the PHONE FRAME's own box (viewBox 0 0 100 206.3 =
 * the iPhone frame's 0.4847 aspect, see customer/iphone.module.css), so they
 * scale and turn with the phone (proportions: the frame's 100 units are a
 * ~72mm-wide iPhone, so a finger is ~22 units, the wrist ~66):
 *   HandBack   behind the phone: the palm (only its heel shows, under the
 *              phone), the knuckles behind the left edge, the ball of the
 *              thumb right of it, the wrist, a cuff and the sleeve, which
 *              widens gently as it leaves the scene down and to the right
 *   HandFront  in front of it: the four fingers curling round the left edge
 *              onto the bezel, and the thumb along the right edge
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
      <path className={s.artSleeve} d="M22 262C26 330 28 400 32 480H162C152 400 134 330 108 256Z" />
      <path
        className={s.artFill}
        d="M30 252C18 238 6 222 -4 204C-12 194 -17 188 -19 180L-10 95H60L100 128C110 140 118 156 120 176C122 200 114 222 100 240C97 244 96 248 96 252Z"
      />
      <path className={s.artCuff} d="M24 244C48 254 82 252 102 242L107 260C84 272 46 274 22 264Z" />
    </svg>
  )
}

export function HandFront({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 206.3"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* the four fingers: one outline, the tips curled onto the bezel */}
      <path
        className={s.artFill}
        d="M-19 187C-22 170 -22 120 -19 104C-18 98 -14 95 -9 95H2C7 95 10 101 10 107.5C10 114 7 120 2 120C8 120 11 126 11 132C11 138 8 144 2 144C7 144 10 150 10 155.5C10 161 7 167 2 167C6 167 8 172 8 177C8 182 5 187 0 187Z"
      />
      <path className={s.artInkSoft} d="M2 120H-12M2 144H-13M2 167H-12" />
      {/* the thumb, up along the right edge; its base is open (it grows out of
          the ball of the thumb behind the phone), so the fill and the outline
          are two paths */}
      <path
        className={s.artFillOnly}
        d="M122 214C122 192 116 170 108 154C104 146 99 139 94 137C88 135 84 140 85 147C86 156 91 166 94 178C97 190 98 202 97 214Z"
      />
      <path
        className={s.artInk}
        d="M121 206C120 188 115 168 108 154C104 146 99 139 94 137C88 135 84 140 85 147C86 156 91 166 94 178C97 190 98 200 98 208"
      />
      <path className={s.artInkSoft} d="M91 158C96 156 101 156 106 158" />
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
