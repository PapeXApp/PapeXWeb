"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Draws `children` at a fixed virtual size (a real laptop's dashboard, in the
 * dashboard's own px) and scales it to fill the box it sits in. The scale is
 * a `transform`, written only when the box's size changes (ResizeObserver),
 * never per frame, and the box never changes layout size because of it.
 * `fallback` is the server / no-JS guess, replaced on the first measure.
 */
export function FitFrame({
  width,
  height,
  fallback,
  className,
  children,
}: {
  width: number
  height: number
  fallback: number
  className?: string
  children: ReactNode
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const inner = innerRef.current
    if (!host || !inner) return
    const fit = () => {
      const k = Math.min(host.clientWidth / width, host.clientHeight / height)
      if (k > 0) inner.style.transform = `scale(${k.toFixed(4)})`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    return () => ro.disconnect()
  }, [width, height])

  return (
    <div ref={hostRef} className={className} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        ref={innerRef}
        style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0", transform: `scale(${fallback})` }}
      >
        {children}
      </div>
    </div>
  )
}
