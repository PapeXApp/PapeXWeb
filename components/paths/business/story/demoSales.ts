import { parseEscPos } from "@/lib/escpos"
import { extractLastFour, summarizeReceipt, type ReceiptSummary } from "@/lib/receiptSummary"
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
 * exactly the one sale the visitor just watched arrive.
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

function saleBytes(spec: SaleSpec): Uint8Array {
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
  line("412 Walnut St")
  line("Syracuse, NY 13202")
  line("(315) 555-0142")
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

export type DemoSale = {
  id: string
  order: string
  /** "Jun 8" — the day, for the date filter */
  day: string
  /** "10:24 AM" */
  time: string
  hour: number
  total: number
  lastFour: string | null
  tapped: boolean
  summary: ReceiptSummary
  /** true for the sale the scene followed */
  delivered: boolean
}

const decode = (bytes: Uint8Array) => summarizeReceipt(parseEscPos(bytes).lines)

function toSale(summary: ReceiptSummary, tapped: boolean, delivered: boolean): DemoSale {
  const dl = summary.dateline ?? ""
  // the order number is a body line of the receipt, not part of the dateline
  const order = summary.bodyLines.map((l) => /Order\s*#\s*(\d+)/i.exec(l.text)?.[1]).find(Boolean) ?? "?"
  const day = /\b([A-Z][a-z]{2})[a-z]*\.?\s+(\d{1,2})/.exec(dl)
  const t = /\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i.exec(dl)
  let hour = t ? Number(t[1]) % 12 : 0
  if (t && t[3].toUpperCase() === "PM") hour += 12
  return {
    id: `sale-${order}`,
    order: `#${order}`,
    day: day ? `${day[1]} ${day[2]}` : "",
    time: t ? `${Number(t[1])}:${t[2]} ${t[3].toUpperCase()}` : "",
    hour,
    total: summary.total ?? 0,
    lastFour: summary.paymentLine ? extractLastFour(summary.paymentLine) : null,
    tapped,
    summary,
    delivered,
  }
}

let cache: DemoSale[] | null = null

/** Newest first: the delivered sale, then the invented history. */
export function demoSales(): DemoSale[] {
  if (cache) return cache
  cache = [toSale(decode(demoReceiptBytes()), true, true), ...SPECS.map((s) => toSale(decode(saleBytes(s)), s.tapped, false))]
  return cache
}
