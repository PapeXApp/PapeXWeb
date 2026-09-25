import type { DeviceStatus } from "@/lib/merchantApi"
import { demoSales, type DemoSale } from "../demoSales"

/**
 * DEMO DATA for the merchant dashboard in /business §03, in the shapes the
 * live dashboard's screens read (lib/merchantApi.ts: InsightsWindow, the
 * insights buckets, TapRate, MerchantDevice). Every sale is an invented Nook
 * Cafe receipt decoded through lib/escpos.ts (demoSales.ts); the devices are
 * invented too. Nothing here is fetched, and nothing reaches app/merchant:
 * the marketing component passes it down as props.
 *
 * Why not lib/merchantMock.ts: that file already exists and is the LIVE
 * dashboard's own local-design fixtures (NEXT_PUBLIC_MERCHANT_MOCK, dead in
 * production). Importing it here would pull its 46-row dataset into the
 * marketing bundle, and editing it would change the dashboard's dev mock.
 */

export type DemoWindow = "today" | "7d" | "30d"

const WINDOW_DAYS: Record<DemoWindow, number> = { today: 1, "7d": 7, "30d": 30 }

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function salesIn(window: DemoWindow): DemoSale[] {
  return demoSales().filter((s) => s.daysAgo < WINDOW_DAYS[window])
}

export function insightsFor(window: DemoWindow) {
  const rows = salesIn(window)
  const gross = Math.round(rows.reduce((a, r) => a + r.total, 0) * 100) / 100
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0, gross: 0 }))
  const byDay = Array.from({ length: 7 }, (_, day) => ({ day, label: DOW[day], count: 0, gross: 0 }))
  const items = new Map<string, number>()
  for (const r of rows) {
    byHour[r.hour].count += 1
    byHour[r.hour].gross = Math.round((byHour[r.hour].gross + r.total) * 100) / 100
    byDay[r.dow].count += 1
    byDay[r.dow].gross = Math.round((byDay[r.dow].gross + r.total) * 100) / 100
    // the live insights count receipts an item appears on, not units
    for (const name of new Set(r.summary.items.map((i) => i.name))) items.set(name, (items.get(name) ?? 0) + 1)
  }
  const topItems = [...items.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))
  const claimed = rows.filter((r) => r.tapped).length
  return {
    count: rows.length,
    gross,
    avgTicket: rows.length ? Math.round((gross / rows.length) * 100) / 100 : 0,
    byHour,
    byDay,
    topItems,
    tapRate: { rate: rows.length ? Math.round((claimed / rows.length) * 1000) / 10 : null, claimed, total: rows.length },
  }
}

export const demoDevices: { deviceId: string; label: string; status: DeviceStatus; last: string }[] = [
  { deviceId: "papex-0417", label: "Front counter", status: "ok", last: "2 mins ago" },
  { deviceId: "papex-0418", label: "Pickup window", status: "ok", last: "1 hour ago" },
]

export type { DemoSale }
