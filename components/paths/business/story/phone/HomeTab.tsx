"use client"

import {
  CouponRow,
  Fab,
  GlassCard,
  GlassIcon,
  Glyph,
  ReceiptRow,
  Screen,
  SegmentedControl,
  StatusBar,
  T,
  TabBar,
  Tag,
  V,
  headerTop,
  type KitCoupon,
  type KitReceipt,
  type KitStore,
} from "@/components/app-kit"
import type { GlassIconName } from "@/components/app-kit/GlassIcon"
import { rn as R } from "@/lib/app-kit/rnStyles"
import { tabBarMetrics } from "@/lib/app-kit/tokens"
import { pt, rn } from "@/components/app-kit/rnStyle"
import { receiptLabel } from "./ListTabs"
import { DragList, ListFade, Row, Segmented, THEME, TabHotspots, type TabName } from "./parts"
import { SHOPPER } from "./data"
import { StoreGrid } from "./StoreGrid"

/**
 * Home (app/(tabs)/home.tsx, app-reference §5 Home), at rest, top to bottom:
 * the PapeX logo, the greeting + avatar, the "This month" summary strip
 * (HomeSummaryStrip), "Quick actions" (Inbox · Stats · Groups), the section
 * title, the Receipts | Coupons | Stores bar, the count pill + orange hint,
 * the first ten of that list, and "See All" resting on the FAB's centre.
 * Built from the kit's parts; the numbers are home.tsx's own StyleSheet
 * values (LOGO 80x32, HOME_CHROME_GAP 8, HOME_BODY_GAP 12, pills minHeight 86).
 */

export type HomeKind = "Receipts" | "Coupons" | "Stores"
const KINDS: HomeKind[] = ["Receipts", "Coupons", "Stores"]
const LIMIT = 10

const { colors, typography, spacing, radii } = THEME
const COUNT_TEXT_DARK = "rgba(255,255,255,0.60)"
const CHROME_GAP = spacing.sm
const BODY_GAP = 12
const FAB = R.floatingFab.consts
/** "See All" is centred on the FAB (home.tsx FAB_CENTER_ABOVE_BAR): the FAB's
 *  centre sits this far above the screen bottom. */
const FAB_CENTRE_FROM_BOTTOM = 34 + tabBarMetrics.TAB_BAR_HEIGHT + FAB.FAB_TO_NAV_GAP + 48 / 2
const SEE_ALL_H = 17 + 2 * spacing.md

const money = (n: number) => `$${n.toFixed(2)}`

function Eyebrow({ children, style }: { children: string; style?: Record<string, unknown> }) {
  return <T style={rn(typography.eyebrow, { lineHeight: 14, color: colors.textMuted, textTransform: "uppercase" }, style)}>{children}</T>
}

function QuickAction({ icon, label }: { icon: GlassIconName; label: string }) {
  return (
    <GlassCard padding="md" emphasis="neutral" radius={radii.lg} style={{ flex: "1 1 0%", minWidth: 0, minHeight: pt(86) }} contentStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", gap: pt(8) }}>
      <GlassIcon name={icon} size={26} mode="dark" />
      <T lines={1} style={rn({ fontFamily: "Barlow-SemiBold", fontSize: 13, textAlign: "center", color: colors.text })}>
        {label}
      </T>
    </GlassCard>
  )
}

export function HomeTab({
  receipts,
  coupons,
  stores,
  couponsFor,
  storeFor,
  month,
  kind,
  onKind,
  onOpenReceipt,
  onOpenCoupon,
  onOpenStore,
  onTab,
  live,
}: {
  receipts: KitReceipt[]
  coupons: KitCoupon[]
  stores: KitStore[]
  couponsFor: (storeId: string) => KitCoupon[]
  storeFor: (id: string) => KitStore
  month: { total: number; count: number }
  kind: HomeKind
  onKind: (k: HomeKind) => void
  onOpenReceipt: (id: string) => void
  onOpenCoupon: (id: string) => void
  onOpenStore: (id: string) => void
  onTab: (t: TabName) => void
  live: boolean
}) {
  const unreviewed = receipts.slice(0, LIMIT).filter((r) => !r.reviewed).length
  const hint =
    kind === "Receipts"
      ? unreviewed > 0
        ? { icon: "swap" as const, text: "Swipe a receipt to review it" }
        : { icon: "check-circle" as const, text: "All caught up — every receipt reviewed" }
      : kind === "Coupons"
        ? { icon: "check-circle" as const, text: "You're caught up on new offers" }
        : { icon: "store" as const, text: "Tap a store to open its profile" }
  const seeAllTab: TabName = kind === "Receipts" ? "receipts" : kind === "Coupons" ? "coupons" : "stores"

  return (
    <Screen mode="dark">
      <DragList top={headerTop()} foot={FAB_CENTRE_FROM_BOTTOM - SEE_ALL_H / 2} label="Home" style={{ paddingLeft: pt(spacing.md), paddingRight: pt(spacing.md) }}>
        {/* the logo, in the scroll */}
        <V style={{ height: pt(32), alignItems: "center", justifyContent: "center", marginBottom: pt(spacing.lg) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app/kit/brand/main_logo.png" alt="PapeX" style={{ width: pt(80), height: pt(32), objectFit: "contain" }} draggable={false} />
        </V>

        {/* greeting + avatar */}
        <V style={{ flexDirection: "row", alignItems: "center" }}>
          <V style={{ flex: "1 1 0%", minWidth: 0 }}>
            <T style={rn({ fontFamily: "Barlow-Regular", fontSize: 14, color: colors.textMuted })}>Good morning,</T>
            <T lines={1} style={rn({ fontFamily: "Barlow-Bold", fontSize: 26, letterSpacing: -0.52, marginBottom: CHROME_GAP, color: colors.text })}>
              {SHOPPER.name}
            </T>
          </V>
          <V style={{ padding: pt(2) }}>
            <V style={{ width: pt(34), height: pt(34), borderRadius: pt(17), alignItems: "center", justifyContent: "center", backgroundImage: `linear-gradient(180deg, ${colors.brandGradient[0]}, ${colors.brandGradient[1]})` }}>
              <T style={rn({ fontFamily: "Barlow-Medium", fontSize: 14, color: "#FFFFFF" })}>{SHOPPER.name.charAt(0)}</T>
            </V>
          </V>
        </V>

        {/* the summary strip (HomeSummaryStrip on StatCardShell) */}
        <GlassCard padding="none" emphasis="neutral" radius={radii.xl} frost={1} style={{ marginBottom: pt(spacing.lg) }} contentStyle={{ paddingLeft: pt(20), paddingRight: pt(20), paddingTop: pt(18), paddingBottom: pt(16) }}>
          <V style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Eyebrow style={{ fontSize: 10, marginBottom: 8 }}>This month</Eyebrow>
            <V style={{ flexDirection: "row", alignItems: "center", gap: pt(2) }}>
              <T style={rn(typography.label, { color: colors.accentLight })}>Insights</T>
              <Glyph name="chevron-forward" size={16} color={colors.accentLight} />
            </V>
          </V>
          <V style={{ flexDirection: "row", alignItems: "baseline", gap: pt(10) }}>
            <T style={rn(typography.stat, { lineHeight: 34, color: colors.text })}>{money(month.total)}</T>
            <T style={rn(typography.caption, { color: COUNT_TEXT_DARK })}>{`${month.count} ${month.count === 1 ? "receipt" : "receipts"}`}</T>
          </V>
        </GlassCard>

        {/* quick actions */}
        <V style={{ marginBottom: pt(CHROME_GAP) }}>
          <Eyebrow>Quick actions</Eyebrow>
        </V>
        <V style={{ flexDirection: "row", gap: pt(spacing.sm + 2) }}>
          <QuickAction icon="envelope" label="Inbox" />
          <QuickAction icon="chart-bar" label="Stats" />
          <QuickAction icon="team" label="Groups" />
        </V>

        {/* section title, the bar, the count pill + hint */}
        <V style={{ marginTop: pt(spacing.lg) }}>
          <Eyebrow>{kind === "Stores" ? "Stores you shop at" : "Recent"}</Eyebrow>
        </V>
        <V style={{ marginTop: pt(CHROME_GAP) }}>
          <Segmented items={KINDS} value={kind} onChange={(v) => onKind(v as HomeKind)} label="Browse">
            <SegmentedControl items={KINDS} value={kind} />
          </Segmented>
        </V>
        <V style={{ marginTop: pt(spacing.md - spacing.xs), flexDirection: "row", alignItems: "center", minWidth: 0 }}>
          {kind === "Receipts" && unreviewed > 0 ? (
            <V style={{ marginRight: pt(spacing.sm), flexShrink: 0 }}>
              <Tag tone="attention" icon="warning" label={`${unreviewed} unreviewed`} />
            </V>
          ) : null}
          <Glyph name={hint.icon} size={14} color={colors.orange} />
          <T lines={1} style={rn(typography.caption, { marginLeft: 4, flexShrink: 1, fontSize: 12, lineHeight: 20, color: colors.orange })}>
            {hint.text}
          </T>
        </V>

        {/* the body */}
        <V style={{ marginTop: pt(BODY_GAP) }}>
          {kind === "Receipts"
            ? receipts.slice(0, LIMIT).map((r) => (
                <Row key={r.id} label={receiptLabel(r)} onOpen={() => onOpenReceipt(r.id)}>
                  <ReceiptRow receipt={r} style={{ marginLeft: 0, marginRight: 0 }} />
                </Row>
              ))
            : null}
          {kind === "Coupons" ? (
            <V style={{ gap: pt(R.couponRow.consts.COUPON_ROW_GAP) }}>
              {coupons.slice(0, LIMIT).map((c) => {
                const store = storeFor(c.storeId)
                return (
                  <Row key={c.id} label={`Open the ${store.name} coupon: ${c.title}`} onOpen={() => onOpenCoupon(c.id)}>
                    <CouponRow coupon={c} store={store} />
                  </Row>
                )
              })}
            </V>
          ) : null}
          {kind === "Stores" ? <StoreGrid stores={stores.slice(0, LIMIT)} couponsFor={couponsFor} onOpen={onOpenStore} padded={false} /> : null}
        </V>

        {/* See All -> the tab */}
        <Row label={`See all ${kind.toLowerCase()}`} onOpen={() => onTab(seeAllTab)} style={{ marginTop: pt(kind === "Receipts" ? 0 : BODY_GAP) }}>
          <V style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: pt(4), padding: pt(spacing.md), height: pt(SEE_ALL_H) }}>
            <T style={rn(typography.label, { color: colors.orange })}>See All</T>
            <Glyph name="chevron-forward" size={16} color={colors.orange} />
          </V>
        </Row>
      </DragList>
      {/* what scrolls up fades under the status bar */}
      <ListFade height={headerTop() - 8} />
      <Fab />
      <TabBar active="home" />
      <StatusBar />
      {live ? <TabHotspots active="home" onTab={onTab} /> : null}
    </Screen>
  )
}
