"use client"

import type { ReactNode } from "react"
import { Clock, Info, MapPin, Ticket } from "lucide-react"
import { Card } from "@/app/merchant/ui/primitives"
import { T } from "@/app/merchant/ui/tokens"
import { PapexCafeLogo } from "../../PapexCafeLogo"
import { cafeCoupons, useCafeCoupons } from "../cafeCouponStore"
import { merchantCopy as c } from "./copy"

/**
 * The Profile screen of the /business §03 dashboard demo: PapeX Cafe's
 * customer-facing profile (banner in the cafe's brand colours, logo, name,
 * category, blurb), its coupons, and the about / hours / location cards.
 *
 * Everything is invented (the shop, its address, its hours). There is no
 * "Request a change" here: the demo can't send one (Nico 2026-09-29).
 *
 * The coupon switches write the shared store (cafeCouponStore.ts) that the
 * demo iPhone reads, so switching one here changes what the customer gets.
 */

/** The cafe's brand colours: the same pair the shared demo store carries. */
const BRAND = "#6B3E26"
const BRAND_2 = "#C9894B"

function InfoCard({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: T.orangeDim }}>
          <Icon className="h-4 w-4" style={{ color: T.orange }} strokeWidth={2} />
        </span>
        <div className="truncate font-barlow text-base font-medium" style={{ color: T.text }}>
          {title}
        </div>
      </div>
      {children}
    </Card>
  )
}

export function CafeProfile({ desk, demoPill }: { desk: boolean; demoPill: ReactNode }) {
  const coupons = useCafeCoupons()
  const logo = desk ? 96 : 76

  return (
    <div className="flex flex-col gap-5">
      {/* The profile as a customer sees it */}
      <figure className="flex flex-col gap-2">
        <figcaption className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
          {c.profileCaption}
        </figcaption>
        <div className="overflow-hidden rounded-[20px] border" style={{ borderColor: T.glassBorder, background: T.glassBgSolid }}>
          <div
            aria-hidden
            className={`relative ${desk ? "h-32" : "h-24"}`}
            style={{
              background: `radial-gradient(120% 140% at 88% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%), linear-gradient(120deg, ${BRAND} 0%, #8E5430 52%, ${BRAND_2} 100%)`,
            }}
          >
            {/* the steam's dotted trail, echoing the logo */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 128" preserveAspectRatio="none">
              <path
                d="M-10 118 C 90 96, 150 30, 260 44 S 380 20, 420 -6"
                fill="none"
                stroke="rgba(255,244,232,0.35)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="0.1 12"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className={`relative flex ${desk ? "gap-5 px-6 pb-6" : "gap-3.5 px-4 pb-5"}`}>
            <div className="shrink-0 rounded-full" style={{ marginTop: -logo / 2, padding: 4, background: T.glassBgSolid, height: logo + 8 }}>
              <PapexCafeLogo size={logo} />
            </div>
            <div className="min-w-0 flex-1 pt-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <p className={`font-barlow font-medium leading-tight ${desk ? "text-2xl" : "text-xl"}`} style={{ color: T.text }}>
                  {c.merchantLabel}
                </p>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: "rgba(201,137,75,0.18)", color: "#E7B98A" }}>
                  {c.category}
                </span>
              </div>
              <p className="mt-1.5 text-sm" style={{ color: T.textSecondary }}>
                {c.blurb}
              </p>
            </div>
          </div>
        </div>
      </figure>

      {/* Coupons: not a screen of the live dashboard yet, so labelled as demo */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: T.orangeDim }}>
              <Ticket className="h-4 w-4" style={{ color: T.orange }} strokeWidth={2} />
            </span>
            <div className="truncate font-barlow text-base font-medium" style={{ color: T.text }}>
              {c.coupons.title}
            </div>
          </div>
          {demoPill}
        </div>
        <p className="text-sm" style={{ color: T.textSecondary }}>
          {c.coupons.lead}
        </p>
        <div className="flex flex-col gap-2">
          {coupons.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3" style={{ borderColor: T.glassBorder }}>
              <span className="text-sm" style={{ color: T.text }}>
                {it.title}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={it.on}
                aria-label={it.title}
                data-coupon={it.id}
                onClick={() => cafeCoupons.toggle(it.id)}
                className="flex items-center gap-2 rounded-full text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                style={{ color: it.on ? T.text : T.textMuted }}
              >
                {it.on ? c.coupons.on : c.coupons.off}
                <span className="relative h-5 w-9 rounded-full transition" style={{ background: it.on ? T.orange : "rgba(255,255,255,0.14)" }}>
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: it.on ? "translateX(16px)" : "none" }} />
                </span>
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className={`grid gap-3 ${desk ? "grid-cols-3" : ""}`}>
        <InfoCard icon={Info} title={c.aboutTitle}>
          <p className="text-sm leading-relaxed" style={{ color: T.textSecondary }}>
            {c.about}
          </p>
        </InfoCard>
        <InfoCard icon={Clock} title={c.hoursTitle}>
          <dl className="flex flex-col gap-1.5 text-sm">
            {c.hours.map(([d, h]) => (
              <div key={d} className="flex justify-between gap-3">
                <dt className="whitespace-nowrap" style={{ color: T.textSecondary }}>{d}</dt>
                <dd className="whitespace-nowrap" style={{ color: T.text }}>
                  {h}
                </dd>
              </div>
            ))}
          </dl>
        </InfoCard>
        <InfoCard icon={MapPin} title={c.locationTitle}>
          <address className="text-sm not-italic leading-relaxed" style={{ color: T.textSecondary }}>
            {c.address.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </address>
        </InfoCard>
      </div>
    </div>
  )
}
