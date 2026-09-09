// components/brand/logo.tsx
//
// PapeX wordmark for the redesigned chrome: the real plane mark (see
// components/brand/plane-mark.tsx, rotated -8deg) + "PapeX" in the display
// face. Text uses currentColor so the wordmark works on both the dark and
// light nav-glass variants; the plane body stays brand orange, and the
// circuit-line colour follows the `theme` prop so it stays legible against
// whichever glass bubble it sits on (white lines read on the navy glass,
// navy lines read on the light glass — see PlaneOnDark / PlaneOnLight).

import type { CSSProperties } from 'react'
import { PlaneOnDark, PlaneOnLight } from './plane-mark'

export function Logo({
  className,
  style,
  size = 24,
  theme = 'dark',
}: {
  className?: string
  style?: CSSProperties
  size?: number
  /** Which surface the mark sits on — drives the circuit-line colour so it
   *  stays legible. Defaults to 'dark' (the footer is always on navy). */
  theme?: 'dark' | 'light'
}) {
  const Plane = theme === 'light' ? PlaneOnLight : PlaneOnDark

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}
    >
      <Plane size={size} style={{ transform: 'rotate(-8deg)', display: 'block' }} />
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
