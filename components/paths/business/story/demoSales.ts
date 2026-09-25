import { parseEscPos } from "@/lib/escpos"
import {
  detectPaymentMethod,
  extractLastFour,
  hasStructure,
  summarizeReceipt,
  type PaymentNetwork,
  type ReceiptSummary,
} from "@/lib/receiptSummary"
import { demoReceiptBytes } from "../../customer/demoReceipt"

/**
 * DEMO DATA for the interactive dashboard at the end of the "Tap to Retain"
 * scene. One invented shop (Nook Cafe, the same invented shop as the
 * /customers demo) and a handful of invented sales from its own menu. No real
 * merchant, no real customer, no real card: the card numbers are made-up
 * last-4s on made-up receipts.
 *
 * The sale the scene follows (#1042, Jun 8) is the /customers demo receipt
 * byte-for-byte. The others are generated as ESC/POS in the SAME layout and
 * decoded through this repo's own parser (lib/escpos.ts +
 * lib/receiptSummary.ts), so every receipt the dashboard opens is rendered
 * from parsed bytes exactly like the real one — nothing is hand-typed into a
 * summary object.
 *
 * All the other sales are dated BEFORE Jun 8, so "Today" on the dashboard is
 * exactly the one sale the visitor just watched arrive. Past the hand-written
 * week, a seeded generator (fixed seed, so server and browser build the same
 * list) fills the 30 days the Insights view can show, from the same menu.
 * The shop's address lines are read back from the decoded demo receipt, so
 * every sale prints the same header as the one the scene follows.
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

const SPECS: SaleSpec[] = [
  {
    order: 1037,
    date: "Jun 7, 2026",
    time: "4:12 PM",
    server: "Maya",
    lines: [
      ["Latte", 4.75],
      ["Blueberry muffin", 3.75],
    ],
    card: "MASTERCARD ****8812",
    tapped: true,
  },
  {
    order: 1033,
    date: "Jun 7, 2026",
    time: "8:40 AM",
    server: "Jo",
    lines: [
      ["Drip coffee", 3.0],
      ["Almond croissant", 4.5],
      ["Drip coffee", 3.0],
    ],
    card: "VISA ****3310",
    tapped: false,
  },
  {
    order: 1028,
    date: "Jun 6, 2026",
    time: "12:05 PM",
    server: "Maya",
    lines: [
      ["Americano", 3.5],
      ["Sparkling water", 2.0],
    ],
    card: "AMEX ****1005",
    tapped: true,
  },
  {
    order: 1021,
    date: "Jun 5, 2026",
    time: "7:58 AM",
    server: "Jo",
    lines: [
      ["Cortado", 4.25],
      ["Oat milk add-on", 0.75],
    ],
    card: "VISA ****4729",
    tapped: true,
  },
  {
    order: 1016,
    date: "Jun 4, 2026",
    time: "10:31 AM",
    server: "Maya",
    lines: [
      ["Latte", 4.75],
      ["Oat milk add-on", 0.75],
      ["Almond croissant", 4.5],
    ],
    card: "MASTERCARD ****2207",
    tapped: false,
  },
]

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
  line("NOOK CAFE")
  out.push(0x1b, 0x21, 0x00)
  for (const h of header) line(h)
  out.push(0x0a)
  out.push(0x1b, 0x61, 0x00)
  line(`Order #${spec.order}   ${spec.date}  ${spec.time}`)
  line(`Server: ${spec.server}`)
  line("--------------------------------")
  for (const [name, price] of spec.lines) line(col(`1  ${name}`, price.toFixed(2)))
  line("--------------------------------")
  const subtotal = spec.lines.reduce((a, [, p]) => a + p, 0)
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

// ---- the generated history (days 5-29 before the delivered sale) ------------

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

const MENU: Line[] = [
  ["Drip coffee", 3.0],
  ["Latte", 4.75],
  ["Cortado", 4.25],
  ["Americano", 3.5],
  ["Chai latte", 4.5],
  ["Almond croissant", 4.5],
  ["Blueberry muffin", 3.75],
  ["Egg sandwich", 6.5],
  ["Oat milk add-on", 0.75],
  ["Sparkling water", 2.0],
]
/** How often each menu line is picked (drinks lead, like a real cafe). */
const MENU_WEIGHT = [9, 8, 5, 5, 3, 5, 3, 3, 4, 2]
const SERVERS = ["Maya", "Jo", "Theo"]
/** Invented cards: made-up last 4s, never a real number. */
const CARDS = ["VISA ****4729", "VISA ****3310", "MASTERCARD ****8812", "MASTERCARD ****2207", "AMEX ****1005", "VISA ****6158", "DISCOVER ****0931"]
/** Opening hours 7a-5p, weighted to the morning rush and lunch. */
const HOURS = [7, 7, 8, 8, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 16]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** The delivered sale's day. Everything else is dated before it. */
const TODAY = Date.UTC(2026, 5, 8)
const DAY_MS = 86_400_000

function generated(): SaleSpec[] {
  const r = prng(0x4e4f4f4b) // "NOOK"
  const pick = <T,>(list: T[], weights?: number[]) => {
    if (!weights) return list[Math.floor(r() * list.length)]
    let x = r() * weights.reduce((a, b) => a + b, 0)
    for (let i = 0; i < list.length; i++) if ((x -= weights[i]) < 0) return list[i]
    return list[list.length - 1]
  }
  const specs: SaleSpec[] = []
  let order = 1012
  for (let back = 5; back <= 29; back++) {
    const d = new Date(TODAY - back * DAY_MS)
    const perDay = 1 + Math.floor(r() * 3) + (d.getUTCDay() === 6 || d.getUTCDay() === 0 ? 1 : 0)
    const day: SaleSpec[] = []
    for (let n = 0; n < perDay; n++) {
      const hour = pick(HOURS)
      const minute = Math.floor(r() * 60)
      const lines: Line[] = []
      const count = 1 + Math.floor(r() * 3)
      for (let k = 0; k < count; k++) lines.push(pick(MENU, MENU_WEIGHT))
      day.push({
        order: 0,
        date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
        time: `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`,
        server: pick(SERVERS),
        lines,
        card: pick(CARDS),
        tapped: r() < 0.62,
        _sort: hour * 60 + minute,
      } as SaleSpec & { _sort: number })
    }
    // newest first within the day
    day.sort((a, b) => (b as SaleSpec & { _sort: number })._sort - (a as SaleSpec & { _sort: number })._sort)
    specs.push(...day)
  }
  // order numbers count down into the past, below the hand-written week's
  for (const s of specs) s.order = order--
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
    id: `sale-${order}`,
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
  const first = decode(demoReceiptBytes())
  // the delivered receipt's own header lines (address, phone), reused verbatim
  const header = first.addressLines
  cache = [
    toSale(first, true, true),
    ...[...SPECS, ...generated()].map((s) => toSale(decode(saleBytes(s, header)), s.tapped, false)),
  ]
  return cache
}
