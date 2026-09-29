"use client"

import { useSyncExternalStore } from "react"
import { merchantCopy } from "./merchant/copy"

/**
 * The PapeX Cafe coupons, shared by the two halves of the /business §03 demo:
 * the merchant dashboard (MerchantDemo — the only WRITER, via its On/Off
 * toggles) and the interactive iPhone (PhoneApp — a READER: what the customer
 * sees follows whatever the visitor switched on in the dashboard).
 *
 * A tiny module-level store read through useSyncExternalStore, so neither side
 * re-renders the whole story and both stay in step. The server snapshot is the
 * copy's defaults, so SSR and the first client paint agree (no hydration jump).
 * Demo only: nothing leaves the page.
 */

export type CafeCoupon = { id: string; title: string; on: boolean }

const DEFAULTS: readonly CafeCoupon[] = merchantCopy.coupons.items.map((it, i) => ({
  id: `cafe-coupon-${i}`,
  title: it.title,
  on: it.on,
}))

let state: readonly CafeCoupon[] = DEFAULTS
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export const cafeCoupons = {
  get: (): readonly CafeCoupon[] => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  toggle(id: string) {
    state = state.map((c) => (c.id === id ? { ...c, on: !c.on } : c))
    emit()
  },
  set(id: string, on: boolean) {
    state = state.map((c) => (c.id === id ? { ...c, on } : c))
    emit()
  },
  reset() {
    state = DEFAULTS
    emit()
  },
}

/** Every coupon, on and off. */
export function useCafeCoupons(): readonly CafeCoupon[] {
  return useSyncExternalStore(cafeCoupons.subscribe, cafeCoupons.get, () => DEFAULTS)
}

/** Only the coupons the merchant has switched on — what a customer can get. */
export function useActiveCafeCoupons(): CafeCoupon[] {
  return useCafeCoupons().filter((c) => c.on)
}
