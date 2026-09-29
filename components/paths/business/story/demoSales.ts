import { parseEscPos } from "@/lib/escpos"
import {
  detectPaymentMethod,
  extractLastFour,
  hasStructure,
  summarizeReceipt,
  type PaymentNetwork,
  type ReceiptSummary,
} from "@/lib/receiptSummary"
import { papexCafeReceiptBytes } from "../papexCafe"

/**
 * DEMO DATA for the interactive dashboard at the end of the "Tap to Retain"
 * scene. One invented shop (PapeX Cafe — Nico 2026-09-29: every demo dashboard
 * uses "PapeX Cafe"; no real store by that name found) and 30 days of invented
 * sales from its own invented menu, at the volume of a busy neighbourhood cafe
 * (Nico 2026-09-29: ~$6k a week, ~$25k a month, 70-100 sales a day, ~$11-12
 * a ticket). No real merchant, no real customer, no real card: every
 * generated receipt prints "Card ************" (12 stars, like a paper receipt) and an obvious test last-4
 * (4242 / 0005 / 4444).
 *
 * The sale the scene follows (#1042, Jun 8, 10:24 AM) is the /customers demo
 * receipt byte-for-byte (the phone shows it; don't change it here). The others
 * are generated as ESC/POS in the SAME layout and decoded through this repo's
 * own parser (lib/escpos.ts + lib/receiptSummary.ts), so every receipt the
 * dashboard opens is rendered from parsed bytes exactly like the real one —
 * nothing is hand-typed into a summary object. The shop's address lines are
 * read back from the decoded demo receipt, so every sale prints the same
 * header as the one the scene follows.
 *
 * Order numbers restart at #1001 every morning, like a cafe POS, so the
 * delivered #1042 is the 42nd sale of Jun 8 and "Today" holds the 41 morning
 * sales before it plus the delivered one, which stays the newest row.
 * A seeded generator (fixed seed, so server and browser build the same list:
 * no hydration mismatch) follows the posted hours (Mon-Fri 7-6, Sat-Sun 8-4),
 * with a morning peak, a lunch bump and busier weekends.
 */

type Line = [name: string, price: number]
type SaleSpec = {
  order: number
  /** "Jun 7, 2026" */
  date: string
  /** "4:12 PM" */
  time: string
  server: string
  lines: Line[]
  card: string
  /** the customer tapped for the digital receipt */
  tapped: boolean
}

/** A receipt line in the demo receipt's 32-column layout. */
const col = (left: string, right: string) => {
  const w = 32 - right.length
  return left.length >= w ? `${left.slice(0, w - 1)} ${right}` : left.padEnd(w) + right
}

function saleBytes(spec: SaleSpec, header: string[]): Uint8Array {
  const out: number[] = []
  const txt = (s: string) => {
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xff)
  }
  const line = (s: string) => {
    txt(s)
    out.push(0x0a)
  }
  out.push(0x1b, 0x40)
  out.push(0x1b, 0x61, 0x01)
  out.push(0x1b, 0x21, 0x30)
  line("PAPEX CAFE")
  out.push(0x1b, 0x21, 0x00)
  for (const h of header) line(h)
  out.push(0x0a)
  out.push(0x1b, 0x61, 0x00)
  line(`Order #${spec.order}   ${spec.date}  ${spec.time}`)
  line(`Server: ${spec.server}`)
  line("--------------------------------")
  for (const [name, price] of spec.lines) line(col(`1  ${name}`, price.toFixed(2)))
  line("--------------------------------")
  const subtotal = Math.round(spec.lines.reduce((a, [, p]) => a + p, 0) * 100) / 100
  const tax = Math.round(subtotal * 8) / 100
  line(col("Subtotal", subtotal.toFixed(2)))
  line(col("Tax (8%)", tax.toFixed(2)))
  out.push(0x1b, 0x45, 0x01)
  line(col("TOTAL", (subtotal + tax).toFixed(2)))
  out.push(0x1b, 0x45, 0x00)
  out.push(0x0a)
  line(`${spec.card}   APPROVED`)
  out.push(0x0a)
  out.push(0x1b, 0x61, 0x01)
  line("Thanks for stopping in!")
  out.push(0x1d, 0x56, 0x00)
  return new Uint8Array(out)
}

// ---- the generated history --------------------------------------------------

/** Deterministic PRNG (mulberry32): same list on the server and in the browser. */
function prng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Weighted = [name: string, price: number, weight: number]

// The invented menu. Prices of the four items on the delivered receipt match it.
const DRINKS: Weighted[] = [
  ["Drip coffee", 3.25, 10],
  ["Latte", 5.25, 12],
  ["Cortado", 4.25, 6],
  ["Cappuccino", 5.0, 7],
  ["Americano", 4.0, 6],
  ["Cold brew", 5.0, 7],
  ["Chai latte", 5.25, 5],
  ["Matcha latte", 5.75, 4],
  ["Mocha", 5.75, 3],
  ["Sparkling water", 2.0, 2],
  ["Fresh orange juice", 5.5, 2],
]
/** Drinks that take milk, so an oat-milk or extra-shot add-on can follow them. */
const MILK = new Set(["Latte", "Cortado", "Cappuccino", "Chai latte", "Matcha latte", "Mocha"])
const FOOD_MORNING: Weighted[] = [
  ["Almond croissant", 4.5, 8],
  ["Butter croissant", 4.0, 6],
  ["Blueberry muffin", 4.0, 5],
  ["Egg sandwich", 8.5, 7],
  ["Breakfast burrito", 10.5, 5],
  ["Avocado toast", 11.0, 5],
  ["Yogurt parfait", 7.0, 3],
]
const FOOD_LUNCH: Weighted[] = [
  ["Turkey pesto sandwich", 12.5, 7],
  ["Grain bowl", 13.0, 6],
  ["Tomato soup", 7.5, 4],
  ["Avocado toast", 11.0, 4],
  ["Chicken salad wrap", 12.0, 5],
  ["Almond croissant", 4.5, 3],
  ["Chocolate chip cookie", 3.5, 4],
]
const FOOD_AFTERNOON: Weighted[] = [
  ["Almond croissant", 4.5, 4],
  ["Chocolate chip cookie", 3.5, 6],
  ["Blueberry muffin", 4.0, 3],
  ["Banana bread", 4.25, 4],
]
const SERVERS = ["Maya", "Jo", "Theo", "Sam"]
/** Invented cards: the well-known TEST last-4s, never a real card or brand. */
const CARDS = ["Card ************4242", "Card ************4242", "Card ************0005", "Card ************4444"]

/** Sales per open hour: a morning rush, a lunch bump, a quiet close. */
const WEEKDAY_HOURS: [hour: number, weight: number][] = [
  [7, 9], [8, 14], [9, 12], [10, 9], [11, 8], [12, 11], [13, 9], [14, 6], [15, 6], [16, 5], [17, 3],
]
const WEEKEND_HOURS: [hour: number, weight: number][] = [
  [8, 9], [9, 14], [10, 15], [11, 13], [12, 12], [13, 10], [14, 8], [15, 5],
]
/** A full day's sales by weekday (Sun..Sat): weekends are the busy days. */
const DAY_BASE = [90, 70, 68, 70, 72, 78, 96]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** The delivered sale's day. Everything else is dated before it, or earlier that morning. */
const TODAY = Date.UTC(2026, 5, 8)
const DAY_MS = 86_400_000
/** The delivered sale is Order #1042 at 10:24 AM: 41 sales that morning before it. */
const TODAY_BEFORE = 41
const DELIVERED_MINUTE = 10 * 60 + 24
const DAYS = 30

function generated(): SaleSpec[] {
  const r = prng(0x4e4f4f4b) // fixed seed, unrelated to the store's name
  const pick = <T,>(list: readonly T[], weight: (t: T) => number): T => {
    let x = r() * list.reduce((a, t) => a + weight(t), 0)
    for (const t of list) if ((x -= weight(t)) < 0) return t
    return list[list.length - 1]
  }
  const specs: SaleSpec[] = []
  for (let back = 0; back < DAYS; back++) {
    const d = new Date(TODAY - back * DAY_MS)
    const dow = d.getUTCDay()
    const weekend = dow === 0 || dow === 6
    const hours = weekend ? WEEKEND_HOURS : WEEKDAY_HOURS
    // a gentle month of growth, plus day-to-day noise
    const growth = 0.9 + 0.1 * (1 - back / (DAYS - 1))
    const count = back === 0 ? TODAY_BEFORE : Math.round(DAY_BASE[dow] * growth * (0.93 + r() * 0.14))
    // today: only the morning, before the delivered sale
    const open = back === 0 ? hours.filter(([h]) => h * 60 < DELIVERED_MINUTE) : hours
    const minutes: number[] = []
    for (let n = 0; n < count; n++) {
      const [hour] = pick(open, ([h, w]) => (back === 0 && h === 10 ? (w * 24) / 60 : w))
      const span = back === 0 && hour === 10 ? DELIVERED_MINUTE - 600 : 60
      minutes.push(hour * 60 + Math.floor(r() * span))
    }
    minutes.sort((a, b) => a - b)
    const date = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
    // tap-rate adoption grows over the month (~34% -> ~48%)
    const tapP = 0.34 + 0.14 * (1 - back / (DAYS - 1))
    const day: SaleSpec[] = minutes.map((m, i) => {
      const hour = Math.floor(m / 60)
      const food = hour < 11 ? FOOD_MORNING : hour < 14 ? FOOD_LUNCH : FOOD_AFTERNOON
      const size = pick([1, 2, 3, 4], (k) => [38, 40, 16, 6][k - 1])
      const lines: Line[] = []
      for (let k = 0; k < size; k++) {
        const drink = k === 0 ? r() < 0.85 : r() < 0.45
        const [name, price] = pick(drink ? DRINKS : food, (it) => it[2])
        lines.push([name, price])
        if (drink && MILK.has(name)) {
          if (r() < 0.25) lines.push(["Oat milk add-on", 0.75])
          else if (r() < 0.1) lines.push(["Extra shot", 1.25])
        }
      }
      return {
        order: 1001 + i,
        date,
        time: `${hour % 12 || 12}:${String(m % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`,
        server: SERVERS[Math.floor(r() * SERVERS.length)],
        lines,
        card: CARDS[Math.floor(r() * CARDS.length)],
        tapped: r() < tapP,
      }
    })
    // newest first within the day
    specs.push(...day.reverse())
  }
  return specs
}

export type DemoSale = {
  id: string
  order: string
  /** "1042", as the dashboard's "Receipt #" column shows it */
  receiptNumber: string
  /** "Jun 8" — the day, for the date filter */
  day: string
  /** "2026-06-08", for the From / To date inputs */
  iso: string
  /** "10:24 AM" */
  time: string
  hour: number
  /** 0 Sun ... 6 Sat */
  dow: number
  /** whole days before the delivered sale (0 = "Today") */
  daysAgo: number
  total: number
  network: PaymentNetwork | null
  lastFour: string | null
  tapped: boolean
  summary: ReceiptSummary
  hasStructure: boolean
  /** true for the sale the scene followed */
  delivered: boolean
}

const decode = (bytes: Uint8Array) => summarizeReceipt(parseEscPos(bytes).lines)

function toSale(summary: ReceiptSummary, tapped: boolean, delivered: boolean): DemoSale {
  const dl = summary.dateline ?? ""
  // the order number is a body line of the receipt, not part of the dateline
  const order = summary.bodyLines.map((l) => /Order\s*#\s*(\d+)/i.exec(l.text)?.[1]).find(Boolean) ?? "?"
  const date = /\b([A-Z][a-z]{2})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(dl)
  const t = /\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i.exec(dl)
  let hour = t ? Number(t[1]) % 12 : 0
  if (t && t[3].toUpperCase() === "PM") hour += 12
  const utc = date ? Date.UTC(Number(date[3]), MONTHS.indexOf(date[1]), Number(date[2])) : TODAY
  const iso = new Date(utc).toISOString().slice(0, 10)
  return {
    // order numbers restart daily, so the id carries the day too
    id: `sale-${iso}-${order}`,
    order: `#${order}`,
    receiptNumber: order,
    day: date ? `${date[1]} ${date[2]}` : "",
    iso,
    time: t ? `${Number(t[1])}:${t[2]} ${t[3].toUpperCase()}` : "",
    hour,
    dow: new Date(utc).getUTCDay(),
    daysAgo: Math.round((TODAY - utc) / DAY_MS),
    total: summary.total ?? 0,
    network: summary.paymentLine ? detectPaymentMethod(summary.paymentLine) : null,
    lastFour: summary.paymentLine ? extractLastFour(summary.paymentLine) : null,
    tapped,
    summary,
    hasStructure: hasStructure(summary),
    delivered,
  }
}

let cache: DemoSale[] | null = null

/** Newest first: the delivered sale, then the invented history. */
export function demoSales(): DemoSale[] {
  if (cache) return cache
  const first = decode(papexCafeReceiptBytes())
  // the delivered receipt's own header lines (address, phone), reused verbatim
  const header = first.addressLines
  cache = [toSale(first, true, true), ...generated().map((s) => toSale(decode(saleBytes(s, header)), s.tapped, false))]
  return cache
}
