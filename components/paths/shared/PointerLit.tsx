"use client"

import { useEffect, useRef } from "react"
import type { CSSProperties, HTMLAttributes, PointerEvent as ReactPointerEvent, ReactNode } from "react"
import { cn } from "@/lib/utils"
import styles from "./flow.module.css"

type PointerLitGroupProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Pointer-lit cards. Wrap a grid of cards in this and mark each card with
 * `data-lit` (or `data-lit="dark"` on a navy card). One pointermove handler
 * on the group, throttled to a frame, writes --mx/--my on every card, and
 * flow.module.css turns them into a radial fill plus a 1px border glow.
 *
 * Only a mouse lights cards — touch has no hover, and the glow would stick
 * where the finger lifted.
 *
 * Reveal trap: Reveal writes an inline transform, which beats a :hover
 * transform on the same element. Put `data-lit` (and any hover lift) on the
 * card INSIDE a Reveal, never on the Reveal itself.
 */
export function PointerLitGroup({ children, className, style, ...rest }: PointerLitGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const point = useRef({ x: 0, y: 0 })

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return
    point.current = { x: event.clientX, y: event.clientY }
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const host = ref.current
      if (!host) return
      host.querySelectorAll<HTMLElement>("[data-lit]").forEach((card) => {
        const rect = card.getBoundingClientRect()
        card.style.setProperty("--mx", `${(point.current.x - rect.left).toFixed(1)}px`)
        card.style.setProperty("--my", `${(point.current.y - rect.top).toFixed(1)}px`)
      })
    })
  }

  return (
    <div {...rest} ref={ref} className={cn(styles.litGroup, className)} style={style} onPointerMove={onPointerMove}>
      {children}
    </div>
  )
}
