// components/brand/error-art.tsx
//
// The two error-page illustrations (Phase 4, f-07/f-08, Nico: "a picture of a
// receipt that has been through the wash, all torn and tarnished… something
// creative, different for each error").
//
//   <WashedReceipt />  — 404: a receipt after a laundry cycle. Torn top and
//                        bottom, a bite missing from one side, yellowed, the
//                        print smeared to ghosts, two water stains, a few
//                        soap bubbles.
//   <JammedReceipt />  — error.tsx / global-error.tsx: a receipt printer with
//                        its paper crumpled into an accordion at the slot and
//                        an orange status light.
//
// Pure inline SVG (no images, no client JS), so global-error.tsx can use the
// jammed one with no stylesheet at all. Decorative: aria-hidden, the page's
// heading carries the meaning. Motion is opt-in via `motion` (class hooks
// styled in error-page.module.css, off under prefers-reduced-motion); with
// it off the art is a still picture.

type ArtProps = {
  className?: string
  /** Class names for the optional idle motion (see error-page.module.css). */
  motion?: { sway?: string; bubble?: string; led?: string; shudder?: string }
}

const NAVY = '#00121D'
const ORANGE = '#EB7100'

/** Faded, smeared print rows: [x, y, width, opacity]. */
const WASHED_ROWS: [number, number, number, number][] = [
  [58, 132, 118, 0.26],
  [196, 132, 46, 0.2],
  [58, 152, 92, 0.18],
  [204, 152, 38, 0.14],
  [58, 172, 132, 0.12],
  [58, 212, 70, 0.22],
  [150, 212, 22, 0.1],
  [206, 212, 36, 0.2],
  [58, 232, 104, 0.1],
  [212, 232, 30, 0.08],
  [58, 252, 60, 0.16],
  [196, 252, 46, 0.12],
]

export function WashedReceipt({ className, motion }: ArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 400"
      width="320"
      height="400"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* A little turbulence bends every edge, the way wet paper dries. */}
        <filter id="pxw-crumple" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Ink that ran: blurred sideways more than down. */}
        <filter id="pxw-smear" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.4 0.8" />
        </filter>
        <filter id="pxw-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="pxw-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFEFA" />
          <stop offset="0.55" stopColor="#F6F2E8" />
          <stop offset="1" stopColor="#EBE4D2" />
        </linearGradient>
        <radialGradient id="pxw-stain" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#C9B27A" stopOpacity="0.05" />
          <stop offset="0.78" stopColor="#C9B27A" stopOpacity="0.1" />
          <stop offset="0.93" stopColor="#B69B62" stopOpacity="0.22" />
          <stop offset="1" stopColor="#B69B62" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Shadow on the ground */}
      <ellipse cx="160" cy="372" rx="108" ry="12" fill={NAVY} opacity="0.1" filter="url(#pxw-soft)" />

      <g className={motion?.sway}>
        <g transform="rotate(-6 160 200)">
          {/* The slip: torn zigzag top and bottom, a bite out of the right
              edge, then bent by the crumple filter. */}
          <g filter="url(#pxw-crumple)">
            <path
              d="M40 58 L52 48 L61 57 L72 45 L84 55 L95 44 L108 54 L120 46 L131 56 L144 44
                 L156 53 L168 45 L180 55 L193 44 L205 54 L217 46 L229 55 L240 45 L252 53 L266 47 L280 57
                 L280 168 L266 176 L272 190 L258 200 L270 214 L260 226 L280 236
                 L280 338 L268 348 L257 339 L245 350 L232 340 L220 352 L206 341 L195 351 L182 342
                 L170 353 L157 342 L145 351 L132 341 L120 352 L107 342 L95 350 L82 340 L70 351 L57 341 L40 350 Z"
              fill="url(#pxw-paper)"
              stroke={NAVY}
              strokeOpacity="0.08"
            />
            {/* Crease lines from the tumble dryer */}
            <path d="M44 120 L150 104 L278 132" fill="none" stroke={NAVY} strokeOpacity="0.07" strokeWidth="1.2" />
            <path d="M44 121 L150 105 L278 133" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1" transform="translate(0 2)" />
            <path d="M120 50 L140 180 L110 346" fill="none" stroke={NAVY} strokeOpacity="0.06" strokeWidth="1.2" />
            <path d="M42 280 L170 262 L278 300" fill="none" stroke={NAVY} strokeOpacity="0.06" strokeWidth="1.2" />
            <path d="M210 48 L196 200 L232 348" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />

            {/* Water stains */}
            <ellipse cx="206" cy="112" rx="52" ry="40" fill="url(#pxw-stain)" />
            <ellipse cx="96" cy="286" rx="44" ry="36" fill="url(#pxw-stain)" />
            <ellipse cx="222" cy="300" rx="22" ry="18" fill="url(#pxw-stain)" />
          </g>

          {/* The print, mostly washed away. */}
          <g filter="url(#pxw-smear)">
            <text
              x="160"
              y="94"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontWeight="700"
              fontSize="26"
              fill={ORANGE}
              opacity="0.42"
              letterSpacing="3"
            >
              PAPEX
            </text>
            {WASHED_ROWS.map(([x, y, w, o]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width={w} height="7" rx="3" fill={NAVY} opacity={o} />
            ))}
            <rect x="58" y="284" width="46" height="10" rx="4" fill={NAVY} opacity="0.3" />
            <rect x="178" y="284" width="18" height="10" rx="4" fill={NAVY} opacity="0.26" />
            <rect x="212" y="284" width="30" height="10" rx="4" fill={NAVY} opacity="0.12" />
          </g>
          {/* The dashed rule survived better than the words did. */}
          <line
            x1="58"
            y1="194"
            x2="242"
            y2="194"
            stroke={NAVY}
            strokeOpacity="0.16"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <line
            x1="58"
            y1="270"
            x2="200"
            y2="270"
            stroke={NAVY}
            strokeOpacity="0.1"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
        </g>

        {/* Two scraps that came off in the drum */}
        <path d="M284 206 L300 200 L306 214 L296 226 L286 220 Z" fill="#F3EEE1" stroke={NAVY} strokeOpacity="0.08" />
        <path d="M22 318 L36 312 L40 326 L28 332 Z" fill="#EFE9DA" stroke={NAVY} strokeOpacity="0.08" />
      </g>

      {/* Soap bubbles */}
      <g className={motion?.bubble}>
        <circle cx="270" cy="70" r="13" fill="#7FC4EC" fillOpacity="0.08" stroke="#7FC4EC" strokeOpacity="0.55" strokeWidth="1.5" />
        <circle cx="265" cy="65" r="3" fill="#fff" opacity="0.9" />
        <circle cx="296" cy="112" r="7" fill="#7FC4EC" fillOpacity="0.08" stroke="#7FC4EC" strokeOpacity="0.5" strokeWidth="1.2" />
        <circle cx="30" cy="150" r="9" fill="#7FC4EC" fillOpacity="0.08" stroke="#7FC4EC" strokeOpacity="0.5" strokeWidth="1.2" />
        <circle cx="27" cy="147" r="2" fill="#fff" opacity="0.9" />
      </g>
    </svg>
  )
}

export function JammedReceipt({ className, motion }: ArtProps) {
  return (
    <svg
      className={className}
      viewBox="30 48 270 336"
      width="270"
      height="336"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="pxj-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="pxj-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="pxj-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0C2937" />
          <stop offset="1" stopColor={NAVY} />
        </linearGradient>
        <linearGradient id="pxj-fold-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#ECE8DE" />
        </linearGradient>
        <linearGradient id="pxj-fold-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E2DDD0" />
          <stop offset="1" stopColor="#F7F4EC" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="160" cy="372" rx="120" ry="12" fill={NAVY} opacity="0.14" filter="url(#pxj-soft)" />

      {/* The paper, bunched into an accordion above the slot. Drawn before
          the printer so the slot lip sits over its foot. */}
      <g className={motion?.shudder}>
        {/* A tail that made it out, bent over */}
        <path
          d="M176 212 C178 150 196 108 236 70 L262 84 C230 116 210 156 206 212 Z"
          fill="url(#pxj-fold-a)"
          stroke={NAVY}
          strokeOpacity="0.14"
        />
        <path d="M236 70 L262 84 L255 92 L244 78 L238 86 Z" fill="#E6E0D2" stroke={NAVY} strokeOpacity="0.12" />
        <g opacity="0.55">
          <rect x="196" y="112" width="30" height="4" rx="2" fill={NAVY} opacity="0.3" transform="rotate(-38 211 114)" />
          <rect x="190" y="130" width="22" height="4" rx="2" fill={NAVY} opacity="0.22" transform="rotate(-34 201 132)" />
        </g>
        {/* Accordion folds, alternating faces */}
        <path d="M112 214 L102 186 L150 176 L158 204 Z" fill="url(#pxj-fold-a)" stroke={NAVY} strokeOpacity="0.14" />
        <path d="M102 186 L122 160 L168 154 L150 176 Z" fill="url(#pxj-fold-b)" stroke={NAVY} strokeOpacity="0.14" />
        <path d="M122 160 L108 132 L160 124 L168 154 Z" fill="url(#pxj-fold-a)" stroke={NAVY} strokeOpacity="0.14" />
        <path d="M108 132 L132 110 L176 116 L160 124 Z" fill="url(#pxj-fold-b)" stroke={NAVY} strokeOpacity="0.14" />
        <path d="M158 204 L150 176 L200 172 L206 212 Z" fill="url(#pxj-fold-b)" stroke={NAVY} strokeOpacity="0.14" />
        <path d="M150 176 L168 154 L204 150 L200 172 Z" fill="url(#pxj-fold-a)" stroke={NAVY} strokeOpacity="0.14" />
        {/* Print caught in the folds, skewed */}
        <rect x="114" y="192" width="30" height="4" rx="2" fill={NAVY} opacity="0.28" transform="rotate(-12 129 194)" />
        <rect x="160" y="186" width="28" height="4" rx="2" fill={NAVY} opacity="0.22" transform="rotate(-5 174 188)" />
        <rect x="120" y="140" width="34" height="4" rx="2" fill={NAVY} opacity="0.24" transform="rotate(-9 137 142)" />
        <text
          x="126"
          y="172"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="13"
          fill={ORANGE}
          opacity="0.7"
          transform="rotate(-10 140 168)"
          letterSpacing="1.5"
        >
          PAPEX
        </text>
      </g>

      {/* The printer */}
      <rect x="54" y="206" width="212" height="148" rx="22" fill="url(#pxj-body)" />
      <rect x="54" y="206" width="212" height="148" rx="22" fill="none" stroke="#fff" strokeOpacity="0.1" />
      {/* Slot */}
      <rect x="90" y="206" width="140" height="14" rx="7" fill="#04161F" />
      <rect x="96" y="211" width="128" height="4" rx="2" fill="#000" opacity="0.6" />
      {/* Lid seam + feed button */}
      <line x1="72" y1="252" x2="248" y2="252" stroke="#fff" strokeOpacity="0.08" strokeWidth="2" />
      <rect x="80" y="304" width="58" height="20" rx="10" fill="#0A2431" stroke="#fff" strokeOpacity="0.12" />
      <rect x="96" y="312" width="26" height="4" rx="2" fill="#fff" opacity="0.28" />
      {/* Status light: orange, the jam */}
      <circle cx="232" cy="314" r="11" fill={ORANGE} opacity="0.55" filter="url(#pxj-glow)" className={motion?.led} />
      <circle cx="232" cy="314" r="6" fill={ORANGE} />
      <circle cx="230" cy="312" r="2" fill="#fff" opacity="0.7" />

      {/* Jam marks */}
      <g stroke={ORANGE} strokeWidth="3" strokeLinecap="round" opacity="0.85">
        <line x1="82" y1="120" x2="70" y2="108" />
        <line x1="76" y1="146" x2="60" y2="144" />
        <line x1="274" y1="126" x2="290" y2="116" />
      </g>
    </svg>
  )
}
