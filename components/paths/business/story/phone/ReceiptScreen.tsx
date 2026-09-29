"use client"

import { rn as R } from "@/lib/app-kit/rnStyles"
import { getReceiptSourceLabel } from "@/lib/app-kit/vendor/receiptOrigin"
import { GlassCard, Glyph, HeaderCircle, MerchantLogo, PillButton, Screen, ScreenHeader, StatusBar, T, Tag, V, type KitReceipt } from "@/components/app-kit"
import { rn } from "@/components/app-kit/rnStyle"
import { Back, DARK, DragList, ListFade, PUSHED_FOOT, PUSHED_TOP } from "./parts"

/**
 * The receipt detail (app/receiptDetail.tsx, app-reference §6), composed from
 * the kit's parts in the exact order and styles the kit's ReceiptDetail uses,
 * for two reasons the kit's static screen can't serve:
 *   - it SCROLLS (DragList), so the Items and Totals cards (the Payment line)
 *     are reachable, not cut off at the phone's bottom edge;
 *   - the Receipt Sharing "Add" pill is CENTRED in its row. The kit's (and the
 *     app's) PillButton body carries `alignSelf: 'flex-start'`, which beats the
 *     row's `alignItems: 'center'`, so the 30pt pill sat at the top of the 44pt
 *     field row: 7pt high of centre while the field's text was centred. The fix
 *     is the cross-axis rule itself, `alignSelf: 'center'`, on this pill — no
 *     offset. (The same one-liner belongs in app-kit Screens.tsx and in
 *     PapeXV2 receiptDetail.tsx; both are outside this task.)
 */

/** app/receiptDetail.tsx `getReceiptSourceEmoji` (verbatim, as the kit ports it). */
function receiptSourceEmoji(source: KitReceipt["source"]): string {
  switch (source) {
    case "email":
      return "✉️"
    case "manual":
      return "✍️"
    case "clover":
      return "💳"
    default:
      return "📷"
  }
}

export function ReceiptScreen({ receipt: r, onBack, backLabel, live }: { receipt: KitReceipt; onBack: () => void; backLabel: string; live: boolean }) {
  const colors = DARK
  const S = R.receiptDetail.styles.styles
  const shared = (r.sharedWith?.length ?? 0) > 0
  const heading = (text: string, orange = false) => <T style={rn(S.sectionTitle, { color: orange ? colors.orange : colors.text })}>{text}</T>
  const pickerCard = (glyph: "pricetag" | "people", label: string, rim: "none" | "important" | "standard", muted: boolean) => (
    <GlassCard padding="none" radius={16} emphasis={rim} contentStyle={rn(S.categoryCardContent)}>
      <V style={rn(S.categoryButton, { flexDirection: "row" })}>
        <Glyph name={glyph} size={20} color={colors.textSecondary} />
        <T lines={1} style={rn(S.categoryText, { color: muted ? colors.textMuted : colors.text })}>
          {label}
        </T>
        <Glyph name="chevron-forward" size={18} color={colors.textMuted} />
      </V>
    </GlassCard>
  )
  return (
    <Screen mode="dark">
      <DragList top={PUSHED_TOP} foot={PUSHED_FOOT} label={`${r.merchantName} receipt`}>
        <V style={rn(S.storeSection)}>
          <GlassCard padding="lg" emphasis="standard">
            <V style={rn(S.storeHeader, { flexDirection: "row" })}>
              <V style={rn(S.storeIcon, { borderColor: colors.orange, backgroundColor: "#FFFFFF" })}>
                <MerchantLogo uri={r.logoUrl} style={rn(S.merchantLogoImage)} />
              </V>
              <T lines={2} style={rn(S.storeName, { color: colors.text })}>
                {r.merchantName}
              </T>
            </V>
            <V style={rn(S.storeDivider, { backgroundColor: colors.divider })} />
            <V style={rn(S.storeMeta)}>
              {r.address ? <T style={rn(S.storeAddress, { color: colors.textSecondary })}>{r.address}</T> : null}
              {r.dateTime ? <T style={rn(S.receiptDateTime, { color: colors.orange })}>{r.dateTime}</T> : null}
              <V style={rn(S.receiptTypeRow, { flexDirection: "row" })}>
                <T lines={1} style={rn(S.receiptType, { color: colors.textSecondary })}>{`${receiptSourceEmoji(r.source)} ${getReceiptSourceLabel(r.source)} Receipt`}</T>
                {shared ? <Tag tone="shared" icon="share" label="Shared" /> : null}
              </V>
            </V>
          </GlassCard>
        </V>
        <V style={rn(S.categorySection)}>
          {heading("Category", true)}
          {pickerCard("pricetag", r.category || "No category", r.category ? "important" : "none", !r.category)}
        </V>
        <V style={rn(S.categorySection)}>
          {heading("Shared Group")}
          {pickerCard("people", r.sharedGroup ?? "Not shared", r.sharedGroup ? "standard" : "none", !r.sharedGroup)}
        </V>
        <V style={rn(S.categorySection)}>
          {heading("Receipt Sharing")}
          <GlassCard padding="none" radius={16} emphasis="standard" contentStyle={rn(S.categoryCardContent)}>
            {shared ? (
              <V style={rn(S.categoryButton, { flexDirection: "row" })}>
                <Glyph name="person" size={20} filled color={colors.orange} />
                <T lines={1} style={rn(S.categoryText, { color: colors.text })}>
                  <T style={{ color: colors.textSecondary }}>Shared with </T>
                  {r.sharedWith![0]}
                  {r.sharedWith!.length > 1 ? ` +${r.sharedWith!.length - 1}` : ""}
                </T>
                <Glyph name="chevron-forward" size={18} color={colors.textMuted} />
              </V>
            ) : (
              <V style={rn(S.personInputRow, { flexDirection: "row" })}>
                <Glyph name="person-add" size={20} color={colors.textSecondary} />
                <T lines={1} style={rn(S.personInput, { color: colors.textMuted, lineHeight: S.personInput.minHeight })}>
                  Not shared
                </T>
                {/* centred on the row's cross axis, like every other child of it */}
                <PillButton label="Add" style={{ alignSelf: "center" }} />
              </V>
            )}
          </GlassCard>
        </V>
        {r.items?.length ? (
          <V style={rn(S.itemsSection)}>
            {heading("Items Purchased", true)}
            <GlassCard padding="lg" emphasis="standard">
              {r.items.map((it, i) => (
                <V key={it.name} style={rn(S.itemRow, { flexDirection: "row", borderBottomColor: colors.divider }, i === r.items!.length - 1 && { borderBottomWidth: 0 })}>
                  <V style={rn(S.itemLeft)}>
                    <T style={rn(S.itemName, { color: colors.text })}>{it.name}</T>
                    <T style={rn(S.itemQuantity, { color: colors.textMuted })}>×{it.quantity}</T>
                  </V>
                  <V style={rn(S.itemRight)}>
                    <T style={rn(S.itemPrice, { color: colors.text })}>${(it.price * it.quantity).toFixed(2)}</T>
                  </V>
                </V>
              ))}
            </GlassCard>
          </V>
        ) : null}
        {r.amount != null ? (
          <V style={rn(S.totalSection)}>
            <GlassCard padding="lg" emphasis="important">
              {r.subtotal != null ? (
                <V style={rn(S.totalRow, { flexDirection: "row" })}>
                  <T style={rn(S.totalLabel, { color: colors.textSecondary })}>Subtotal</T>
                  <T style={rn(S.totalValue, { color: colors.orange })}>${r.subtotal.toFixed(2)}</T>
                </V>
              ) : null}
              {r.tax != null ? (
                <V style={rn(S.totalRow, { flexDirection: "row" })}>
                  <T style={rn(S.totalLabel, { color: colors.textSecondary })}>Tax</T>
                  <T style={rn(S.totalValue, { color: colors.text })}>${r.tax.toFixed(2)}</T>
                </V>
              ) : null}
              <V style={rn(S.totalRow, S.finalTotal, { flexDirection: "row", borderTopColor: colors.orange })}>
                <T style={rn(S.totalLabelFinal, { color: colors.orange })}>Total</T>
                <T style={rn(S.totalValueFinal, { color: colors.text })}>${r.amount.toFixed(2)}</T>
              </V>
              {r.payment ? (
                <V style={rn(S.totalRow, { flexDirection: "row" })}>
                  <T style={rn(S.totalLabel, { color: colors.textSecondary })}>Payment</T>
                  <V style={rn(S.paymentRow, { flexDirection: "row" })}>
                    <Glyph name="card" size={16} color={colors.textSecondary} />
                    <T style={rn(S.totalValue, { color: colors.text })}>{r.payment}</T>
                  </V>
                </V>
              ) : null}
            </GlassCard>
          </V>
        ) : null}
      </DragList>
      <ListFade height={PUSHED_TOP - 12} />
      <ScreenHeader right={<HeaderCircle glyph="more-horizontal" />} />
      <StatusBar />
      {live ? <Back label={backLabel} onBack={onBack} /> : null}
    </Screen>
  )
}
