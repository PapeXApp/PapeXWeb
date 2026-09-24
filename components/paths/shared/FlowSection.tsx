import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import styles from "./flow.module.css"

export type Ground = "light" | "navy"

/**
 * A section on a path home. It paints NO background of its own — it only
 * declares which ground it wants (`data-ground`), and FlowGround crossfades
 * the page to it as the section takes the middle of the viewport.
 *
 * `data-nav-theme` is derived from the same value so the nav's glass probe
 * (components/brand/use-glass-theme.ts) keeps working unchanged.
 */
export function FlowSection({
  ground,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- accepted so callers passing a section index need no edits; no longer rendered
  index,
  id,
  className,
  style,
  children,
}: {
  ground: Ground
  index?: string
  id?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <section
      id={id}
      data-ground={ground}
      data-nav-theme={ground === "navy" ? "dark" : "light"}
      className={cn(styles.section, className)}
      style={style}
    >
      {children}
    </section>
  )
}
