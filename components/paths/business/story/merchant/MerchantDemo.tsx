"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowLeft, BarChart3, ChevronRight, Download, Radio, Receipt, Search, Store, Ticket } from "lucide-react"
// The LIVE dashboard's own presentational pieces, imported read-only. Nothing
// in app/merchant is edited for this demo, and nothing here can reach it: the
// data below is passed in from the marketing page, never fetched, and there
// is no URL/cookie switch — merchant.papex.app never renders this file.
import { Button, Card, DeviceStatusPill, FilterPill, Input, PaymentChip, StatTile } from "@/app/merchant/ui/primitives"
import { T } from "@/app/merchant/ui/tokens"
import { formatMoney, hourLabel, hourLabelLong } from "@/app/merchant/ui/format"
import { BarChart } from "@/app/merchant/insights/BarChart"
import { BrandHeaderPreview } from "@/app/merchant/profile/BrandHeaderPreview"
import { SectionCard } from "@/app/merchant/profile/sections"
import { ReceiptView } from "@/app/r/ui"
import { demoSales } from "../demoSales"
import { merchantCopy as c } from "./copy"
import { DOW, demoDevices, insightsFor, type DemoWindow } from "./data"

/**
 * The merchant dashboard (merchant.papex.app) as a working demo on the
 * /business page: the real screens — Transactions (search, filters, CSV),
 * a receipt, Insights, Devices, Profile — built from app/merchant's own
 * primitives and tokens, laid out the way app/merchant/layout.tsx lays them
 * out: a sidebar on a laptop (`layout="desktop"`), a top bar + bottom tab
 * bar on a phone (`layout="mobile"`). The layout is a prop, not a viewport
 * breakpoint, because the "laptop" is a drawing on a wide page.
 *
 * The Intelligence tabs are not shown (not a live feature). Profile carries
 * a coupons MOCK, labelled "Demo data" like everything else here.
 *
 * Scroll-scene contract (RetainStory.tsx): the delivered sale's row is
 * `data-fill="0"` and the count line `data-fill="1"` / `data-empty="1"`. Every
 * view stays mounted (hidden with `display: none`), and every row is always
 * rendered (filtered ones hidden), so the scene's once-collected elements
 * never go stale. `reset` changing puts everything back to the delivered
 * frame.
 */

type View = "tx" | "insights" | "devices" | "profile"

const NAV: { id: View; label: string; icon: typeof Receipt }[] = [
  { id: "tx", label: c.nav.tx, icon: Receipt },
  { id: "insights", label: c.nav.insights, icon: BarChart3 },
  { id: "devices", label: c.nav.devices, icon: Radio },
  { id: "profile", label: c.nav.profile, icon: Store },
]

const show = (on: boolean) => (on ? undefined : ({ display: "none" } as const))

function DemoPill() {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide"
      style={{ background: T.orangeDim, color: T.orange }}
    >
      {c.demoTag}
    </span>
  )
}

function Brand({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-barlow text-lg font-medium tracking-tight" style={{ color: T.text }}>
        {c.brand}
      </span>
      <span className={small ? "h-[6px] w-[6px] rounded-sm" : "h-[7px] w-[7px] rounded-sm"} style={{ background: T.orange }} aria-hidden />
      {small ? null : (
        <span className="ml-1 text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
          {c.brandTag}
        </span>
      )}
    </div>
  )
}

export function MerchantDemo({ layout, reset = 0 }: { layout: "desktop" | "mobile"; reset?: number }) {
  const desk = layout === "desktop"
  const sales = demoSales()
  const delivered = sales[0]

  const [view, setView] = useState<View>("tx")
  const [openId, setOpenId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [hour, setHour] = useState<number | null>(null)
  const [dow, setDow] = useState<number | null>(null)
  const [win, setWin] = useState<DemoWindow>("7d")
  const [note, setNote] = useState(false)
  const [coupons, setCoupons] = useState<boolean[]>(() => c.coupons.items.map((i) => i.on))

  // Back to the frame the scroll scene delivered.
  useEffect(() => {
    setView("tx")
    setOpenId(null)
    setQ("")
    setMin("")
    setMax("")
    setFrom("")
    setTo("")
    setHour(null)
    setDow(null)
    setWin("7d")
    setNote(false)
    setCoupons(c.coupons.items.map((i) => i.on))
  }, [reset])

  const go = (v: View) => {
    setView(v)
    setOpenId(null)
    setNote(false)
  }

  const match = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/^#/, "")
    const lo = min.trim() === "" ? null : Number(min)
    const hi = max.trim() === "" ? null : Number(max)
    return (x: (typeof sales)[number]) => {
      if (
        needle &&
        !x.receiptNumber.includes(needle) &&
        !(x.lastFour ?? "").includes(needle) &&
        !"tidewick cafe".includes(needle) &&
        !x.summary.items.some((it) => it.name.toLowerCase().includes(needle))
      )
        return false
      if (lo != null && Number.isFinite(lo) && x.total < lo) return false
      if (hi != null && Number.isFinite(hi) && x.total > hi) return false
      if (from && x.iso < from) return false
      if (to && x.iso > to) return false
      if (hour != null && x.hour !== hour) return false
      if (dow != null && x.dow !== dow) return false
      return true
    }
  }, [q, min, max, from, to, hour, dow])
  const matched = sales.filter(match).length
  const anyFilter = Boolean(q || min || max || from || to || hour != null || dow != null)
  const clearAll = () => {
    setQ("")
    setMin("")
    setMax("")
    setFrom("")
    setTo("")
    setHour(null)
    setDow(null)
  }

  const pills: { key: string; label: string; clear: () => void }[] = []
  if (q) pills.push({ key: "q", label: `Search: "${q}"`, clear: () => setQ("") })
  if (min) pills.push({ key: "min", label: `Min ${formatMoney(Number(min))}`, clear: () => setMin("") })
  if (max) pills.push({ key: "max", label: `Max ${formatMoney(Number(max))}`, clear: () => setMax("") })
  if (hour != null) pills.push({ key: "hour", label: `Hour: ${hourLabelLong(hour)}`, clear: () => setHour(null) })
  if (dow != null) pills.push({ key: "dow", label: `Day: ${DOW[dow]}`, clear: () => setDow(null) })

  const ins = useMemo(() => insightsFor(win), [win])
  /** Insights drill-through: the clicked bar or item, over the same window. */
  const drill = (patch: { hour?: number; dow?: number; q?: string }) => {
    clearAll()
    const days = win === "today" ? 1 : win === "7d" ? 7 : 30
    const start = sales.find((s) => s.daysAgo === 0)!.iso
    const d = new Date(`${start}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - (days - 1))
    setFrom(d.toISOString().slice(0, 10))
    setTo(start)
    if (patch.hour != null) setHour(patch.hour)
    if (patch.dow != null) setDow(patch.dow)
    if (patch.q) setQ(patch.q)
    go("tx")
  }

  const exportCsv = () => {
    const rows = sales.filter(match)
    const csv = [
      "Date,Time,Receipt #,Total,Payment,Card last 4",
      ...rows.map((r) => [r.iso, r.time, r.receiptNumber, r.total.toFixed(2), r.network ?? "", r.lastFour ?? ""].join(",")),
    ].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "papex-demo-transactions.csv"
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const open = openId ? sales.find((s) => s.id === openId) : undefined

  // ---- screens -------------------------------------------------------------

  const title = (text: string, sub: string, right?: ReactNode) => (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
          {text}
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
          {sub}
        </p>
      </div>
      {right}
    </div>
  )

  const tx = (
    <div className="flex flex-col gap-5" style={show(view === "tx" && !open)}>
      {title(
        c.txTitle,
        c.txSub,
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" strokeWidth={2} />
          {c.exportCsv}
        </Button>,
      )}
      <Card className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.textMuted }} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.searchPlaceholder} aria-label={c.searchPlaceholder} className="w-full pl-9" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            {c.min}
            <Input type="number" inputMode="decimal" min={0} step="0.01" value={min} onChange={(e) => setMin(e.target.value)} className="w-20" />
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            {c.max}
            <Input type="number" inputMode="decimal" min={0} step="0.01" value={max} onChange={(e) => setMax(e.target.value)} className="w-20" />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            {c.from}
            <Input type="date" value={from} min={sales[sales.length - 1].iso} max={delivered.iso} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            {c.to}
            <Input type="date" value={to} min={sales[sales.length - 1].iso} max={delivered.iso} onChange={(e) => setTo(e.target.value)} />
          </label>
          {from || to ? (
            <button
              type="button"
              onClick={() => {
                setFrom("")
                setTo("")
              }}
              className="text-xs font-medium underline underline-offset-2"
              style={{ color: T.textSecondary }}
            >
              {c.clear}
            </button>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {pills.map((p) => (
          <FilterPill key={p.key} label={p.label} onClear={p.clear} />
        ))}
        {pills.length > 0 ? (
          <button type="button" onClick={clearAll} className="text-xs font-medium underline underline-offset-2" style={{ color: T.textSecondary }}>
            {c.clearAll}
          </button>
        ) : null}
        <span className="ml-auto grid text-xs" style={{ color: T.textMuted }} aria-live="polite">
          {/* the "before" twin: hidden unless the scroll scene shows it */}
          <span data-empty={1} style={{ gridArea: "1 / 1", opacity: 0 }} aria-hidden="true">
            {`${matched - 1} matching transactions`}
          </span>
          <span data-fill={1} data-kind="fade" style={{ gridArea: "1 / 1" }}>
            {`${matched} matching transaction${matched === 1 ? "" : "s"}`}
          </span>
        </span>
      </div>

      {anyFilter && matched === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border py-16 text-center" style={{ background: T.glassBg, borderColor: T.glassBorder }}>
          <h3 className="font-barlow text-lg font-medium" style={{ color: T.text }}>
            {c.noMatchTitle}
          </h3>
          <p className="max-w-sm text-sm" style={{ color: T.textSecondary }}>
            {c.noMatchBody}
          </p>
          <button type="button" onClick={clearAll} className="mt-2 text-sm font-medium underline underline-offset-2" style={{ color: T.orange }}>
            {c.clearFilters}
          </button>
        </div>
      ) : null}

      <div style={show(!(anyFilter && matched === 0))}>
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: T.divider }}>
                  {[...c.headers, ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((t) => (
                  <tr
                    key={t.id}
                    data-fill={t.delivered ? 0 : undefined}
                    data-kind={t.delivered ? "rise" : undefined}
                    onClick={() => setOpenId(t.id)}
                    className="cursor-pointer border-b transition hover:bg-white/[0.03]"
                    style={{ borderColor: T.divider, ...show(match(t)) }}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div style={{ color: T.text }}>{t.day}</div>
                      <div className="text-xs" style={{ color: T.textMuted }}>
                        {t.time}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium" style={{ color: T.text }}>
                      {formatMoney(t.total)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <PaymentChip method={t.network} last4={t.lastFour} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5" style={{ color: T.textSecondary }}>
                      {t.receiptNumber}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenId(t.id)
                        }}
                        aria-label={`Open receipt ${t.order}, ${t.day} ${t.time}, ${formatMoney(t.total)}`}
                        className="inline-flex rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                      >
                        <ChevronRight className="h-4 w-4" style={{ color: T.textMuted }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )

  const receipt = open ? (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpenId(null)}
        className="flex w-fit items-center gap-1.5 text-sm font-medium transition hover:opacity-80"
        style={{ color: T.textSecondary }}
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        {c.back}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-barlow text-xl font-medium" style={{ color: T.text }}>
            {c.receipt} {open.order}
          </h1>
          <p className="text-sm" style={{ color: T.textSecondary }}>
            {`${DOW[open.dow]}, ${open.day}, ${open.iso.slice(0, 4)}, ${open.time}`}
          </p>
        </div>
        <PaymentChip method={open.network} last4={open.lastFour} />
      </div>
      <ReceiptView summary={open.summary} hasStructure={open.hasStructure} />
    </div>
  ) : null

  const tap = ins.tapRate
  const insights = (
    <div className="flex flex-col gap-5" style={show(view === "insights")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
            {c.insightsTitle}
          </h1>
          <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
            {c.insightsSub}
          </p>
        </div>
        <div className="flex rounded-full border p-1" style={{ borderColor: T.glassBorder }} role="group" aria-label="Date range">
          {c.windows.map((w) => (
            <button
              key={w.value}
              type="button"
              aria-pressed={win === w.value}
              onClick={() => setWin(w.value)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition"
              style={{ background: win === w.value ? T.orange : "transparent", color: win === w.value ? "#181A20" : T.textSecondary }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`grid gap-3 ${desk ? "grid-cols-4" : "grid-cols-2"}`}>
        <StatTile label={c.tiles.count} value={String(ins.count)} />
        <StatTile label={c.tiles.gross} value={formatMoney(ins.gross)} />
        <StatTile label={c.tiles.avg} value={formatMoney(ins.avgTicket)} />
        <Card className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            {c.tiles.tap}
          </span>
          <span className="font-barlow text-[28px] font-medium leading-none" style={{ color: T.text }}>
            {tap.rate == null ? "—" : `${tap.rate.toFixed(1)}%`}
          </span>
          <span className="text-xs" style={{ color: T.textSecondary }}>
            {c.tapSub(tap.claimed, tap.total)}
          </span>
        </Card>
      </div>
      <div className={`grid gap-4 ${desk ? "grid-cols-2" : ""}`}>
        <Card>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            {c.byHour}
          </h2>
          {ins.count === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: T.textMuted }}>
              {c.noneYet}
            </p>
          ) : (
            <BarChart
              data={ins.byHour.map((b) => ({ label: hourLabel(b.hour), value: b.count, sub: formatMoney(b.gross) }))}
              sparseLabels
              formatValue={(v) => `${v} txn${v === 1 ? "" : "s"}`}
              chartLabel="Transactions by hour of day"
              onBarClick={(i) => drill({ hour: ins.byHour[i].hour })}
            />
          )}
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            {c.byDay}
          </h2>
          <BarChart
            data={ins.byDay.map((b) => ({ label: b.label, value: b.count, sub: formatMoney(b.gross) }))}
            formatValue={(v) => `${v} txn${v === 1 ? "" : "s"}`}
            chartLabel="Transactions by day of week"
            onBarClick={(i) => drill({ dow: ins.byDay[i].day })}
          />
        </Card>
      </div>
      <Card>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
          {c.topItems} <span style={{ fontWeight: 400, textTransform: "none" }}>{c.approximate}</span>
        </h2>
        <div className="flex flex-col gap-1">
          {ins.topItems.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => drill({ q: item.name })}
              aria-label={`View transactions for ${item.name}`}
              className="flex items-center gap-3 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: T.orange }}
            >
              <span className="w-5 shrink-0 text-xs" style={{ color: T.textMuted }}>
                {i + 1}
              </span>
              <span className="w-32 shrink-0 truncate text-sm" style={{ color: T.text }}>
                {item.name}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max((item.count / ins.topItems[0].count) * 100, 6)}%`, background: T.orange }} />
              </div>
              <span className="w-8 shrink-0 text-right text-xs" style={{ color: T.textSecondary }}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )

  const devices = (
    <div className="flex flex-col gap-5" style={show(view === "devices")}>
      {title(c.devicesTitle, c.devicesSub)}
      <div className={`grid gap-3 ${desk ? "grid-cols-2" : ""}`}>
        {demoDevices.map((d) => (
          <Card key={d.deviceId} className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: T.orangeDim }}>
              <Radio className="h-5 w-5" style={{ color: T.orange }} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="truncate font-barlow text-base font-medium" style={{ color: T.text }}>
                  {d.label}
                </h2>
                <DeviceStatusPill status={d.status} />
              </div>
              <p className="mt-0.5 text-xs" style={{ color: T.textMuted }}>
                {d.deviceId} · {c.lastUpload} {d.last}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const request = () => setNote(true)
  const profile = (
    <div className="flex flex-col gap-5" style={show(view === "profile")}>
      {title(
        c.profileTitle,
        c.profileSub,
        <Button onClick={request}>{c.requestChange}</Button>,
      )}
      {note ? (
        <p role="status" className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: T.glassBorder, background: "rgba(16,185,129,0.1)", color: T.textSecondary }}>
          {c.requestNote}
        </p>
      ) : null}
      <BrandHeaderPreview name={c.merchantLabel} brandColor="#6B3E26" brandColorSecondary="#C9894B" category={c.category} blurb={c.blurb} />

      {/* The coupons MOCK: not a screen of the live dashboard yet. */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: T.orangeDim }}>
              <Ticket className="h-4 w-4" style={{ color: T.orange }} strokeWidth={2} />
            </span>
            <h2 className="truncate font-barlow text-base font-medium" style={{ color: T.text }}>
              {c.coupons.title}
            </h2>
          </div>
          <DemoPill />
        </div>
        <p className="text-sm" style={{ color: T.textSecondary }}>
          {c.coupons.lead}
        </p>
        <div className="flex flex-col gap-2">
          {c.coupons.items.map((it, i) => (
            <div key={it.title} className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3" style={{ borderColor: T.glassBorder }}>
              <span className="text-sm" style={{ color: T.text }}>
                {it.title}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={coupons[i]}
                aria-label={it.title}
                onClick={() => setCoupons((cur) => cur.map((v, k) => (k === i ? !v : v)))}
                className="flex items-center gap-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70 rounded-full"
                style={{ color: coupons[i] ? T.text : T.textMuted }}
              >
                {coupons[i] ? c.coupons.on : c.coupons.off}
                <span className="relative h-5 w-9 rounded-full transition" style={{ background: coupons[i] ? T.orange : "rgba(255,255,255,0.14)" }}>
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: coupons[i] ? "translateX(16px)" : "none" }} />
                </span>
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className={`grid gap-3 ${desk ? "grid-cols-2" : ""}`}>
        <SectionCard section="about" onRequest={request}>
          <p className="text-sm leading-relaxed" style={{ color: T.textSecondary }}>
            {c.about}
          </p>
        </SectionCard>
        <SectionCard section="hours" onRequest={request}>
          <dl className="flex flex-col gap-1.5 text-sm">
            {c.hours.map(([d, h]) => (
              <div key={d} className="flex justify-between gap-3">
                <dt style={{ color: T.textSecondary }}>{d}</dt>
                <dd style={{ color: T.text }}>{h}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      </div>
    </div>
  )

  const content = (
    <>
      {tx}
      {receipt}
      {insights}
      {devices}
      {profile}
    </>
  )

  // ---- the shell (app/merchant/layout.tsx AuthedShell) -----------------------

  if (desk) {
    return (
      <div className="font-barlow relative h-full w-full overflow-hidden text-left" style={{ background: T.pageBg, color: T.text }}>
        <aside className="absolute inset-y-0 left-0 z-20 flex w-60 flex-col border-r px-4 py-6" style={{ borderColor: T.glassBorder, background: "rgba(12,15,20,0.6)" }}>
          <div className="mb-8 px-2">
            <Brand />
          </div>
          <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = view === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                  style={{ color: active ? T.text : T.textSecondary, background: active ? T.orangeDim : "transparent" }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} style={{ color: active ? T.orange : T.textMuted }} />
                  {label}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-3 border-t pt-4" style={{ borderColor: T.glassBorder }}>
            <div className="flex items-center gap-2.5 px-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium" style={{ background: T.orangeDim, color: T.orange }}>
                N
              </div>
              <span className="min-w-0 truncate text-sm" style={{ color: T.textSecondary }}>
                {c.merchantLabel}
              </span>
            </div>
            <div className="px-2">
              <DemoPill />
            </div>
          </div>
        </aside>
        <main className="absolute inset-y-0 left-60 right-0 overflow-y-auto px-8 pb-10 pt-8">
          {content}
        </main>
      </div>
    )
  }

  return (
    <div className="font-barlow relative h-full w-full overflow-hidden text-left" style={{ background: T.pageBg, color: T.text }}>
      <main className="absolute inset-0 overflow-y-auto px-4 pb-28 pt-[116px]">
        {content}
      </main>
      {/* Mobile top bar (below the phone's status bar area) */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b px-4 pb-3 pt-12" style={{ borderColor: T.glassBorder, background: "rgba(12,15,20,0.85)" }}>
        <Brand small />
        <DemoPill />
      </header>
      {/* Mobile bottom nav */}
      <nav className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-around border-t px-2 pb-5 pt-2" style={{ borderColor: T.glassBorder, background: "rgba(12,15,20,0.9)" }} aria-label="Dashboard">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={active ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
              style={{ color: active ? T.orange : T.textMuted }}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className="max-w-full truncate">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
