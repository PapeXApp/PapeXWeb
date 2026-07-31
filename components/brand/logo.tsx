// components/brand/logo.tsx
//
// PapeX wordmark for the redesigned chrome: inline paper-plane SVG (rotated
// -8deg) + "PapeX" in the display face. Text uses currentColor so the mark
// works on both the dark and light nav-glass variants; the plane stays brand
// orange. Salvaged from origin/feat/site-redesign and re-cut to the geometry
// in docs/design/forked-landing/README.md ("Assets").

import type { CSSProperties } from 'react'

export function PlaneMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ transform: 'rotate(-8deg)', display: 'block' }}
      aria-hidden="true"
    >
      {/* The README also lists an underside path `M11.5 13.5L22 3L11.5 13.5Z`
          in #c85f00 — it is degenerate (zero area) and paints nothing, which
          is why the prototype footer omits it. Not reproduced. */}
      <path d="M2 12L22 3L15 21L11.5 13.5L2 12Z" fill="#EB7100" />
    </svg>
  )
}

export function Logo({
  className,
  style,
  size = 24,
}: {
  className?: string
  style?: CSSProperties
  size?: number
}) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}
    >
      <PlaneMark size={size} />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        PapeX
      </span>
    </span>
  )
}
