import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import styles from "./flow.module.css"

/**
 * The section eyebrow for both path homes: small mono caps with a bracketed
 * index — "[02] The problem". The index is orange; the words take the
 * ground's secondary ink so they stay readable on either ground.
 *
 * Accepts `style` so ChildStagger can animate it like any other child.
 */
export function SectionLabel({
  index,
  children,
  className,
  style,
}: {
  index?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={cn(styles.label, className)} style={style}>
      {index ? <span className={styles.labelIdx}>[{index}]</span> : null}
      <span>{children}</span>
    </div>
  )
}
