import type { CSSProperties, ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** stagger delay in seconds */
  delay?: number
  className?: string
  style?: CSSProperties
  as?: 'div' | 'section' | 'li' | 'span' | 'h2' | 'p'
}

/**
 * Entrance reveal. Content is visible by default and animates in via a pure-CSS
 * keyframe on mount (staggered by `delay`). No IntersectionObserver / JS gating,
 * so content can never get stuck hidden — it degrades to fully visible if the
 * animation is unsupported or reduced-motion is on (see .rd-reveal in
 * styles/redesign.css).
 */
export function Reveal({ children, delay = 0, className, style, as = 'div' }: RevealProps) {
  const Tag = as
  return (
    <Tag className={`rd-reveal${className ? ` ${className}` : ''}`} style={{ animationDelay: `${delay}s`, ...style }}>
      {children}
    </Tag>
  )
}
