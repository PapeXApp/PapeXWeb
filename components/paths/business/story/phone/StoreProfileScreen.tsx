"use client"

import { rn as R } from "@/lib/app-kit/rnStyles"
import { resolveBrandTreatment } from "@/lib/app-kit/vendor/brandContrast"
import {
  Button,
  CouponRow,
  FavoriteHeartGlyph,
  HeaderCircle,
  ReceiptRow,
  Screen,
  ScreenHeader,
  SegmentedControl,
  StatusBar,
  StoreHero,
  StorePlate,
  T,
  V,
  type KitCoupon,
  type KitReceipt,
  type KitStore,
} from "@/components/app-kit"
import { pt, rn } from "@/components/app-kit/rnStyle"
import { Back, DragList, PUSHED_FOOT, Row, Segmented, THEME } from "./parts"

/**
 * A store profile (app/store/[id].tsx), the BASIC template every non-partner
 * store gets (app-reference: banner, logo, name, category, Coupons | Receipts):
 * the kit's StoreHero + SegmentedControl + CouponRow / ReceiptRow in the order
 * and spacing the kit's StoreProfile lays them out (rn.storeProfile), composed
 * here so the two tabs switch and the rows open, and the page drags.
 *
 *   Coupons   the shopper's coupons from this store (for PapeX Cafe: exactly
 *             what the dashboard has switched on), else the app's empty state
 *             (components/coupons/StoreCouponsEmpty.tsx);
 *   Receipts  the shopper's receipts from this store, newest first
 *             (components/coupons/StoreReceiptsSection.tsx), else its one line.
 */

export type StoreTab = "Coupons" | "Receipts"
const SP = R.storeProfile
const C = SP.consts
const TABS: StoreTab[] = [C.STORE_TAB_LABEL.coupons as "Coupons", C.STORE_TAB_LABEL.receipts as "Receipts"]

/** StoreCouponsEmpty.tsx: headline, line, "Scan a coupon", the store's plate
 *  (the kit's own component is private to its StoreProfile). */
function CouponsEmpty({ store }: { store: KitStore }) {
  const { colors, typography, radii } = THEME
  const E = R.storeCouponsEmpty.styles.styles
  const width = 393 - 2 * C.SIDE_PADDING
  const height = Math.round(width * 0.42)
  return (
    <V>
      <T style={rn(typography.h3, { color: colors.text })}>{`No coupons from ${store.name} yet`}</T>
      <T style={rn(typography.caption, { color: colors.textSecondary, marginTop: 4 })}>Scan a coupon they give you, and it lives here.</T>
      <V style={rn(E.scanBlock)}>
        <Button title="Scan a coupon" icon="scan" fullWidth />
      </V>
      <V style={{ ...rn(E.previewBlock), borderRadius: pt(radii.lg), overflow: "hidden", height: pt(height) }}>
        <StorePlate store={store} width={width} height={height} />
      </V>
    </V>
  )
}

/** StoreReceiptsSection.tsx: an eyebrow in the store's accent, then the rows. */
function ReceiptsSection({ store, receipts, onOpen }: { store: KitStore; receipts: KitReceipt[]; onOpen: (id: string) => void }) {
  const { colors, typography, spacing } = THEME
  const accent = resolveBrandTreatment(store.brandColor, colors).accentOnGround
  if (!receipts.length)
    return <T style={rn(typography.body, { color: colors.textSecondary, textAlign: "center" })}>{`Your receipts from ${store.name} will show up here after you shop.`}</T>
  return (
    <V>
      <T style={rn(typography.eyebrow, { color: accent, marginBottom: spacing.sm, textTransform: "uppercase" })}>
        {receipts.length === 1 ? "YOUR RECEIPT" : `YOUR RECEIPTS · ${receipts.length}`}
      </T>
      {receipts.map((r) => (
        <Row key={r.id} label={`Open the ${r.merchantName} receipt${r.amount != null ? `, $${r.amount.toFixed(2)}` : ""}`} onOpen={() => onOpen(r.id)}>
          {/* inside the page's 16pt: no edge inset of its own (edgeInset={0}) */}
          <ReceiptRow receipt={r} style={{ marginLeft: 0, marginRight: 0 }} />
        </Row>
      ))}
    </V>
  )
}

export function StoreProfileScreen({
  store,
  coupons,
  receipts,
  tab,
  onTab,
  onOpenCoupon,
  onOpenReceipt,
  onBack,
  live,
}: {
  store: KitStore
  coupons: KitCoupon[]
  receipts: KitReceipt[]
  tab: StoreTab
  onTab: (t: StoreTab) => void
  onOpenCoupon: (id: string) => void
  onOpenReceipt: (id: string) => void
  onBack: () => void
  live: boolean
}) {
  const S = SP.styles.styles
  return (
    <Screen mode="dark">
      {/* the hero bleeds to the top: the page starts at 0, not under the header */}
      <DragList top={0} foot={PUSHED_FOOT} label={`${store.name} profile`} style={{ paddingLeft: pt(C.SIDE_PADDING), paddingRight: pt(C.SIDE_PADDING) }}>
        <StoreHero store={store} />
        <V style={rn(S.tabsWrap)}>
          <Segmented items={TABS} value={tab} onChange={(v) => onTab(v as StoreTab)} label={`${store.name} sections`}>
            <SegmentedControl items={TABS} value={tab} />
          </Segmented>
        </V>
        <V style={{ marginTop: pt(C.SECTION_GAP), gap: pt(R.couponRow.consts.COUPON_ROW_GAP) }}>
          {tab === "Coupons" ? (
            coupons.length ? (
              coupons.map((c) => (
                <Row key={c.id} label={`Open the ${store.name} coupon: ${c.title}`} onOpen={() => onOpenCoupon(c.id)}>
                  <CouponRow coupon={c} store={store} showHeart={false} />
                </Row>
              ))
            ) : (
              <CouponsEmpty store={store} />
            )
          ) : (
            <ReceiptsSection store={store} receipts={receipts} onOpen={onOpenReceipt} />
          )}
        </V>
      </DragList>
      <ScreenHeader
        right={
          <HeaderCircle>
            <FavoriteHeartGlyph active={false} size={22} mode="dark" />
          </HeaderCircle>
        }
      />
      <StatusBar />
      {live ? <Back label="Back" onBack={onBack} /> : null}
    </Screen>
  )
}

