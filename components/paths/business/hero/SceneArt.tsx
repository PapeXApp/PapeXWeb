import s from "./hero.module.css"

/**
 * Line art for the hero's checkout scene (LoopVisual.tsx): the person behind
 * the counter and the customer's hand. Same language as the setup
 * illustrations (setup/Illustrations.tsx) turned for the navy ground: an
 * off-white outline, a solid fill a step lighter than the ground, orange only
 * for the one thing that matters. No faces, no skin tone, no brands.
 *
 * All decorative (aria-hidden): the numbered steps under the scene carry the
 * words.
 */

/** The person behind the counter: a head and shoulders, an apron with an
 *  orange strap. Drawn to stand behind the counter, whose top edge is at
 *  y=112 of this 120x130 box, so the counter hides the rest. */
export function Cashier({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true" focusable="false">
      {/* torso: shoulders out to the sides, running down behind the counter */}
      <path
        className={s.inkFill}
        d="M14 130V84C14 68 26 58 42 55L52 53H68L78 55C94 58 106 68 106 84V130Z"
      />
      {/* neck */}
      <path className={s.inkFill} d="M52 53V44H68V53C64 57 56 57 52 53Z" />
      {/* head */}
      <path className={s.inkFill} d="M60 8C72 8 80 17 80 29C80 41 72 48 60 48C48 48 40 41 40 29C40 17 48 8 60 8Z" />
      {/* hair line, so the head reads as a head from the front */}
      <path className={s.inkLine} d="M41 25C45 14 56 10 66 12C73 14 78 19 79 26" />
      {/* apron: bib and straps, in the accent */}
      <path className={s.accFill} d="M44 84H76V130H44Z" />
      <path className={s.accLine} d="M44 84L40 58M76 84L80 58" />
      <path className={s.accLine} d="M44 84H76V130M44 84V130" />
    </svg>
  )
}

/**
 * The customer's right hand, holding the phone with the screen towards us.
 * Both halves are drawn in the PHONE FRAME's own box (viewBox 0 0 100 206.3 =
 * the iPhone frame's 0.4847 aspect, see customer/iphone.module.css), so they
 * scale and turn with the phone:
 *   HandBack   the palm and wrist, behind the phone (only the heel of the
 *              hand and the forearm show, below and right of it)
 *   HandFront  the thumb along the right edge and the four fingertips
 *              curling round the left edge, in front of the phone
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
      {/* palm heel + wrist + forearm, leaving the frame down and to the right */}
      <path
        className={s.handFill}
        d="M6 150C4 176 14 200 40 214L118 470H222L152 238C142 214 126 196 112 178L104 150Z"
      />
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
      {/* the fingers, curled round the left edge onto the bezel: one shape
          with three creases, so it reads as a grip, not as four blobs */}
      <path
        className={s.handFill}
        d="M7 96C0 95 -9 99 -10 108C-11 128 -11 152 -9 172C-8 181 -1 185 6 184Z"
      />
      <path className={s.handCrease} d="M-10 121H-1M-11 140H-1M-10 159H-1" />
      {/* the thumb, from the heel of the hand up along the right edge */}
      <path
        className={s.handFill}
        d="M122 200C120 182 112 160 102 142C98 135 91 134 89 140C87 146 90 156 94 166C97 176 98 190 96 206Z"
      />
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
