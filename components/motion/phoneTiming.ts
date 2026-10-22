"use client"

import { useSyncExternalStore } from "react"

/**
 * Phone timing for the timer-based reveals (Reveal, WordReveal, ChildStagger,
 * Counter) — Web 2.1 P8, Noah on an iPhone: they "don't lag but don't appear
 * as quickly as they should".
 *
 * Two reasons they felt late on a phone, both fixed here and only at the
 * site's one breakpoint (<= 820px), so the desktop feel is unchanged:
 *   1. WHEN they start. Desktop waits until 12% of the element is on screen,
 *      6% above the bottom edge. A phone stacks everything in one tall
 *      column, so 12% of a tall block can be a whole thumb-flick away. Phones
 *      start as soon as ~any of it is about to enter (4% below the edge).
 *   2. HOW LONG they take. Durations, staggers and caller delays run at
 *      PHONE_SCALE (0.65x): a phone scroll covers a section in a fraction of
 *      the time, so the desktop pacing reads as waiting.
 *
 * The server and the first client render use the desktop values (no
 * hydration mismatch); the phone values arrive right after, before any
 * observer can have fired.
 */
export const PHONE_QUERY = "(max-width: 820px)"
export const PHONE_SCALE = 0.65

/** In-view options for a reveal on a phone: start as it is about to enter. */
export const PHONE_VIEWPORT = { once: true, amount: 0.01, margin: "0px 0px 4% 0px" } as const

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(PHONE_QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

/** True on a phone-width viewport; false on the server and first render. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  )
}
