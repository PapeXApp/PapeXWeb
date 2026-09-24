import type { ReceiptSummary } from "@/lib/receiptSummary"
import { cn } from "@/lib/utils"
import { storyScreen } from "../story"
import { orderLabel, receiptHour, usd } from "./receipt"
import s from "../story.module.css"

/**
 * The merchant dashboard on the laptop's screen, DRAWN rather than a
 * screenshot, so the receipt the spark delivers can visibly land on it: the
 * tiles go from empty to this one sale, the sale's hour gets its bar, and its
 * items fill the top-items list.
 *
 * It is a mock of app/merchant/insights (sidebar, "Insights" title, range
 * pills, Transactions / Gross / Avg ticket / Tap rate tiles, busiest hours,
 * top items) in the dashboard's OWN palette (app/merchant/ui/tokens.ts:
 * #181A20 page, #FB8500 orange) — it depicts that product, like the old
 * screenshot did. Every figure on it is derived from the one decoded demo
 * receipt, so the screen shows nothing but the sale the visitor just watched:
 * no invented totals, no invented shop.
 *
 * The CSS default is the FILLED screen (what reduced motion and the static
 * layout show). The scroll scene collects every `[data-fill]` element once,
 * and drives each one's reveal from progress; `[data-empty]` twins are the
 * "nothing yet" values they replace. `data-kind` picks the motion:
 * fade | rise | growY | growX.
 */
export function Dashboard({ summary, className }: { summary: ReceiptSummary; className?: string }) {
  const hour = receiptHour(summary)
  const items = summary.items.slice(0, 4)
  const total = usd(summary.total)
  const t = storyScreen.tiles
  let k = 1
  const tiles: { label: string; empty: string; value: string; note?: string }[] = [
    { label: t.count, empty: "0", value: "1" },
    { label: t.gross, empty: "$0.00", value: total },
    { label: t.avg, empty: "—", value: total },
    { label: t.tap, empty: "—", value: "1 of 1", note: t.tapNote },
  ]
  const itemKey = tiles.length + 2

  return (
    <div className={cn(s.dash, className)}>
      <aside className={s.dashSide}>
        <div className={s.dashBrand}>
          <span>{storyScreen.brand}</span>
          <i aria-hidden="true" />
          <small>{storyScreen.brandTag}</small>
        </div>
        {storyScreen.nav.map((label) => (
          <div key={label} className={cn(s.dashNav, label === storyScreen.title && s.dashNavOn)}>
            <i aria-hidden="true" />
            {label}
          </div>
        ))}
      </aside>

      <div className={s.dashMain}>
        <div className={s.dashTop}>
          <div>
            <div className={s.dashTitle}>{storyScreen.title}</div>
            <div className={s.dashSub}>{storyScreen.subtitle}</div>
          </div>
          <div className={s.dashRanges}>
            {storyScreen.ranges.map((r, i) => (
              <span key={r} className={cn(i === 0 && s.dashRangeOn)}>
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className={s.dashTiles}>
          {tiles.map((tile) => {
            const key = k++
            return (
              <div key={tile.label} className={s.dashTile}>
                <div className={s.dashLabel}>{tile.label}</div>
                <div className={s.dashValueBox}>
                  <span data-empty={key} className={s.dashValueEmpty}>
                    {tile.empty}
                  </span>
                  <span data-fill={key} data-kind="rise" className={s.dashValue}>
                    {tile.value}
                  </span>
                </div>
                {tile.note ? (
                  <div data-fill={key} data-kind="fade" className={s.dashNote}>
                    {tile.note}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className={s.dashRow}>
          <div className={cn(s.dashCard, s.dashHours)}>
            <div className={s.dashCardTitle}>{storyScreen.byHour}</div>
            <div className={s.dashBars}>
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className={s.dashBarSlot}>
                  {h === hour ? <i data-fill={tiles.length + 1} data-kind="growY" className={s.dashBar} /> : null}
                </span>
              ))}
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
            {items.map((item, i) => (
              <div key={item.label} className={s.dashItem} data-fill={itemKey + i} data-kind="rise">
                <span className={s.dashItemRank}>{i + 1}</span>
                <span className={s.dashItemName}>{item.name}</span>
                <span className={s.dashItemTrack}>
                  <i data-fill={itemKey + i} data-kind="growX" />
                </span>
                <span className={s.dashItemQty}>{item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* The receipt itself, arriving: the first thing the spark fills. */}
        <div className={s.dashToast} data-fill={0} data-kind="rise">
          <span className={s.dashToastDot} aria-hidden="true" />
          <span className={s.dashToastLead}>{storyScreen.newReceipt}</span>
          <span className={s.dashToastText}>
            {summary.merchantName}
            {orderLabel(summary) ? ` · ${orderLabel(summary)}` : ""}
          </span>
          <span className={s.dashToastAmt}>{total}</span>
          <span className={s.dashToastTag}>{storyScreen.tapped}</span>
        </div>
      </div>
    </div>
  )
}
