"use client"

import { useEffect, useState } from "react"
import type { Ground } from "./FlowSection"

/**
 * The running page ground, published by FlowGround for the nav.
 *
 * Why the nav needs it: on a path home every section is transparent, so what
 * is actually under the nav's glass is the FlowGround colour — which swaps
 * when a section crosses the MIDDLE of the viewport. The nav's own probe
 * (use-glass-theme) reads the section at the TOP of the viewport, so for half
 * a screen after every swap it picked light glass over a navy ground (or the
 * reverse) and the bubbles went muddy grey. Following the ground fixes that
 * exactly; everywhere without a FlowGround the value is null and the nav
 * falls back to its probe.
 */
export const FLOW_GROUND_EVENT = "papex:flow-ground"

let current: Ground | null = null

export function publishFlowGround(ground: Ground | null) {
  current = ground
  window.dispatchEvent(new CustomEvent<Ground | null>(FLOW_GROUND_EVENT, { detail: ground }))
}

export function useFlowGround(): Ground | null {
  const [ground, setGround] = useState<Ground | null>(null)
  useEffect(() => {
    setGround(current)
    const onGround = (event: Event) => setGround((event as CustomEvent<Ground | null>).detail)
    window.addEventListener(FLOW_GROUND_EVENT, onGround)
    return () => window.removeEventListener(FLOW_GROUND_EVENT, onGround)
  }, [])
  return ground
}
