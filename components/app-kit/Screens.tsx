// Full app screens, 393 × 852pt, assembled from the kit parts in the order the
// PapeXV2 screens render them (see docs/design/app-reference.md §5–6):
//
//   ReceiptsScreen   app/(tabs)/receipts.tsx
//   CouponsScreen    app/(tabs)/coupons.tsx (coupon list; promo carousel is
//                    empty in production — COUPONS_SAMPLE_ENABLED is off — so
//                    it draws nothing)
//   CouponDetail     app/couponDetail.tsx
//   StoreProfile     app/store/[id].tsx — `variant="basic"` is every
//                    non-partner store (hero + Coupons | Receipts only);
//                    `variant="partner"` adds points, email join, About and the
//                    partner tabs (services/coupons/partners.ts gate)
//   ReceiptDetail    app/receiptDetail.tsx
//
// Geometry comes from rn.<screen>.styles/consts (generated from each file's
// StyleSheet) and the header helpers in Chrome.tsx. Scrolled content is drawn
// at scroll offset 0; a phone frame that crops the screen cuts this layout, it
// does not move anything.

import type { CSSProperties, ReactNode } from 'react';
import { rn as R } from '@/lib/app-kit/rnStyles';
import { liftToContrast, mixHex, pickFieldInk, resolveBrandTreatment } from '@/lib/app-kit/vendor/brandContrast';
import { getReceiptSourceLabel } from '@/lib/app-kit/vendor/receiptOrigin';
import { Button, Fab, HeaderCircle, headerContentTop, headerTop, ScreenHeader, SearchField, SegmentedControl, SelectCapsule, TabBar, TabTitleRow, TitleBubble } from './Chrome';
import { COUPON_KIND_META, describeCouponExpiry } from './couponLogic';
import { CouponRow } from './CouponRow';
import { GlassCard, glassFrostAt } from './Glass';
import { FavoriteHeartGlyph, GlassIcon } from './GlassIcon';
import { Tag, PillButton } from './Pills';
import { Glyph, Screen, StatusBar, T, V } from './primitives';
import { MerchantLogo, ReceiptRow } from './ReceiptRow';
import { pt, rn } from './rnStyle';
import { DEMO_NOW, demoStore, type KitCoupon, type KitReceipt, type KitStore } from './sampleData';
import { StoreHero, StorePlate } from './StoreVisuals';
import { appTheme, type AppMode } from './theme';

const GB = R.glassBubble.consts;
/** GlassBubble.tsx `headerBubbleTwoLineHeight()` at fontScale 1. */
const TWO_LINE = GB.HEADER_BUBBLE_TITLE_LINE_HEIGHT * 2 + GB.BUBBLE_PADDING_VERTICAL * 2;

type ScreenProps = { mode?: AppMode; statusBar?: boolean; style?: CSSProperties };

function Frame({ mode = 'dark', statusBar = true, style, children }: ScreenProps & { children: ReactNode }) {
  return (
    <Screen mode={mode} style={style}>
      {children}
      {statusBar ? <StatusBar /> : null}
    </Screen>
  );
}

/** Scroll content, absolutely placed at its first-frame offset. */
function Scroll({ top, children, style }: { top: number; children: ReactNode; style?: CSSProperties }) {
  return <V style={{ position: 'absolute', left: 0, right: 0, top: pt(top), ...style }}>{children}</V>;
}

// ===========================================================================
// Receipts tab
// ===========================================================================
export function ReceiptsScreen({ receipts, mode = 'dark', query, statusBar, checkOffEnabled = true, style }: ScreenProps & { receipts: KitReceipt[]; query?: string; checkOffEnabled?: boolean }) {
  const { colors } = appTheme(mode);
  const RS = R.receiptsScreen;
  const S = RS.styles.styles;
  const unreviewed = receipts.filter((r) => !r.reviewed).length;
  const twoLine = checkOffEnabled && unreviewed > 0;
  const bubbleH = twoLine ? TWO_LINE : GB.HEADER_BUBBLE_HEIGHT;
  const searchTop = headerTop() + bubbleH + S.header.paddingBottom + S.searchRow.paddingTop;
  const listTop = searchTop + RS.consts.SEARCH_BAR_HEIGHT + RS.consts.HEADER_CONTENT_GAP_BOTTOM;
  const sections: [string, KitReceipt[]][] = [];
  for (const r of receipts) {
    const last = sections[sections.length - 1];
    if (last && last[0] === r.section) last[1].push(r);
    else sections.push([r.section, [r]]);
  }
  return (
    <Frame mode={mode} statusBar={statusBar} style={style}>
      <Scroll top={listTop}>
        {sections.map(([title, rows]) => (
          <V key={title}>
            <T style={rn(S.sectionHeader, { color: colors.textSecondary })}>{title}</T>
            {rows.map((r) => (
              <ReceiptRow key={r.id} receipt={r} mode={mode} checkOffEnabled={checkOffEnabled} />
            ))}
          </V>
        ))}
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
                <V style={rn(S.headerMeta, { flexDirection: 'row' })}>
                  <T style={rn(S.uncheckedCount, { color: colors.attention, opacity: 0.6 })}>{unreviewed}</T>
                  <T style={rn(S.uncheckedLabel, { color: colors.attention, opacity: 0.6 })}>unreviewed</T>
                </V>
              ) : undefined
            }
          />
        }
        right={<HeaderCircle glyph="filter" mode={mode} />}
      />
      <V style={{ ...rn(S.searchRow, { flexDirection: 'row' }), position: 'absolute', left: 0, right: 0, top: pt(searchTop - S.searchRow.paddingTop), zIndex: 10 }}>
        <SearchField mode={mode} placeholder="Search receipts..." query={query} style={{ flex: '1 1 0%' }} />
      </V>
      <Fab mode={mode} />
      <TabBar active="receipts" mode={mode} />
    </Frame>
  );
}

// ===========================================================================
// Coupons tab (the shopper's coupon list)
// ===========================================================================
export function CouponsScreen({ coupons, mode = 'dark', statusBar, favorites = [], style }: ScreenProps & { coupons: KitCoupon[]; favorites?: string[] }) {
  const CS = R.couponsScreen;
  const S = CS.styles.styles;
  const controlsTop = headerTop() + GB.HEADER_BUBBLE_HEIGHT + S.titleRow.paddingBottom;
  const listTop = controlsTop + CS.consts.CONTROLS_ROW_HEIGHT;
  return (
    <Frame mode={mode} statusBar={statusBar} style={style}>
      <Scroll top={listTop} style={{ paddingLeft: pt(16), paddingRight: pt(16), gap: pt(R.couponRow.consts.COUPON_ROW_GAP) }}>
        {coupons.map((c) => (
          <CouponRow key={c.id} coupon={c} store={demoStore(c.storeId)} mode={mode} isFavorite={favorites.includes(c.id)} />
        ))}
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
      <V style={{ ...rn(S.controlsRow), position: 'absolute', left: 0, right: 0, top: pt(controlsTop), flexDirection: 'row', gap: pt(8), zIndex: 9 }}>
        <SearchField mode={mode} placeholder="Search" style={{ flex: '1 1 0%' }} />
        <HeaderCircle glyph="filter" mode={mode} />
      </V>
      <TabBar active="coupons" mode={mode} />
    </Frame>
  );
}

// ===========================================================================
// Coupon detail
// ===========================================================================
function Code128({ value, ink }: { value: string; ink: string }) {
  // app/couponDetail.tsx Code128Barcode: Start B + data + checksum + Stop,
  // module widths from CODE128_PATTERNS (generated).
  const { CODE128_PATTERNS: P, CODE128_START_B, CODE128_STOP } = R.couponDetail.consts as unknown as { CODE128_PATTERNS: string[]; CODE128_START_B: number; CODE128_STOP: number };
  const codes = [CODE128_START_B, ...[...value].map((ch) => ch.charCodeAt(0) - 32)];
  const check = codes.reduce((sum, c, i) => sum + c * (i === 0 ? 1 : i), 0) % 103;
  const seq = [...codes, check, CODE128_STOP].map((c) => P[c]).join('');
  let x = 10;
  const bars: ReactNode[] = [];
  [...seq].forEach((w, i) => {
    const wid = Number(w);
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y={0} width={wid} height={40} fill={ink} />);
    x += wid;
  });
  return (
    <svg viewBox={`0 0 ${x + 10} 40`} preserveAspectRatio="none" style={{ width: '100%', height: pt(56), display: 'block' }} aria-hidden>
      {bars}
    </svg>
  );
}

/** The coupon card of CouponDetail (BrandGlassSurface: store row, kind tag +
 *  expiry, title, qualifiers, barcode stub), on its own so a marketing scene
 *  can show the same card outside the full screen. CouponDetail renders it
 *  with no options, exactly as before. Opt-in, /business hero only:
 *  `titleStyle` (merged over the title's style: a larger offer) and `seam`
 *  (the ground colour: the hairline over the barcode becomes a ticket seam,
 *  two notches bitten from the card's edges and a perforation). */
export function CouponCard({ coupon, store, mode = 'dark', titleStyle, seam, style }: { coupon: KitCoupon; store: KitStore; mode?: AppMode; titleStyle?: CSSProperties; seam?: string; style?: CSSProperties }) {
  const { colors, typography, radii } = appTheme(mode);
  const CD = R.couponDetail;
  const S = CD.styles.styles;
  const C = CD.consts;
  const expiry = describeCouponExpiry(coupon.expiresAt, DEMO_NOW);
  const expiryColor = expiry?.state === 'expired' ? colors.destructiveText : expiry?.state === 'urgent' ? colors.warningText : colors.textSecondary;
  const accent = liftToContrast(store.brandColor ?? colors.accent, colors.background, C.ACCENT_MIN_CONTRAST);
  const treatment = resolveBrandTreatment(store.brandColor, colors);
  const BG = R.brandGlassSurface.consts;
  const hex = accent.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
  const qualifiers = [coupon.minSpend ? { icon: 'cash' as const, text: `On $${coupon.minSpend}+` } : null, coupon.inStoreOnly ? { icon: 'store' as const, text: 'In-store only' } : null].filter(Boolean) as { icon: 'cash' | 'store'; text: string }[];
  const code = coupon.barcode ?? coupon.code;
  // BrandGlassSurface: frost at FACE_STRENGTH, 1pt border in the accent at
  // GLASS_ACCENT_ALPHA.border, the two corner-lit radial arcs.
  return (
    <V style={{ ...rn(S.cardWrap), width: '100%', maxWidth: pt(C.CARD_MAX_WIDTH), ...style }}>
      <V
        style={{
          borderRadius: pt(C.CARD_RADIUS),
          border: `max(1px, calc(${BG.BORDER_WIDTH} * var(--pt))) solid rgba(${rgb}, ${BG.GLASS_ACCENT_ALPHA.border})`,
          backgroundImage: `radial-gradient(${BG.ELLIPSE_RX} ${BG.ELLIPSE_RY} at 0% 0%, rgba(${rgb}, ${BG.GLASS_ACCENT_ALPHA.base}), transparent), radial-gradient(${BG.ELLIPSE_RX} ${BG.ELLIPSE_RY} at 100% 100%, rgba(${rgb}, ${BG.GLASS_ACCENT_ALPHA.base}), transparent), ${glassFrostAt(mode, BG.FACE_STRENGTH)}`,
          backgroundColor: colors.receiptCardBed,
          overflow: 'hidden',
        }}
      >
        <V style={rn(S.cardContent)}>
          <V style={rn(S.storeRow, { flexDirection: 'row' })}>
            {store.logoUrl ? (
              <MerchantLogo mode={mode} uri={store.logoUrl} style={rn(S.storeLogo, { borderRadius: radii.md, backgroundColor: colors.inputBackground })} />
            ) : (
              <V style={rn(S.storeLogo, S.storeInitials, { borderRadius: radii.md, backgroundColor: treatment.fill ?? colors.inputBackground })}>
                <T style={rn(S.storeInitialsText, { fontFamily: 'Barlow-SemiBold', color: treatment.ink })}>{store.name.slice(0, 1)}</T>
              </V>
            )}
            <V style={rn(S.storeText)}>
              <T lines={1} style={rn(S.storeName, { fontFamily: 'Barlow-Medium', color: colors.text })}>
                {store.name}
              </T>
              <V style={rn(S.viewStore, { flexDirection: 'row' })}>
                <T style={rn(typography.caption, { color: accent })}>View store</T>
                <Glyph name="chevron-forward" size={14} color={accent} />
              </V>
            </V>
          </V>
          <V style={rn(S.metaRow, { flexDirection: 'row' })}>
            <Tag mode={mode} label={COUPON_KIND_META[coupon.kind].label} icon={COUPON_KIND_META[coupon.kind].icon} />
            {expiry ? (
              <V style={rn(S.expiry, { flexDirection: 'row' })}>
                <Glyph name="time" size={14} color={expiryColor} />
                <T lines={1} style={rn(typography.caption, S.expiryText, { color: expiryColor })}>
                  {expiry.text}
                </T>
              </V>
            ) : null}
          </V>
          <T style={titleStyle ? { ...rn(S.title, { fontFamily: typography.h1.fontFamily, color: colors.text }), ...titleStyle } : rn(S.title, { fontFamily: typography.h1.fontFamily, color: colors.text })}>{coupon.title}</T>
          {coupon.subtitle ? <T style={rn(typography.body, S.subtitle, { color: colors.text })}>{coupon.subtitle}</T> : null}
          {coupon.body ? <T style={rn(typography.body, S.bodyText, { color: colors.textSecondary })}>{coupon.body}</T> : null}
          {qualifiers.length ? (
            <V style={rn(S.qualifierRow, { flexDirection: 'row' })}>
              {qualifiers.map((q) => (
                <V key={q.text} style={rn(S.qualifier, { flexDirection: 'row' })}>
                  <Glyph name={q.icon} size={14} color={colors.textSecondary} />
                  <T style={rn(typography.caption, { color: colors.text })}>{q.text}</T>
                </V>
              ))}
            </V>
          ) : null}
          {code ? (
            <>
              {seam ? (
            <TicketSeam ground={seam} marginTop={S.divider.marginTop} inset={S.cardContent.paddingHorizontal} ink={colors.border} />
          ) : (
            <V style={{ ...rn(S.divider, { backgroundColor: colors.border }), height: 'max(1px, calc(0.3333 * var(--pt)))' }} />
          )}
              <V style={rn(S.stub, { borderRadius: radii.md })}>
                {coupon.barcode ? (
                  <>
                    <Code128 value={coupon.barcode} ink={colors.navy} />
                    <T style={rn(typography.label, S.barcodeCaption, { color: colors.navy })}>{coupon.barcode}</T>
                  </>
                ) : (
                  <>
                    <T style={rn(typography.eyebrow, { color: mixHex(colors.background, C.STUB_PAPER, 0.38), textTransform: 'uppercase' })}>Show this code at checkout</T>
                    <T style={rn(typography.stat, S.codeText, { color: colors.navy })}>{coupon.code}</T>
                  </>
                )}
              </V>
            </>
          ) : null}
        </V>
      </V>
    </V>
  );
}

/** CouponCard `seam`: two notches in the ground colour bitten from the card's
 *  edges (the card clips them) and a dotted perforation between them, in the
 *  divider's place (same top margin). */
function TicketSeam({ ground, marginTop, inset, ink }: { ground: string; marginTop: number; inset: number; ink: string }) {
  const r = 11;
  const notch: CSSProperties = { position: 'absolute', top: pt(-r), width: pt(r * 2), height: pt(r * 2), borderRadius: '50%', background: ground };
  return (
    <V style={{ position: 'relative', height: pt(2), marginTop: pt(marginTop), marginLeft: pt(-inset), marginRight: pt(-inset) }} aria-hidden>
      <div style={{ ...notch, left: pt(-r) }} />
      <div style={{ ...notch, right: pt(-r) }} />
      <div style={{ position: 'absolute', left: pt(r + 6), right: pt(r + 6), top: pt(-0.25), height: pt(2.5), backgroundImage: `radial-gradient(circle, ${ink} ${pt(1.25)}, transparent calc(1.25 * var(--pt) + 0.5px))`, backgroundSize: `${pt(7)} ${pt(2.5)}`, backgroundRepeat: 'repeat-x' }} />
    </V>
  );
}

export function CouponDetail({ coupon, store, mode = 'dark', statusBar, isFavorite = false, showRemove = true, style }: ScreenProps & { coupon: KitCoupon; store: KitStore; isFavorite?: boolean; /** false hides the red "Remove coupon" button (marketing scenes). */ showRemove?: boolean }) {
  const { colors, typography, radii } = appTheme(mode);
  const CD = R.couponDetail;
  const S = CD.styles.styles;
  const pillInk = store.brandColor ? pickFieldInk([store.brandColor, store.brandColor], colors) : null;
  const pill = store.brandColor && pillInk?.passes ? { bg: store.brandColor, ink: pillInk.ink } : { bg: colors.accent, ink: colors.buttonText };
  return (
    <Frame mode={mode} statusBar={statusBar} style={style}>
      <Scroll top={headerContentTop()} style={rn(S.scrollContent)}>
        <CouponCard coupon={coupon} store={store} mode={mode} />
        {coupon.terms ? (
          <V style={rn(S.termsRow, { flexDirection: 'row' })}>
            <T style={rn(typography.eyebrow, { color: colors.textSecondary, textTransform: 'uppercase' })}>Terms</T>
            <Glyph name="chevron-down" size={14} color={colors.textSecondary} />
          </V>
        ) : null}
        <V style={rn(S.useNowButton, { borderRadius: radii.pill, backgroundColor: pill.bg })}>
          <T style={rn(typography.button, { color: pill.ink })}>Use now</T>
        </V>
        {showRemove && <Button title="Remove coupon" variant="danger" fullWidth mode={mode} />}
      </Scroll>
      <ScreenHeader
        mode={mode}
        right={
          <HeaderCircle mode={mode}>
            <FavoriteHeartGlyph active={isFavorite} size={R.glassScreenHeader.consts.HEADER_CIRCLE_ICON} mode={mode} />
          </HeaderCircle>
        }
      />
    </Frame>
  );
}

// ===========================================================================
// Store profile
// ===========================================================================
export function StoreProfile({ store, coupons, variant = store.partner ? 'partner' : 'basic', tab = 'Coupons', mode = 'dark', statusBar, style }: ScreenProps & { store: KitStore; coupons: KitCoupon[]; variant?: 'basic' | 'partner'; tab?: string }) {
  const { colors, typography, radii } = appTheme(mode);
  const SP = R.storeProfile;
  const S = SP.styles.styles;
  const C = SP.consts;
  const partner = variant === 'partner';
  const tabs = partner ? [C.STORE_TAB_LABEL.coupons, C.STORE_TAB_LABEL.receipts, C.STORE_TAB_LABEL.menu, C.STORE_TAB_LABEL.deals, C.STORE_TAB_LABEL.news] : [C.STORE_TAB_LABEL.coupons, C.STORE_TAB_LABEL.receipts];
  const brandInk = resolveBrandTreatment(store.brandColor, colors).accentOnGround;
  const flat = (children: ReactNode) => (
    <GlassCard mode={mode} variant="flat" padding="md" emphasis="none" radius={radii.lg} bed={colors.receiptCardBed} style={rn(S.sectionCard)}>
      {children}
    </GlassCard>
  );
  const loyalty = partner ? store.loyalty : undefined;
  const JC = R.storeLoyaltyJoinCard.styles.styles;
  return (
    <Frame mode={mode} statusBar={statusBar} style={style}>
      <Scroll top={headerContentTop()} style={{ paddingLeft: pt(C.SIDE_PADDING), paddingRight: pt(C.SIDE_PADDING) }}>
        <V style={{ marginTop: pt(-headerContentTop()) }}>
          <StoreHero store={store} mode={mode} openNow={partner ? store.openNow : undefined} />
        </V>
        {loyalty ? (
          <>
            {flat(
              <V>
                <V style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <T lines={1} style={rn(typography.eyebrow, { color: colors.textMuted, textTransform: 'uppercase' })}>
                    {loyalty.programName ?? 'Points'}
                  </T>
                  <T style={rn(typography.small, { color: colors.textMuted })}>For reference only</T>
                </V>
                <V style={{ flexDirection: 'row', alignItems: 'baseline', gap: pt(4), marginTop: pt(4) }}>
                  <T style={rn(typography.stat, { color: colors.text })}>{loyalty.points}</T>
                  <T style={rn(typography.caption, { color: colors.textMuted })}>pts</T>
                </V>
                <V style={{ height: pt(6), borderRadius: pt(3), backgroundColor: colors.divider, marginTop: pt(10), overflow: 'hidden' }}>
                  <V style={{ width: `${Math.min(100, (loyalty.points / loyalty.goal) * 100)}%`, height: '100%', borderRadius: pt(3), backgroundColor: brandInk }} />
                </V>
                <V style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: pt(8) }}>
                  <T style={rn(typography.caption, { color: colors.textSecondary })}>
                    <T style={{ color: colors.text }}>{loyalty.goal - loyalty.points}</T>
                    {' more for '}
                    <T style={{ color: brandInk, fontWeight: 500 }}>{loyalty.nextRewardLabel}</T>
                  </T>
                  <T style={rn(typography.eyebrow, { color: colors.textMuted })}>{loyalty.goal}</T>
                </V>
              </V>,
            )}
            {flat(
              <V>
                <T style={rn(typography.label, { color: colors.text })}>{loyalty.programName ? `Join ${loyalty.programName}` : `Join ${store.name} Rewards`}</T>
                <T style={rn(typography.caption, JC.subtitle, { color: colors.textSecondary })}>{`Get member deals and ${loyalty.nextRewardLabel} rewards from ${store.name}.`}</T>
                <V style={rn(JC.row, { flexDirection: 'row' })}>
                  <V style={rn(JC.inputWrap, { flexDirection: 'row', borderColor: colors.border, borderRadius: radii.pill })}>
                    <Glyph name="mail" size={18} color={brandInk} style={{ marginRight: pt(JC.inputIcon.marginRight) }} />
                    <T style={rn(JC.input, { color: colors.textMuted, lineHeight: JC.input.height })}>you@email.com</T>
                  </V>
                  <Button title="Join" size="sm" mode={mode} />
                </V>
              </V>,
            )}
            {store.description
              ? flat(
                  <V style={{ gap: pt(8) }}>
                    <T style={rn(typography.label, { color: colors.text })}>About</T>
                    <T style={rn(typography.caption, { color: colors.textSecondary })}>{store.description}</T>
                    {store.hours?.map((h) => (
                      <V key={h.day} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <T style={rn(typography.caption, { color: colors.textSecondary })}>{h.day}</T>
                        <T style={rn(typography.caption, { color: colors.text })}>{h.text}</T>
                      </V>
                    ))}
                  </V>,
                )
              : null}
          </>
        ) : null}
        <V style={rn(S.tabsWrap)}>
          <SegmentedControl items={tabs} value={tab} mode={mode} />
        </V>
        <V style={{ marginTop: pt(C.SECTION_GAP), gap: pt(R.couponRow.consts.COUPON_ROW_GAP) }}>
          {coupons.length ? (
            coupons.map((c) => <CouponRow key={c.id} coupon={c} store={store} mode={mode} showHeart={false} />)
          ) : (
            <StoreCouponsEmpty store={store} mode={mode} />
          )}
        </V>
      </Scroll>
      <ScreenHeader
        mode={mode}
        right={
          <HeaderCircle mode={mode}>
            <FavoriteHeartGlyph active={false} size={22} mode={mode} />
          </HeaderCircle>
        }
      />
    </Frame>
  );
}

/** components/coupons/StoreCouponsEmpty.tsx — no coupons yet: headline, line, scan button, plate. */
function StoreCouponsEmpty({ store, mode = 'dark' }: { store: KitStore; mode?: AppMode }) {
  const { colors, typography, radii } = appTheme(mode);
  const E = R.storeCouponsEmpty;
  const width = 393 - 32;
  const height = Math.round(width * 0.42);
  return (
    <V>
      <T style={rn(typography.h3, { color: colors.text })}>{`No coupons from ${store.name} yet`}</T>
      <T style={rn(typography.caption, { color: colors.textSecondary, marginTop: 4 })}>Scan a coupon they give you, and it lives here.</T>
      <V style={rn(E.styles.styles.scanBlock ?? {})}>
        <Button title="Scan a coupon" icon="scan" fullWidth mode={mode} />
      </V>
      <V style={{ ...rn(E.styles.styles.previewBlock ?? {}), borderRadius: pt(radii.lg), overflow: 'hidden', height: pt(height) }}>
        <StorePlate store={store} width={width} height={height} mode={mode} />
      </V>
    </V>
  );
}

// ===========================================================================
// Receipt detail
// ===========================================================================
/** app/receiptDetail.tsx `getReceiptSourceEmoji` (verbatim). */
function receiptSourceEmoji(source: KitReceipt['source']): string {
  switch (source) {
    case 'email':
      return '✉️';
    case 'manual':
      return '✍️';
    case 'clover':
      return '💳';
    default:
      return '📷';
  }
}

export function ReceiptDetail({ receipt: r, mode = 'dark', statusBar, style }: ScreenProps & { receipt: KitReceipt }) {
  const { colors } = appTheme(mode);
  const S = R.receiptDetail.styles.styles;
  const shared = (r.sharedWith?.length ?? 0) > 0;
  const heading = (text: string, orange = false) => <T style={rn(S.sectionTitle, { color: orange ? colors.orange : colors.text })}>{text}</T>;
  const pickerCard = (glyph: 'pricetag' | 'people', label: string, rim: 'none' | 'important' | 'standard', muted: boolean) => (
    <GlassCard mode={mode} padding="none" radius={16} emphasis={rim} contentStyle={rn(S.categoryCardContent)}>
      <V style={rn(S.categoryButton, { flexDirection: 'row' })}>
        <Glyph name={glyph} size={20} color={colors.textSecondary} />
        <T lines={1} style={rn(S.categoryText, { color: muted ? colors.textMuted : colors.text })}>
          {label}
        </T>
        <Glyph name="chevron-forward" size={18} color={colors.textMuted} />
      </V>
    </GlassCard>
  );
  return (
    <Frame mode={mode} statusBar={statusBar} style={style}>
      <Scroll top={headerContentTop()}>
        <V style={rn(S.storeSection)}>
          <GlassCard mode={mode} padding="lg" emphasis="standard">
            <V style={rn(S.storeHeader, { flexDirection: 'row' })}>
              <V style={rn(S.storeIcon, { borderColor: colors.orange, backgroundColor: '#FFFFFF' })}>
                <MerchantLogo mode={mode} uri={r.logoUrl} style={rn(S.merchantLogoImage)} />
              </V>
              <T lines={2} style={rn(S.storeName, { color: colors.text })}>
                {r.merchantName}
              </T>
            </V>
            <V style={rn(S.storeDivider, { backgroundColor: colors.divider })} />
            <V style={rn(S.storeMeta)}>
              {r.address ? <T style={rn(S.storeAddress, { color: colors.textSecondary })}>{r.address}</T> : null}
              {r.dateTime ? <T style={rn(S.receiptDateTime, { color: colors.orange })}>{r.dateTime}</T> : null}
              <V style={rn(S.receiptTypeRow, { flexDirection: 'row' })}>
                <T lines={1} style={rn(S.receiptType, { color: colors.textSecondary })}>{`${receiptSourceEmoji(r.source)} ${getReceiptSourceLabel(r.source)} Receipt`}</T>
                {shared || r.isSharedWithCurrentUser ? <Tag mode={mode} tone="shared" icon={r.isSharedWithCurrentUser ? 'people' : 'share'} label={r.isSharedWithCurrentUser ? 'Shared with you' : 'Shared'} /> : null}
              </V>
            </V>
          </GlassCard>
        </V>
        <V style={rn(S.categorySection)}>
          {heading('Category', true)}
          {pickerCard('pricetag', r.category || 'No category', r.category ? 'important' : 'none', !r.category)}
        </V>
        <V style={rn(S.categorySection)}>
          {heading('Shared Group')}
          {pickerCard('people', r.sharedGroup ?? 'Not shared', r.sharedGroup ? 'standard' : 'none', !r.sharedGroup)}
        </V>
        <V style={rn(S.categorySection)}>
          {heading('Receipt Sharing')}
          <GlassCard mode={mode} padding="none" radius={16} emphasis="standard" contentStyle={rn(S.categoryCardContent)}>
            {shared ? (
              <V style={rn(S.categoryButton, { flexDirection: 'row' })}>
                <Glyph name="person" size={20} filled color={colors.orange} />
                <T lines={1} style={rn(S.categoryText, { color: colors.text })}>
                  <T style={{ color: colors.textSecondary }}>Shared with </T>
                  {r.sharedWith![0]}
                  {r.sharedWith!.length > 1 ? ` +${r.sharedWith!.length - 1}` : ''}
                </T>
                <Glyph name="chevron-forward" size={18} color={colors.textMuted} />
              </V>
            ) : (
              <V style={rn(S.personInputRow, { flexDirection: 'row' })}>
                <Glyph name="person-add" size={20} color={colors.textSecondary} />
                <T lines={1} style={rn(S.personInput, { color: colors.textMuted, lineHeight: S.personInput.minHeight })}>
                  Not shared
                </T>
                <PillButton label="Add" mode={mode} />
              </V>
            )}
          </GlassCard>
        </V>
        {r.items?.length ? (
          <V style={rn(S.itemsSection)}>
            {heading('Items Purchased', true)}
            <GlassCard mode={mode} padding="lg" emphasis="standard">
              {r.items.map((it, i) => (
                <V key={it.name} style={rn(S.itemRow, { flexDirection: 'row', borderBottomColor: colors.divider }, i === r.items!.length - 1 && { borderBottomWidth: 0 })}>
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
            <GlassCard mode={mode} padding="lg" emphasis="important">
              {r.subtotal != null ? (
                <V style={rn(S.totalRow, { flexDirection: 'row' })}>
                  <T style={rn(S.totalLabel, { color: colors.textSecondary })}>Subtotal</T>
                  <T style={rn(S.totalValue, { color: colors.orange })}>${r.subtotal.toFixed(2)}</T>
                </V>
              ) : null}
              {r.tax != null ? (
                <V style={rn(S.totalRow, { flexDirection: 'row' })}>
                  <T style={rn(S.totalLabel, { color: colors.textSecondary })}>Tax</T>
                  <T style={rn(S.totalValue, { color: colors.text })}>${r.tax.toFixed(2)}</T>
                </V>
              ) : null}
              <V style={rn(S.totalRow, S.finalTotal, { flexDirection: 'row', borderTopColor: colors.orange })}>
                <T style={rn(S.totalLabelFinal, { color: colors.orange })}>Total</T>
                <T style={rn(S.totalValueFinal, { color: colors.text })}>${r.amount.toFixed(2)}</T>
              </V>
              {r.payment ? (
                <V style={rn(S.totalRow, { flexDirection: 'row' })}>
                  <T style={rn(S.totalLabel, { color: colors.textSecondary })}>Payment</T>
                  <V style={rn(S.paymentRow, { flexDirection: 'row' })}>
                    <Glyph name="card" size={16} color={colors.textSecondary} />
                    <T style={rn(S.totalValue, { color: colors.text })}>{r.payment}</T>
                  </V>
                </V>
              ) : null}
            </GlassCard>
          </V>
        ) : null}
      </Scroll>
      <ScreenHeader mode={mode} right={<HeaderCircle glyph="more-horizontal" mode={mode} />} />
    </Frame>
  );
}

