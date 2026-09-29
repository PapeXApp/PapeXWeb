"use client"

import {
  CouponRow,
  Fab,
  GlassIcon,
  HeaderCircle,
  ReceiptRow,
  Screen,
  SearchField,
  SelectCapsule,
  StatusBar,
  T,
  TabBar,
  TabTitleRow,
  TitleBubble,
  V,
  headerTop,
  type KitCoupon,
  type KitReceipt,
  type KitStore,
} from "@/components/app-kit"
import { rn as R } from "@/lib/app-kit/rnStyles"
import { pt, rn } from "@/components/app-kit/rnStyle"
import { CS, DARK, DragList, GB, ListFade, RS, Row, THEME, TWO_LINE, TabHotspots, pinnedSearchGeometry, type TabName } from "./parts"
import { StoreGrid } from "./StoreGrid"

/**
 * The Receipts, Coupons and Stores tab roots (app-reference §5), composed
 * from the kit's own parts in the order the kit's ReceiptsScreen /
 * CouponsScreen compose them, only so each row is a real button and each list
 * a real (drag) scroller. Tab bar on all three; the FAB on Receipts only.
 */

type Nav = { onTab: (t: TabName) => void; live: boolean }

/** Receipts grouped under their date section headers, in order. */
export function bySection(receipts: KitReceipt[]): [string, KitReceipt[]][] {
  const sections: [string, KitReceipt[]][] = []
  for (const r of receipts) {
    const last = sections[sections.length - 1]
    if (last && last[0] === r.section) last[1].push(r)
    else sections.push([r.section, [r]])
  }
  return sections
}

export const receiptLabel = (r: KitReceipt) => `Open the ${r.merchantName} receipt${r.amount != null ? `, $${r.amount.toFixed(2)}` : ""}`

export function ReceiptsTab({ receipts, onOpen, onTab, live }: Nav & { receipts: KitReceipt[]; onOpen: (id: string) => void }) {
  const S = RS.styles.styles
  const unreviewed = receipts.filter((r) => !r.reviewed).length
  const { searchTop, listTop } = pinnedSearchGeometry(unreviewed > 0 ? TWO_LINE : GB.HEADER_BUBBLE_HEIGHT)
  return (
    <Screen mode="dark">
      <DragList top={listTop} label="Your receipts">
        {bySection(receipts).map(([title, rows]) => (
          <V key={title}>
            <T style={rn(S.sectionHeader, { color: DARK.textSecondary })}>{title}</T>
            {rows.map((r) => (
              <Row key={r.id} label={receiptLabel(r)} onOpen={() => onOpen(r.id)}>
                <ReceiptRow receipt={r} />
              </Row>
            ))}
          </V>
        ))}
      </DragList>
      <ListFade height={listTop - 6} />
      <TabTitleRow
        left={<SelectCapsule />}
        title={
          <TitleBubble
            title="Receipts"
            meta={
              unreviewed > 0 ? (
                <V style={rn(S.headerMeta, { flexDirection: "row" })}>
                  <T style={rn(S.uncheckedCount, { color: DARK.attention, opacity: 0.6 })}>{unreviewed}</T>
                  <T style={rn(S.uncheckedLabel, { color: DARK.attention, opacity: 0.6 })}>unreviewed</T>
                </V>
              ) : undefined
            }
          />
        }
        right={<HeaderCircle glyph="filter" />}
      />
      <V style={{ ...rn(S.searchRow, { flexDirection: "row" }), position: "absolute", left: 0, right: 0, top: pt(searchTop - S.searchRow.paddingTop), zIndex: 10 }}>
        <SearchField placeholder="Search receipts..." style={{ flex: "1 1 0%" }} />
      </V>
      <Fab />
      <TabBar active="receipts" />
      <StatusBar />
      {live ? <TabHotspots active="receipts" onTab={onTab} /> : null}
    </Screen>
  )
}

/** The Coupons tab's true-empty state (coupons.tsx `emptyState` ->
 *  components/ui/EmptyState.tsx: glass hero, title, subtitle, orange button). */
function CouponsEmptyState() {
  const { colors, typography, radii } = THEME
  return (
    <V style={{ alignItems: "center", paddingTop: pt(24), paddingLeft: pt(32), paddingRight: pt(32) }}>
      <GlassIcon name="shopping" size={64} mode="dark" style={{ marginBottom: pt(16) }} />
      <T style={rn({ fontFamily: "Barlow-SemiBold", fontSize: 20, letterSpacing: -0.4, textAlign: "center", color: colors.text })}>No coupons yet</T>
      <T style={rn({ fontFamily: "Barlow-Regular", fontSize: 14, lineHeight: 21, maxWidth: 250, textAlign: "center", marginTop: 8, color: colors.textSecondary })}>
        Upload a few grocery receipts and we will unlock coupons and loyalty rewards from the stores you actually shop at.
      </T>
      <V style={rn({ height: 48, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent, borderRadius: radii.pill, marginTop: 24 })}>
        <T style={rn(typography.button, { color: colors.buttonText })}>Scan a coupon</T>
      </V>
    </V>
  )
}

export function CouponsTab({ coupons, storeFor, onOpen, onTab, live }: Nav & { coupons: KitCoupon[]; storeFor: (id: string) => KitStore; onOpen: (id: string) => void }) {
  const S = CS.styles.styles
  const controlsTop = headerTop() + GB.HEADER_BUBBLE_HEIGHT + S.titleRow.paddingBottom
  const listTop = controlsTop + CS.consts.CONTROLS_ROW_HEIGHT
  return (
    <Screen mode="dark">
      <DragList top={listTop} label="Your coupons">
        <V style={{ paddingLeft: pt(16), paddingRight: pt(16), gap: pt(R.couponRow.consts.COUPON_ROW_GAP) }}>
          {coupons.length ? (
            coupons.map((c) => {
              const store = storeFor(c.storeId)
              return (
                <Row key={c.id} label={`Open the ${store.name} coupon: ${c.title}`} onOpen={() => onOpen(c.id)}>
                  <CouponRow coupon={c} store={store} />
                </Row>
              )
            })
          ) : (
            <CouponsEmptyState />
          )}
        </V>
      </DragList>
      <ListFade height={listTop - 6} />
      <TabTitleRow
        left={<SelectCapsule />}
        title={<TitleBubble title="Coupons" />}
        right={
          <>
            <HeaderCircle>
              <GlassIcon name="heart" size={CS.consts.HEADER_GLASS_ICON} mode="dark" />
            </HeaderCircle>
            <HeaderCircle>
              <GlassIcon name="bell" size={CS.consts.HEADER_GLASS_ICON} mode="dark" />
            </HeaderCircle>
          </>
        }
      />
      <V style={{ ...rn(S.controlsRow), position: "absolute", left: 0, right: 0, top: pt(controlsTop), flexDirection: "row", gap: pt(8), zIndex: 9 }}>
        <SearchField placeholder="Search" style={{ flex: "1 1 0%" }} />
        <HeaderCircle glyph="filter" />
      </V>
      <TabBar active="coupons" />
      <StatusBar />
      {live ? <TabHotspots active="coupons" onTab={onTab} /> : null}
    </Screen>
  )
}

export function StoresTab({ stores, couponsFor, onOpen, onTab, live }: Nav & { stores: KitStore[]; couponsFor: (storeId: string) => KitCoupon[]; onOpen: (id: string) => void }) {
  const S = RS.styles.styles
  const { searchTop, listTop } = pinnedSearchGeometry()
  return (
    <Screen mode="dark">
      <DragList top={listTop} label="Stores you shop at">
        <StoreGrid stores={stores} couponsFor={couponsFor} onOpen={onOpen} />
      </DragList>
      <ListFade height={listTop - 6} />
      <TabTitleRow
        left={<SelectCapsule />}
        title={<TitleBubble title="Stores" />}
        right={
          <HeaderCircle>
            <GlassIcon name="heart" size={CS.consts.HEADER_GLASS_ICON} mode="dark" />
          </HeaderCircle>
        }
      />
      <V style={{ ...rn(S.searchRow, { flexDirection: "row" }), position: "absolute", left: 0, right: 0, top: pt(searchTop - S.searchRow.paddingTop), zIndex: 10 }}>
        <SearchField placeholder="Search" style={{ flex: "1 1 0%" }} />
      </V>
      <TabBar active="stores" />
      <StatusBar />
      {live ? <TabHotspots active="stores" onTab={onTab} /> : null}
    </Screen>
  )
}

