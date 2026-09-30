"use client"

import { createElement, useEffect, useMemo, useState } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import type { KitReceipt, KitStore } from "@/components/app-kit"
import { CAFE_NAME, cafeStore, cafeStoreFor } from "../../papexCafe"
import { PapexCafeLogo } from "../../PapexCafeLogo"

/**
 * PapeX Cafe's logo as an image URL, for the app kit: every kit part that
 * draws a store's mark (ReceiptRow / ReceiptDetail's MerchantLogo, CouponRow's
 * thumb, StoreTile / StoreHero's StoreAppIcon) takes a `logoUrl` string, not a
 * component. So the ONE logo component (PapexCafeLogo, whose artwork the
 * dashboard owns) is rendered once into a detached node and its SVG handed
 * over as a data URI: the phone shows exactly the dashboard's logo, and a new
 * artwork reaches the phone with no change here.
 *
 * Rendered with react-dom/client (already on the page), not react-dom/server
 * (which would add a server renderer to the page's bundle), in a task
 * scheduled from an effect (a root can't be flushed while React commits).
 * The phone's app screens only mount after "Save to PapeX", long after this
 * has run; until then the business side's monogram stands in.
 */
let cached: string | null = null

function renderLogo(): string | null {
  if (cached) return cached
  const host = document.createElement("div")
  const root = createRoot(host)
  flushSync(() => root.render(createElement(PapexCafeLogo, { size: 80 })))
  let svg = host.innerHTML
  root.unmount()
  if (!svg.startsWith("<svg")) return null
  // an <img> needs the SVG namespace on the root element
  if (!/^<svg[^>]*\sxmlns=/.test(svg)) svg = svg.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
  cached = `data:image/svg+xml,${encodeURIComponent(svg)}`
  return cached
}

export function usePapexCafeLogoUri(): string {
  const [uri, setUri] = useState<string | null>(cached)
  useEffect(() => {
    if (cached) return
    // a task of its own: flushSync / unmount must not run while React is
    // committing the page (they warn, and can race)
    const t = window.setTimeout(() => setUri(renderLogo()), 0)
    return () => window.clearTimeout(t)
  }, [])
  return uri ?? cafeStore.logoUrl ?? ""
}

/**
 * PapeX Cafe as the kit's full store record (its loyalty programme and all),
 * wearing the real logo instead of the "P" monogram, plus a lookup that swaps
 * it in for the shared shop's id and a receipt re-labeller that gives PapeX
 * Cafe's receipts the same logo. For the phone screens outside the §03 story
 * (the hero loop's app + coupon), so every phone on /business shows the
 * dashboard's logo, not an initial (p8, Noah via Nico).
 */
export function useCafeStore() {
  const logo = usePapexCafeLogoUri()
  return useMemo(() => {
    const cafe: KitStore = { ...cafeStore, logoUrl: logo }
    const storeFor = (id: string): KitStore => (id === cafe.id ? cafe : cafeStoreFor(id))
    const receipt = (r: KitReceipt): KitReceipt => (r.merchantName === CAFE_NAME ? { ...r, logoUrl: logo } : r)
    return { cafe, storeFor, receipt }
  }, [logo])
}
