"use client"

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { storyScreen } from "../story"
import { demoSales, type DemoSale } from "./demoSales"

/**
 * The state and data behind the scene's demo dashboard, shared by the two
 * drawings of it: the laptop's (Dashboard.tsx, desktop) and the phone card's
 * (PhoneDashboard.tsx, <=820px). Both are the same working demo of
 * app/merchant on the same invented sales (demoSales.ts); only the layout
 * differs. Extracted from Dashboard.tsx (B6) without changing its behaviour.
 */

export type View = "insights" | "receipts"
export type Range = "today" | "7d"

export const usd = (n: number) => `$${n.toFixed(2)}`
export const hourShort = (h: number) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`

export function useDashboardModel(live: boolean) {
  const sales = demoSales()
  const delivered = sales[0]
  const days = useMemo(() => Array.from(new Set(sales.map((x) => x.day))), [sales])

  const [view, setView] = useState<View>("insights")
  const [range, setRange] = useState<Range>("today")
  const [q, setQ] = useState("")
  const [last4, setLast4] = useState("")
  const [minAmt, setMinAmt] = useState("")
  const [day, setDay] = useState("")
  const [hourFilter, setHourFilter] = useState<number | null>(null)
  const [tipHour, setTipHour] = useState<number | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const uid = useId()

  // Leaving the latched end state: back to the frame the spark delivered.
  useEffect(() => {
    if (live) return
    setView("insights")
    setRange("today")
    setQ("")
    setLast4("")
    setMinAmt("")
    setDay("")
    setHourFilter(null)
    setTipHour(null)
    setOpenId(null)
  }, [live])

  useEffect(() => {
    if (openId) closeRef.current?.focus()
  }, [openId])

  const inRange = range === "today" ? sales.filter((x) => x.delivered) : sales
  const gross = inRange.reduce((a, x) => a + x.total, 0)
  const tapped = inRange.filter((x) => x.tapped).length

  const byHour = useMemo(() => {
    const m = new Map<number, DemoSale[]>()
    for (const x of inRange) m.set(x.hour, [...(m.get(x.hour) ?? []), x])
    return m
  }, [inRange])
  const maxHour = Math.max(1, ...Array.from(byHour.values(), (v) => v.length))

  const topItems = useMemo(() => {
    const m = new Map<string, number>()
    for (const x of inRange) for (const it of x.summary.items) m.set(it.name, (m.get(it.name) ?? 0) + it.qty)
    return Array.from(m, ([name, qty]) => ({ name, qty }))
      // stable sort: ties keep the receipts' own order
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4)
  }, [inRange])
  const maxQty = Math.max(1, ...topItems.map((x) => x.qty))

  const filtered = sales.filter((x) => {
    const needle = q.trim().toLowerCase()
    if (needle && !x.order.toLowerCase().includes(needle.replace(/^#?/, "#")) && !x.summary.items.some((it) => it.name.toLowerCase().includes(needle)))
      return false
    if (last4 && !(x.lastFour ?? "").startsWith(last4)) return false
    const min = Number(minAmt)
    if (minAmt && Number.isFinite(min) && x.total < min) return false
    if (day && x.day !== day) return false
    if (hourFilter != null && x.hour !== hourFilter) return false
    return true
  })

  const open = openId ? sales.find((x) => x.id === openId) : undefined
  const openSale = (id: string, el: HTMLElement) => {
    openerRef.current = el
    setOpenId(id)
  }
  const closeSale = () => {
    setOpenId(null)
    openerRef.current?.focus()
  }
  /** Esc closes an opened receipt and returns focus to what opened it. */
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && openId) {
      e.stopPropagation()
      closeSale()
    }
  }
  /** A bar's drill-down: that hour's receipts, all dates. */
  const showHour = (h: number) => {
    setHourFilter(h)
    setDay("")
    setView("receipts")
  }

  const t = storyScreen.tiles
  const tiles = [
    { label: t.count, empty: "0", value: String(inRange.length) },
    { label: t.gross, empty: "$0.00", value: usd(gross) },
    { label: t.avg, empty: "—", value: usd(inRange.length ? gross / inRange.length : 0) },
    { label: t.tap, empty: "—", value: `${tapped} of ${inRange.length}`, note: t.tapNote as string | undefined },
  ]
  // data-fill keys: 0 new receipt, 1-4 tiles, 5 the delivered hour's bar, 6-9 items
  const itemKey = tiles.length + 2

  return {
    sales,
    delivered,
    days,
    view,
    setView,
    range,
    setRange,
    q,
    setQ,
    last4,
    setLast4,
    minAmt,
    setMinAmt,
    day,
    setDay,
    hourFilter,
    setHourFilter,
    tipHour,
    setTipHour,
    open,
    openSale,
    closeSale,
    closeRef,
    onKeyDown,
    showHour,
    uid,
    byHour,
    maxHour,
    topItems,
    maxQty,
    filtered,
    tiles,
    itemKey,
  }
}
