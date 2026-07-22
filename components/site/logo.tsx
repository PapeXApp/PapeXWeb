import type { CSSProperties } from 'react'

/**
 * PapeX wordmark: orange paper-plane glyph + "PapeX" set in the display face.
 * Text uses currentColor so it adapts (white on dark, navy on light); the
 * plane stays brand orange. No dependency on a color-baked logo asset.
 */
export function Logo({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', ...style }}
      aria-label="PapeX"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M22 3 2 10.5l6.6 2.3L22 3Z" fill="#EB7100" />
        <path d="m22 3-8.4 18-3-8.2L22 3Z" fill="#EB7100" opacity="0.72" />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-kameron), Georgia, serif',
          fontWeight: 600,
          fontSize: '1.35rem',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        Pape<span style={{ color: '#EB7100' }}>X</span>
      </span>
    </span>
  )
}
