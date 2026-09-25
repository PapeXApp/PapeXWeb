// ReceiptRow — mirrors PapeXV2 components/ui/ReceiptRow.tsx (collapsed card).
//
// Structure, top to bottom, as the RN component renders it:
//   GlassCard padding md · emphasis important (unreviewed) | neutral · rim topLeft
//   · frost 1 · bed colors.receiptCardBed · radius radii.xl
//     receiptRow: [checkbox (select mode)] [logo 40 + ring + unreviewed/checked
//     dot] [main: merchant 16 Medium / meta "date • category" 13 / provenance
//     12 Medium] [amountCol: amount 16 Medium / originRow: 28pt origin ring +
//     28pt box with an 18pt chevron pointing LEFT]
// Every size is `rn.receiptRow.styles.styles.*` (generated from the app's
// StyleSheet); every colour is the mode's `colors.*`. Glyph choice is the
// vendored `getReceiptSourceIconName`. Swipe actions and the expand panel are
// interaction-only and not drawn.

import { rn as R } from '@/lib/app-kit/rnStyles';
import { getReceiptSourceIconName } from '@/lib/app-kit/vendor/receiptOrigin';
import { GlassCard } from './Glass';
import { Glyph, T, V } from './primitives';
import { pt, rn } from './rnStyle';
import type { KitReceipt } from './sampleData';
import { appTheme, type AppMode } from './theme';

const S = R.receiptRow.styles.styles;
const MLI = R.merchantLogoImage.styles.styles;

/** ReceiptRowLogo → MerchantLogoImage: the logo, or the PapeX mark at 75% on the tile. */
export function MerchantLogo({ uri, style, mode = 'dark' }: { uri: string | null; style: React.CSSProperties; mode?: AppMode }) {
  const { colors, isDark } = appTheme(mode);
  if (!uri)
    return (
      <V style={{ ...style, ...rn(MLI.fallbackLogoWrap), overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/app/kit/brand/new_logo_trans.png" alt="" style={{ width: MLI.fallbackLogoImage.width, height: MLI.fallbackLogoImage.height, objectFit: 'contain' }} />
      </V>
    );
  return (
    <V style={{ ...style, overflow: 'hidden', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.borderLight }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={uri} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </V>
  );
}

export interface ReceiptRowProps {
  receipt: KitReceipt;
  mode?: AppMode;
  /** Check-off feature on (shows the blue checked dot on checked receipts). */
  checkOffEnabled?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  style?: React.CSSProperties;
}

export function ReceiptRow({ receipt: r, mode = 'dark', checkOffEnabled = true, selectMode = false, selected = false, style }: ReceiptRowProps) {
  const { colors, radii, isDark } = appTheme(mode);
  const showUnchecked = !r.reviewed;
  const isLight = !isDark;
  const ringBorder = r.isSharedByCurrentUser ? `${isLight ? colors.blue : colors.standardOutline}70` : isLight ? `${colors.navy}70` : colors.border;
  const glyphColor = r.isSharedByCurrentUser ? (isLight ? colors.blue : colors.standardOutline) : isLight ? colors.navy : colors.text;
  const sharedBy = r.isSharedWithCurrentUser && r.originDetail.startsWith('Shared by');

  return (
    <V style={{ ...rn(S.receiptCard), ...style }}>
      <GlassCard
        mode={mode}
        padding="md"
        emphasis={showUnchecked ? 'important' : 'neutral'}
        rim="topLeft"
        frost={1}
        bed={colors.receiptCardBed}
        radius={radii.xl}
      >
        <V style={rn(S.receiptRow)}>
          {selectMode ? (
            <V style={rn(S.checkboxContainer)}>
              <V style={rn(S.checkbox, selected ? { backgroundColor: colors.orange, borderColor: colors.orange } : { borderColor: colors.border })}>
                {selected ? <Glyph name="check" size={14} color={colors.buttonText} /> : null}
              </V>
            </V>
          ) : null}
          <V style={rn(S.logoWithBadge)}>
            <MerchantLogo mode={mode} uri={r.logoUrl} style={rn(S.logoWrap, { backgroundColor: colors.tileBackground }, !selectMode && showUnchecked && { opacity: 0.65 })} />
            {!selectMode && showUnchecked ? <V style={rn(S.uncheckedDot, { borderColor: colors.buttonText })} /> : null}
            {!selectMode && checkOffEnabled && r.checked ? (
              <V style={rn(S.checkedDot)}>
                <Glyph name="check" size={9} color={colors.buttonText} />
              </V>
            ) : null}
          </V>
          <V style={rn(S.receiptMain)}>
            <V style={rn(S.receiptTitleRow)}>
              <T lines={1} style={rn(S.merchantName, { color: colors.text })}>
                {r.merchantName}
              </T>
            </V>
            <T lines={1} style={rn(S.meta, { color: colors.textSecondary })}>
              {r.dateLabel}
              {r.category ? ` • ${r.category}` : ''}
            </T>
            <T lines={1} style={rn(S.originDetail, { color: colors.textMuted })}>
              {sharedBy ? (
                <>
                  <T style={{ color: isLight ? colors.blue : colors.standardOutline }}>Shared by</T>
                  {r.originDetail.slice('Shared by'.length)}
                </>
              ) : (
                r.originDetail
              )}
            </T>
          </V>
          <V style={rn(S.amountCol)}>
            <T style={rn(S.amount, { color: r.amount == null ? colors.textMuted : colors.text })}>{r.amount == null ? '—' : `$${r.amount.toFixed(2)}`}</T>
            {!selectMode ? (
              <V style={rn(S.originRow, { flexDirection: 'row' })}>
                <V style={rn(S.originIcon, { borderColor: ringBorder })}>
                  <Glyph name={getReceiptSourceIconName(r.source, r.isSharedWithCurrentUser, r.isSharedByCurrentUser)} size={14} color={glyphColor} />
                </V>
                <V style={rn(S.expandButton)}>
                  <V style={rn(S.chevronMirror)}>
                    <Glyph name="chevron-forward" size={18} color={colors.textMuted} />
                  </V>
                </V>
              </V>
            ) : null}
          </V>
        </V>
      </GlassCard>
      {selectMode && selected ? <V style={{ ...rn(S.selectionRim), pointerEvents: 'none' }} /> : null}
    </V>
  );
}

/** Height of one collapsed row, from the app's own constant. */
export const RECEIPT_ROW_CARD_HEIGHT = R.receiptRow.consts.RECEIPT_ROW_CARD_HEIGHT;
export { pt };
