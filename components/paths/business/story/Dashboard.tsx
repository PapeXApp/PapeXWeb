"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { DemoReceiptView } from "../../customer/DemoReceiptView"
import { storyScreen } from "../story"
import { demoSales, type DemoSale } from "./demoSales"
import s from "../story.module.css"

/**
 * The merchant dashboard on the laptop — a working DEMO of app/merchant, not
 * a picture of it (Web 2.1 B5 round 2, Nico: "make the dashboard at the end
 * interactive").
 *
 * Two lives:
 *  1. During the scroll story it is the screen the spark delivers onto. The
 *     scene collects every `[data-fill]` element ONCE and drives its reveal
 *     from progress (`data-kind`: fade | rise | growY | growX); `[data-empty]`
 *     twins are the "nothing yet" values they replace. Every one of those
 *     elements stays mounted whatever the visitor clicks later (views are
 *     `hidden`, item rows are keyed by position), so the scene's cached
 *     element list can never go stale.
 *  2. Once the scene latches open (`live`), it is usable: Insights / Receipts
 *     views, Today / 7 days, hour bars that show their value on hover/focus
 *     and drill into Receipts on click, filters by item or receipt #, card
 *     last 4, minimum amount and date, and any sale opens as the customer saw
 *     it (the App Clip's receipt view) in an overlay inside the laptop's
 *     screen. When `live` turns off, everything resets to the delivered frame
 *     so the story can run backwards from it.
 *
 * Mirrors app/merchant (page.tsx search/filters, insights/page.tsx tiles,
 * hour chart drill-down, top items) in the dashboard's own palette
 * (app/merchant/ui/tokens.ts). Data: demoSales.ts — invented, labelled
 * "Demo data" on screen.
 */

type View = "insights" | "receipts"
type Range = "today" | "7d"

const usd = (n: number) => `$${n.toFixed(2)}`
const hourShort = (h: number) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`

export function Dashboard({ live = false, className }: { live?: boolean; className?: string }) {
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

  const t = storyScreen.tiles
  const tiles = [
    { label: t.count, empty: "0", value: String(inRange.length) },
    { label: t.gross, empty: "$0.00", value: usd(gross) },
    { label: t.avg, empty: "—", value: usd(inRange.length ? gross / inRange.length : 0) },
    { label: t.tap, empty: "—", value: `${tapped} of ${inRange.length}`, note: t.tapNote },
  ]
  const itemKey = tiles.length + 2

  return (
    <div
      className={cn(s.dash, className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && openId) {
          e.stopPropagation()
          closeSale()
        }
      }}
    >
      <div className={s.dashTop}>
        <div className={s.dashBrand}>
          <span>{storyScreen.brand}</span>
          <i aria-hidden="true" />
          <small>{storyScreen.brandTag}</small>
        </div>
        <div className={s.dashTabs} role="tablist" aria-label="Dashboard view">
          {(["insights", "receipts"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              id={`${uid}-tab-${v}`}
              aria-selected={view === v}
              aria-controls={`${uid}-panel-${v}`}
              className={cn(view === v && s.dashTabOn)}
              onClick={() => setView(v)}
            >
              {v === "insights" ? storyScreen.title : storyScreen.receiptsTab}
            </button>
          ))}
        </div>
        <span className={s.dashDemo}>{storyScreen.demoTag}</span>
      </div>

      {/* ---- Insights -------------------------------------------------- */}
      <div
        className={s.dashPanel}
        role="tabpanel"
        id={`${uid}-panel-insights`}
        aria-labelledby={`${uid}-tab-insights`}
        hidden={view !== "insights"}
      >
        <div className={s.dashHead}>
          <div className={s.dashSub}>{storyScreen.subtitle}</div>
          <div className={s.dashRanges} role="group" aria-label="Date range">
            {(["today", "7d"] as const).map((r) => (
              <button key={r} type="button" aria-pressed={range === r} className={cn(range === r && s.dashRangeOn)} onClick={() => setRange(r)}>
                {r === "today" ? storyScreen.ranges[0] : storyScreen.ranges[1]}
              </button>
            ))}
          </div>
        </div>

        <div className={s.dashTiles}>
          {tiles.map((tile, i) => (
            <div key={tile.label} className={s.dashTile}>
              <div className={s.dashLabel}>{tile.label}</div>
              <div className={s.dashValueBox}>
                <span data-empty={i + 1} className={s.dashValueEmpty} aria-hidden="true">
                  {tile.empty}
                </span>
                <span data-fill={i + 1} data-kind="rise" className={s.dashValue}>
                  {tile.value}
                </span>
              </div>
              {tile.note ? (
                <div data-fill={i + 1} data-kind="fade" className={s.dashNote}>
                  {tile.note}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className={s.dashRow}>
          <div className={cn(s.dashCard, s.dashHours)}>
            <div className={s.dashCardTitle}>{storyScreen.byHour}</div>
            <div className={s.dashBars}>
              {Array.from({ length: 24 }, (_, h) => {
                const list = byHour.get(h)
                const n = list?.length ?? 0
                const pct = `${(n / maxHour) * 100}%`
                const bar =
                  h === delivered.hour ? (
                    <i data-fill={tiles.length + 1} data-kind="growY" className={s.dashBar} style={{ height: pct }} />
                  ) : n ? (
                    <i className={s.dashBar} style={{ height: pct }} />
                  ) : null
                if (!n) return <span key={h} className={s.dashBarSlot} />
                const sum = list!.reduce((a, x) => a + x.total, 0)
                const label = `${hourShort(h)}: ${n} ${n === 1 ? "sale" : "sales"}, ${usd(sum)}`
                return (
                  <button
                    key={h}
                    type="button"
                    className={cn(s.dashBarSlot, s.dashBarBtn)}
                    aria-label={`${label}. Show these receipts`}
                    onMouseEnter={() => setTipHour(h)}
                    onMouseLeave={() => setTipHour(null)}
                    onFocus={() => setTipHour(h)}
                    onBlur={() => setTipHour(null)}
                    onClick={() => {
                      setHourFilter(h)
                      setDay("")
                      setView("receipts")
                    }}
                  >
                    {bar}
                    {tipHour === h ? (
                      <span className={s.dashTip} role="status">
                        {label}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
            <div className={s.dashAxis} aria-hidden="true">
              <span>12a</span>
              <span>6a</span>
              <span>12p</span>
              <span>6p</span>
            </div>
          </div>

          <div className={cn(s.dashCard, s.dashItems)}>
            <div className={s.dashCardTitle}>{storyScreen.topItems}</div>
            {[0, 1, 2, 3].map((i) => {
              const it = topItems[i]
              return (
                <div key={i} className={s.dashItem} data-fill={itemKey + i} data-kind="rise" hidden={!it}>
                  <span className={s.dashItemRank}>{i + 1}</span>
                  <span className={s.dashItemName}>{it?.name}</span>
                  <span className={s.dashItemTrack}>
                    <i data-fill={itemKey + i} data-kind="growX" style={{ width: `${((it?.qty ?? 0) / maxQty) * 100}%` }} />
                  </span>
                  <span className={s.dashItemQty}>{it?.qty}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* the receipt itself, arriving — the first thing the spark fills */}
        <button
          type="button"
          className={s.dashToast}
          data-fill={0}
          data-kind="rise"
          onClick={(e) => openSale(delivered.id, e.currentTarget)}
          aria-label={`${storyScreen.newReceipt}: ${delivered.summary.merchantName} ${delivered.order}, ${usd(delivered.total)}. Open receipt`}
        >
          <span className={s.dashToastDot} aria-hidden="true" />
          <span className={s.dashToastLead}>{storyScreen.newReceipt}</span>
          <span className={s.dashToastText}>
            {delivered.summary.merchantName} · {delivered.order}
          </span>
          <span className={s.dashToastAmt}>{usd(delivered.total)}</span>
          <span className={s.dashToastTag}>{storyScreen.tapped}</span>
        </button>
      </div>

      {/* ---- Receipts -------------------------------------------------- */}
      <div
        className={cn(s.dashPanel, s.dashReceipts)}
        role="tabpanel"
        id={`${uid}-panel-receipts`}
        aria-labelledby={`${uid}-tab-receipts`}
        hidden={view !== "receipts"}
      >
        <div className={s.dashFilters}>
          <input
            type="search"
            className={s.dashSearch}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={storyScreen.searchPlaceholder}
            aria-label={storyScreen.searchPlaceholder}
          />
          <input
            inputMode="numeric"
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={storyScreen.last4Placeholder}
            aria-label={storyScreen.last4Placeholder}
          />
          <input
            inputMode="decimal"
            value={minAmt}
            onChange={(e) => setMinAmt(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder={storyScreen.minPlaceholder}
            aria-label={storyScreen.minPlaceholder}
          />
          <select value={day} onChange={(e) => setDay(e.target.value)} aria-label={storyScreen.dateLabel}>
            <option value="">{storyScreen.allDates}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className={s.dashListHead}>
          <span aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "receipt" : "receipts"}
          </span>
          {hourFilter != null ? (
            <button type="button" className={s.dashChip} onClick={() => setHourFilter(null)} aria-label={`Clear hour filter ${hourShort(hourFilter)}`}>
              {hourShort(hourFilter)} ×
            </button>
          ) : null}
        </div>
        <ul className={s.dashList}>
          {filtered.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                className={s.dashSale}
                onClick={(e) => openSale(x.id, e.currentTarget)}
                aria-label={`${x.order}, ${x.day} ${x.time}, ${usd(x.total)}${x.lastFour ? `, card ending ${x.lastFour}` : ""}. Open receipt`}
              >
                <span className={s.dashSaleWhen}>
                  {x.day} · {x.time}
                </span>
                <span className={s.dashSaleWhat}>
                  {x.order} · {x.summary.items.map((it) => it.name).join(", ")}
                </span>
                <span className={s.dashSaleCard}>{x.lastFour ? `•• ${x.lastFour}` : ""}</span>
                <span className={cn(s.dashSaleTag, !x.tapped && s.dashSaleTagOff)}>{x.tapped ? storyScreen.tapped : storyScreen.printed}</span>
                <span className={s.dashSaleAmt}>{usd(x.total)}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className={s.dashEmpty}>{storyScreen.noMatch}</li> : null}
        </ul>
      </div>

      {/* ---- a receipt, exactly as the customer saw it ------------------ */}
      {open ? (
        <div className={s.dashSheet} role="dialog" aria-modal="true" aria-label={`Receipt ${open.order}`}>
          <div className={s.dashSheetBar}>
            <span>
              {open.order} · {storyScreen.asSeen}
            </span>
            <button type="button" ref={closeRef} onClick={closeSale} aria-label="Close receipt">
              ×
            </button>
          </div>
          <div className={s.dashSheetBody}>
            <DemoReceiptView summary={open.summary} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
