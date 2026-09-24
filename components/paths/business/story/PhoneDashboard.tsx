"use client"

import type { HTMLAttributes, Ref } from "react"
import { cn } from "@/lib/utils"
import { DemoReceiptView } from "../../customer/DemoReceiptView"
import { storyScreen } from "../story"
import { hourShort, usd, useDashboardModel } from "./useDashboard"
import s from "../story.module.css"

/**
 * The scene's demo dashboard, drawn for a phone (<=820px, Web 2.1 B6).
 *
 * Nico, on the scaled-down laptop at 390px: the dashboard text came out at
 * ~6px. So on phones the laptop is not drawn at all; this card takes its
 * place. It is designed at real phone type sizes (body 13-14px, labels 11px,
 * key numbers 22px, the search field 16px so iOS does not zoom on focus) and
 * is never scaled: the scene docks it at 1:1.
 *
 * Same working demo as the laptop (useDashboard.ts: same state, same sales,
 * same reset when the scene reverses), laid out for ~335-350px: brand row,
 * Insights / Receipts, Today / 7 days, the new receipt (first thing the spark
 * fills), 2x2 tiles, hour bars, top items. The laptop's four-filter row
 * collapses to its one search field, whose placeholder fits whole.
 *
 * The `[data-fill]` / `[data-empty]` keys are the laptop's, so the scene's
 * delivery runs in the same order on both.
 */
export function PhoneDashboard({
  live = false,
  className,
  ref,
  ...rest
}: {
  live?: boolean
  className?: string
  ref?: Ref<HTMLDivElement>
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "onKeyDown">) {
  const {
    delivered,
    view,
    setView,
    range,
    setRange,
    q,
    setQ,
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
  } = useDashboardModel(live)

  return (
    <div {...rest} ref={ref} className={cn(s.pd, className)} onKeyDown={onKeyDown}>
      <div className={s.pdTop}>
        <div className={s.pdBrand}>
          <span>{storyScreen.brand}</span>
          <i aria-hidden="true" />
          <small>{storyScreen.brandTag}</small>
        </div>
        <span className={s.pdDemo}>{storyScreen.demoTag}</span>
      </div>

      <div className={s.pdTabs} role="tablist" aria-label="Dashboard view">
        {(["insights", "receipts"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            id={`${uid}-ptab-${v}`}
            aria-selected={view === v}
            aria-controls={`${uid}-ppanel-${v}`}
            className={cn(view === v && s.pdOn)}
            onClick={() => setView(v)}
          >
            {v === "insights" ? storyScreen.title : storyScreen.receiptsTab}
          </button>
        ))}
      </div>

      {/* ---- Insights -------------------------------------------------- */}
      <div
        className={s.pdPanel}
        role="tabpanel"
        id={`${uid}-ppanel-insights`}
        aria-labelledby={`${uid}-ptab-insights`}
        hidden={view !== "insights"}
      >
        <div className={s.pdRanges} role="group" aria-label="Date range">
          {(["today", "7d"] as const).map((r) => (
            <button key={r} type="button" aria-pressed={range === r} className={cn(range === r && s.pdRangeOn)} onClick={() => setRange(r)}>
              {r === "today" ? storyScreen.ranges[0] : storyScreen.ranges[1]}
            </button>
          ))}
        </div>

        {/* the receipt itself, arriving — the first thing the spark fills */}
        <button
          type="button"
          className={s.pdToast}
          data-fill={0}
          data-kind="rise"
          onClick={(e) => openSale(delivered.id, e.currentTarget)}
          aria-label={`${storyScreen.newReceipt}: ${delivered.summary.merchantName} ${delivered.order}, ${usd(delivered.total)}. Open receipt`}
        >
          <span className={s.pdToastLine}>
            <span className={s.pdToastDot} aria-hidden="true" />
            <span className={s.pdToastLead}>{storyScreen.newReceipt}</span>
            <span className={s.pdTag}>{storyScreen.tapped}</span>
          </span>
          <span className={s.pdToastLine}>
            <span className={s.pdToastText}>
              {delivered.summary.merchantName} · {delivered.order}
            </span>
            <span className={s.pdToastAmt}>{usd(delivered.total)}</span>
          </span>
        </button>

        <div className={s.pdTiles}>
          {tiles.map((tile, i) => (
            <div key={tile.label} className={s.pdTile}>
              <div className={s.pdLabel}>{tile.label}</div>
              <div className={s.pdValueBox}>
                <span data-empty={i + 1} className={s.pdValueEmpty} aria-hidden="true">
                  {tile.empty}
                </span>
                <span data-fill={i + 1} data-kind="rise" className={s.pdValue}>
                  {tile.value}
                </span>
              </div>
              {tile.note ? (
                <div data-fill={i + 1} data-kind="fade" className={s.pdNote}>
                  {tile.note}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className={cn(s.pdCard, s.pdHours)}>
          <div className={s.pdLabel}>{storyScreen.byHour}</div>
          <div className={s.pdBars}>
            {Array.from({ length: 24 }, (_, h) => {
              const list = byHour.get(h)
              const n = list?.length ?? 0
              const pct = `${(n / maxHour) * 100}%`
              const bar =
                h === delivered.hour ? (
                  <i data-fill={tiles.length + 1} data-kind="growY" className={s.pdBar} style={{ height: pct }} />
                ) : n ? (
                  <i className={s.pdBar} style={{ height: pct }} />
                ) : null
              if (!n) return <span key={h} className={s.pdBarSlot} />
              const sum = list!.reduce((a, x) => a + x.total, 0)
              const label = `${hourShort(h)}: ${n} ${n === 1 ? "sale" : "sales"}, ${usd(sum)}`
              return (
                <button
                  key={h}
                  type="button"
                  className={cn(s.pdBarSlot, s.pdBarBtn)}
                  aria-label={`${label}. Show these receipts`}
                  onMouseEnter={() => setTipHour(h)}
                  onMouseLeave={() => setTipHour(null)}
                  onFocus={() => setTipHour(h)}
                  onBlur={() => setTipHour(null)}
                  onClick={() => showHour(h)}
                >
                  {bar}
                  {tipHour === h ? (
                    <span className={cn(s.pdTip, h < 6 && s.pdTipStart, h > 18 && s.pdTipEnd)} role="status">
                      {label}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <div className={s.pdAxis} aria-hidden="true">
            <span>12a</span>
            <span>6a</span>
            <span>12p</span>
            <span>6p</span>
          </div>
        </div>

        <div className={cn(s.pdCard, s.pdItems)}>
          <div className={s.pdLabel}>{storyScreen.topItems}</div>
          {[0, 1, 2, 3].map((i) => {
            const it = topItems[i]
            return (
              <div key={i} className={s.pdItem} data-fill={itemKey + i} data-kind="rise" hidden={!it}>
                <span className={s.pdItemRank}>{i + 1}</span>
                <span className={s.pdItemName}>{it?.name}</span>
                <span className={s.pdItemTrack}>
                  <i data-fill={itemKey + i} data-kind="growX" style={{ width: `${((it?.qty ?? 0) / maxQty) * 100}%` }} />
                </span>
                <span className={s.pdItemQty}>{it?.qty}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ---- Receipts: the laptop's filter row, as one search field ---- */}
      <div
        className={cn(s.pdPanel, s.pdReceipts)}
        role="tabpanel"
        id={`${uid}-ppanel-receipts`}
        aria-labelledby={`${uid}-ptab-receipts`}
        hidden={view !== "receipts"}
      >
        <input
          type="search"
          className={s.pdSearch}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={storyScreen.searchPlaceholder}
          aria-label={storyScreen.searchPlaceholder}
        />
        <div className={s.pdListHead}>
          <span aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "receipt" : "receipts"}
          </span>
          {hourFilter != null ? (
            <button type="button" className={s.pdChip} onClick={() => setHourFilter(null)} aria-label={`Clear hour filter ${hourShort(hourFilter)}`}>
              {hourShort(hourFilter)} ×
            </button>
          ) : null}
        </div>
        <ul className={s.pdList}>
          {filtered.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                className={s.pdSale}
                onClick={(e) => openSale(x.id, e.currentTarget)}
                aria-label={`${x.order}, ${x.day} ${x.time}, ${usd(x.total)}${x.lastFour ? `, card ending ${x.lastFour}` : ""}. Open receipt`}
              >
                <span className={s.pdSaleWhat}>
                  {x.order} · {x.summary.items.map((it) => it.name).join(", ")}
                </span>
                <span className={s.pdSaleAmt}>{usd(x.total)}</span>
                <span className={s.pdSaleWhen}>
                  {x.day} · {x.time}
                  {x.lastFour ? ` · •• ${x.lastFour}` : ""}
                </span>
                <span className={cn(s.pdTag, !x.tapped && s.pdTagOff)}>{x.tapped ? storyScreen.tapped : storyScreen.printed}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className={s.pdEmpty}>{storyScreen.noMatch}</li> : null}
        </ul>
      </div>

      {/* ---- a receipt, exactly as the customer saw it ------------------ */}
      {open ? (
        <div className={s.pdSheet} role="dialog" aria-modal="true" aria-label={`Receipt ${open.order}`}>
          <div className={s.pdSheetBar}>
            <span>
              {open.order} · {storyScreen.asSeen}
            </span>
            <button type="button" ref={closeRef} onClick={closeSale} aria-label="Close receipt">
              ×
            </button>
          </div>
          <div className={s.pdSheetBody}>
            <DemoReceiptView summary={open.summary} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
