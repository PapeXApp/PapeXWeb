import styles from "./customer.module.css";

/**
 * The PapeX RDH — isometric vector render, inlined (not `<img src="/product/rdh-device.svg">`)
 * so `.rdhLed` can be targeted by CSS and pulsed when the hero's demo phone taps down onto it.
 * Content must stay byte-identical to `public/product/rdh-device.svg` (the same artwork the
 * business path renders as a plain `<img>`) — see design-prototype/NOTES.md → "The RDH artwork
 * is generated vector". Geometry is a true isometric projection of a 100 x 68 x 30 box; regenerate
 * rather than hand-edit if the proportions ever change.
 */
export function RdhDevice({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 169.5 138.0"
      role="img"
      aria-label="The PapeX RDH: a small matte-black device with a green status light and a PapeX label on top."
    >
      <defs>
        <linearGradient id="rdhTop" x1="0" y1="0" x2=".55" y2="1">
          <stop offset="0" stopColor="#2f3542" />
          <stop offset="1" stopColor="#1e222b" />
        </linearGradient>
        <linearGradient id="rdhFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#171b23" />
          <stop offset="1" stopColor="#0e1118" />
        </linearGradient>
        <linearGradient id="rdhSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1319" />
          <stop offset="1" stopColor="#080a0f" />
        </linearGradient>
        <radialGradient id="ledGlow">
          <stop offset="0" stopColor="#3ee584" stopOpacity=".8" />
          <stop offset="1" stopColor="#3ee584" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M12.00 46.00 L98.60 96.00 L98.60 126.00 L12.00 76.00 Z"
        fill="url(#rdhFront)"
        stroke="#141821"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M157.49 62.00 L98.60 96.00 L98.60 126.00 L157.49 92.00 Z"
        fill="url(#rdhSide)"
        stroke="#0c0f15"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M70.89 12.00 L157.49 62.00 L98.60 96.00 L12.00 46.00 Z"
        fill="url(#rdhTop)"
        stroke="#282e39"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <g transform="matrix(0.86603,0.50000,-0.86603,0.50000,70.890,12.000)">
        <circle
          className={`${styles.rdhLed} ${pulsing ? styles.rdhLedPulsing : ""}`}
          cx="29"
          cy="59"
          r="12"
          fill="url(#ledGlow)"
        />
        <circle cx="29" cy="59" r="3.4" fill="#54ffa6" />
        <circle cx="29" cy="59" r="1.6" fill="#f0fff7" />
        <rect x="47" y="9" width="47" height="50" rx="2.5" fill="#f7f7f5" />
        {/* textLength pins the wordmark inside the label even if Kameron never loads */}
        <text
          x="70.5"
          y="28"
          textAnchor="middle"
          fontFamily="Kameron, Georgia, serif"
          fontWeight="700"
          fontSize="13"
          fill="#12161c"
          textLength="36"
          lengthAdjust="spacingAndGlyphs"
        >
          PapeX
        </text>
        <g transform="translate(58.5,33) scale(0.92)">
          <path d="M2 12L22 3L15 21L11.5 13.5L2 12Z" fill="#EB7100" />
          <path d="M11.5 13.5L22 3" stroke="#c05a00" strokeWidth="1.2" fill="none" />
        </g>
      </g>
      <path
        d="M12.00 46.00 L70.89 12.00 L157.49 62.00"
        fill="none"
        stroke="#3d4552"
        strokeWidth="1"
        strokeLinecap="round"
        opacity=".85"
      />
    </svg>
  );
}
