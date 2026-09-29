import {
  AppKitRoot,
  CouponRow,
  GlassIcon,
  HeaderCircle,
  ReceiptsScreen,
  Screen,
  SearchField,
  SelectCapsule,
  TabBar,
  TabTitleRow,
  TitleBubble,
  V,
  demoCoupons,
  headerTop,
} from "@/components/app-kit"
import { pt, rn } from "@/components/app-kit/rnStyle"
import { rn as R } from "@/lib/app-kit/rnStyles"
import type { ReceiptSummary } from "@/lib/receiptSummary"
import { cn } from "@/lib/utils"
import { StatusBar } from "../../customer/appui/Chrome"
import { walkReceipts } from "../../customer/appui"
import x from "../../customer/appui/appScreens.module.css"
import { cafeReceipt, cafeStoreFor } from "../papexCafe"

/**
 * The hero loop's PapeX app (Receipts tab, then Coupons tab) with the demo
 * shop shown as PapeX Cafe. It is customer/appui's WalkAppScreen, re-composed
 * here because that file (and the kit's CouponsScreen) look the shop up in the
 * shared demo data, where it is still "Tidewick Cafe" for /customers. The
 * Coupons tab is composed from the kit's own parts in the order the kit's
 * CouponsScreen composes them, only so each row can take the renamed store.
 */

const GB = R.glassBubble.consts
const CS = R.couponsScreen

function CafeCouponsScreen() {
  const S = CS.styles.styles
  const controlsTop = headerTop() + GB.HEADER_BUBBLE_HEIGHT + S.titleRow.paddingBottom
  const listTop = controlsTop + CS.consts.CONTROLS_ROW_HEIGHT
  const mode = "dark" as const
  return (
    <Screen mode={mode}>
      <V
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: pt(listTop),
          paddingLeft: pt(16),
          paddingRight: pt(16),
          gap: pt(R.couponRow.consts.COUPON_ROW_GAP),
        }}
      >
        {demoCoupons.map((c) => (
          <CouponRow key={c.id} coupon={c} store={cafeStoreFor(c.storeId)} mode={mode} isFavorite={false} />
        ))}
      </V>
      <TabTitleRow
        mode={mode}
        left={<SelectCapsule mode={mode} />}
        title={<TitleBubble mode={mode} title="Coupons" />}
        right={
          <>
            <HeaderCircle mode={mode}>
              <GlassIcon name="heart" size={CS.consts.HEADER_GLASS_ICON} mode={mode} />
            </HeaderCircle>
            <HeaderCircle mode={mode}>
              <GlassIcon name="bell" size={CS.consts.HEADER_GLASS_ICON} mode={mode} />
            </HeaderCircle>
          </>
        }
      />
      <V style={{ ...rn(S.controlsRow), position: "absolute", left: 0, right: 0, top: pt(controlsTop), flexDirection: "row", gap: pt(8), zIndex: 9 }}>
        <SearchField mode={mode} placeholder="Search" style={{ flex: "1 1 0%" }} />
        <HeaderCircle glyph="filter" mode={mode} />
      </V>
      <TabBar active="coupons" mode={mode} />
    </Screen>
  )
}

export function CafeWalkAppScreen({ summary, coupons, time }: { summary: ReceiptSummary; coupons: boolean; time: string }) {
  // Row 1 IS the decoded receipt, shown under the shop's PapeX Cafe name.
  const receipts = walkReceipts(summary).map((r) => cafeReceipt(r))
  return (
    <AppKitRoot mode="dark" width="var(--wp-w)" className={x.root}>
      <div className={cn(x.layer, !coupons && x.on)} aria-hidden={coupons}>
        <ReceiptsScreen receipts={receipts} statusBar={false} />
      </div>
      <div className={cn(x.layer, coupons && x.on)} aria-hidden={!coupons}>
        <CafeCouponsScreen />
      </div>
      <StatusBar time={time} />
    </AppKitRoot>
  )
}
