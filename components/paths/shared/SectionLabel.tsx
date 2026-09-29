import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import styles from "./flow.module.css"

/**
 * The section eyebrow for both path homes: small mono caps — "The problem" —
 * in the ground's secondary ink so it stays readable on either ground.
 *
 * No section number any more (Nico, Web 2.1 P4: "remove the numbers, keep the
 * text"). `index` is still ACCEPTED so the call sites and content files that
 * pass one need no edits, but it is never rendered, so it is not in the
 * accessible name either.
 *
 * Accepts `style` so ChildStagger can animate it like any other child.
 */
export function SectionLabel({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- accepted so callers passing a section number need no edits; no longer rendered
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
    // data-section-label: NextSection reads it to keep a scrolled-to label
    // clear of the fixed nav.
    <div className={cn(styles.label, className)} style={style} data-section-label="">
      <span>{children}</span>
    </div>
  )
}
