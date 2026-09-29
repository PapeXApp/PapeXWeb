import type { Ref } from "react"
import {
  AppKitRoot,
  CouponRow,
  Fab,
  GlassIcon,
  HeaderCircle,
  headerTop,
  ReceiptRow,
  Screen,
  SearchField,
  SelectCapsule,
  T,
  TabBar,
  TabTitleRow,
  TitleBubble,
  V,
  appTheme,
  type KitCoupon,
  type KitReceipt,
} from "@/components/app-kit"
import { pt, rn } from "@/components/app-kit/rnStyle"
import { rn as R } from "@/lib/app-kit/rnStyles"
import { cn } from "@/lib/utils"
import { StatusBar } from "../appui"
import { demoStore } from "./pocketData"
import s from "./pocket.module.css"

/**
 * The two PapeX app tabs the §02 scene lands in, each with ONE slot for the
 * item the paper turns into. Composed from the app kit's own parts
 * (components/app-kit — ports of PapeXV2's receipts.tsx / coupons.tsx) in the
 * order and geometry the kit's ReceiptsScreen / CouponsScreen use; the only
 * difference is that the new item and the list under it are wrapped in two
 * boxes the scene can move:
 *
 *   `newRef`   the new item's block (a "Today" header + row, or a coupon row).
 *              Starts transparent; fades in as the paper sinks into it.
 *   `restRef`  everything below it. Starts lifted by the new block's height
 *              (measured) so the list looks whole before the scan, then slides
 *              down to make room.
 *   `slotRef`  the row itself — what the paper flies at.
 *
 * With `landed` (the static version) both boxes simply sit at rest.
 *
 * Positions are iPhone points on a 393 x 852 screen (`--pt`, set by
 * AppKitRoot from the phone's --wp-w). All data is invented.
 */

type SlotRefs = {
  newRef?: Ref<HTMLDivElement>
  restRef?: Ref<HTMLDivElement>
  slotRef?: Ref<HTMLDivElement>
  landed?: boolean
}

const GB = R.glassBubble.consts
/** GlassBubble.tsx `headerBubbleTwoLineHeight()` at fontScale 1 (as the kit). */
const TWO_LINE = GB.HEADER_BUBBLE_TITLE_LINE_HEIGHT * 2 + GB.BUBBLE_PADDING_VERTICAL * 2

/** Scroll content, absolutely placed at its first-frame offset (as the kit). */
function Scroll({ top, children, style }: { top: number; children: React.ReactNode; style?: React.CSSProperties }) {
  return <V style={{ position: "absolute", left: 0, right: 0, top: pt(top), ...style }}>{children}</V>
}

function groupBySection(receipts: KitReceipt[]) {
  const sections: [string, KitReceipt[]][] = []
  for (const r of receipts) {
    const last = sections[sections.length - 1]
    if (last && last[0] === r.section) last[1].push(r)
    else sections.push([r.section, [r]])
  }
  return sections
}

/**
 * Receipts tab (app/(tabs)/receipts.tsx): title row with "N unreviewed", the
 * search field, the list grouped by date, the orange FAB, the tab bar.
 * `unreviewed` is passed in so the scene can flip it the moment the scan
 * lands (the kit derives it from the list).
 */
export function PocketReceiptsScreen({
  scanned,
  earlier,
  unreviewed,
  time,
  newRef,
  restRef,
  slotRef,
  landed = false,
}: SlotRefs & { scanned: KitReceipt; earlier: KitReceipt[]; unreviewed: number; time: string }) {
  const mode = "dark" as const
  const { colors } = appTheme(mode)
  const RS = R.receiptsScreen
  const S = RS.styles.styles
  const twoLine = unreviewed > 0
  const bubbleH = twoLine ? TWO_LINE : GB.HEADER_BUBBLE_HEIGHT
  const searchTop = headerTop() + bubbleH + S.header.paddingBottom + S.searchRow.paddingTop
  const listTop = searchTop + RS.consts.SEARCH_BAR_HEIGHT + RS.consts.HEADER_CONTENT_GAP_BOTTOM
  const header = (title: string) => <T style={rn(S.sectionHeader, { color: colors.textSecondary })}>{title}</T>

  return (
    <AppKitRoot mode={mode} width="var(--wp-w)" className={s.kitRoot}>
      <Screen mode={mode}>
        <Scroll top={listTop}>
          <div ref={newRef} className={cn(s.col, s.newBlock, landed && s.newLanded)}>
            {header(scanned.section)}
            <div ref={slotRef} className={s.col}>
              <ReceiptRow receipt={scanned} mode={mode} />
            </div>
          </div>
          <div ref={restRef} className={cn(s.col, s.restBlock)}>
            {groupBySection(earlier).map(([title, rows]) => (
              <V key={title}>
                {header(title)}
                {rows.map((r) => (
                  <ReceiptRow key={r.id} receipt={r} mode={mode} />
                ))}
              </V>
            ))}
          </div>
        </Scroll>
        <TabTitleRow
          mode={mode}
          left={<SelectCapsule mode={mode} />}
          title={
            <TitleBubble
              mode={mode}
              title="Receipts"
              meta={
                twoLine ? (
                  <V style={rn(S.headerMeta, { flexDirection: "row" })}>
                    <T style={rn(S.uncheckedCount, { color: colors.attention, opacity: 0.6 })}>{unreviewed}</T>
                    <T style={rn(S.uncheckedLabel, { color: colors.attention, opacity: 0.6 })}>unreviewed</T>
                  </V>
                ) : undefined
              }
            />
          }
          right={<HeaderCircle glyph="filter" mode={mode} />}
        />
        <V
          style={{
            ...rn(S.searchRow, { flexDirection: "row" }),
            position: "absolute",
            left: 0,
            right: 0,
            top: pt(searchTop - S.searchRow.paddingTop),
            zIndex: 10,
          }}
        >
          <SearchField mode={mode} placeholder="Search receipts..." style={{ flex: "1 1 0%" }} />
        </V>
        <Fab mode={mode} />
        <TabBar active="receipts" mode={mode} />
      </Screen>
      <StatusBar time={time} />
    </AppKitRoot>
  )
}

/** Coupons tab (app/(tabs)/coupons.tsx): title row, search + filter, the list, the tab bar (no FAB). */
export function PocketCouponsScreen({
  scanned,
  earlier,
  time,
  newRef,
  restRef,
  slotRef,
  landed = false,
}: SlotRefs & { scanned: KitCoupon; earlier: KitCoupon[]; time: string }) {
  const mode = "dark" as const
  const CS = R.couponsScreen
  const S = CS.styles.styles
  const gap = pt(R.couponRow.consts.COUPON_ROW_GAP)
  const controlsTop = headerTop() + GB.HEADER_BUBBLE_HEIGHT + S.titleRow.paddingBottom
  const listTop = controlsTop + CS.consts.CONTROLS_ROW_HEIGHT

  return (
    <AppKitRoot mode={mode} width="var(--wp-w)" className={s.kitRoot}>
      <Screen mode={mode}>
        <Scroll top={listTop} style={{ paddingLeft: pt(16), paddingRight: pt(16), gap }}>
          <div ref={newRef} className={cn(s.col, s.newBlock, landed && s.newLanded)}>
            <div ref={slotRef} className={s.col}>
              <CouponRow coupon={scanned} store={demoStore(scanned.storeId)} mode={mode} />
            </div>
          </div>
          <div ref={restRef} className={cn(s.col, s.restBlock)} style={{ gap }}>
            {earlier.map((c) => (
              <CouponRow key={c.id} coupon={c} store={demoStore(c.storeId)} mode={mode} />
            ))}
          </div>
        </Scroll>
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
        <V
          style={{
            ...rn(S.controlsRow),
            position: "absolute",
            left: 0,
            right: 0,
            top: pt(controlsTop),
            flexDirection: "row",
            gap: pt(8),
            zIndex: 9,
          }}
        >
          <SearchField mode={mode} placeholder="Search" style={{ flex: "1 1 0%" }} />
          <HeaderCircle glyph="filter" mode={mode} />
        </V>
        <TabBar active="coupons" mode={mode} />
      </Screen>
      <StatusBar time={time} />
    </AppKitRoot>
  )
}
