// CouponRow + CouponStoreThumb + CouponTicketSeam.
//
// Mirrors:
//   CouponRow         PapeXV2 components/coupons/CouponRow.tsx (side-by-side
//                     layout, collapsed): GlassCard padding md, contentStyle
//                     padding 0, emphasis neutral (none when expired), rim
//                     COUPON_TICKET_RIM ('none'), frost 1; ticket row =
//                     stub | body [identity: store name 17 + kind Tag] [title 15]
//                     [detail 12: expiry • terms] | trail [heart?] [chevron].
//   CouponStoreThumb  PapeXV2 components/coupons/CouponStoreThumb.tsx — the
//                     76pt stub: brand field gradient (160deg, 3 stops from
//                     CouponArtwork `resolveCouponField`), 52pt logo disc or
//                     initials, ring in the field ink.
//   CouponTicketSeam  same file — two 7pt notches in the ground colour and a
//                     perforation of 2.5pt dots every 6pt.
// Sizes: rn.couponRow / rn.couponStoreThumb / rn.couponArtwork (generated).

import { rn as R } from '@/lib/app-kit/rnStyles';
import { contrastPole, mixHex, pickFieldInk, rgbaFromHex } from '@/lib/app-kit/vendor/brandContrast';
import { couponKindChipLabel, couponTermsLine, COUPON_KIND_META, describeCouponExpiry } from './couponLogic';
import { GlassCard } from './Glass';
import { FavoriteHeartGlyph } from './GlassIcon';
import { Tag } from './Pills';
import { Glyph, T, V } from './primitives';
import { pt, rn } from './rnStyle';
import { DEMO_NOW, type KitCoupon, type KitStore } from './sampleData';
import { appTheme, type AppColors, type AppMode } from './theme';

const S = R.couponRow.styles.styles;
const TS = R.couponStoreThumb.styles.styles;
const TC = R.couponStoreThumb.consts;
const { LIT_MIX, SHADE_MIX } = R.couponArtwork.consts;

/** CouponArtwork `resolveCouponField` (brand path; the duo/neutral paths use the same helpers). */
export function resolveCouponField(store: KitStore | undefined, colors: AppColors): { stops: string[]; ink: string } {
  const seed = store?.brandColor ?? colors.accent;
  const brandStops = [mixHex(seed, colors.white, LIT_MIX), seed, mixHex(seed, colors.background, SHADE_MIX)];
  const brandInk = pickFieldInk(brandStops, colors);
  if (brandInk.passes) return { stops: brandStops, ink: brandInk.ink };
  const pole = contrastPole(colors);
  const neutral = [mixHex(colors.background, pole, 0.17), mixHex(colors.background, pole, 0.12), mixHex(colors.background, pole, 0.06)];
  return { stops: neutral, ink: pickFieldInk(neutral, colors).ink };
}

/** CouponArtwork `storeInitials` (verbatim). */
export function storeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

export function CouponStoreThumb({ store, mode = 'dark', dimmed }: { store: KitStore; mode?: AppMode; dimmed?: boolean }) {
  const { colors, typography } = appTheme(mode);
  const field = resolveCouponField(store, colors);
  const size = TC.LOGO_SIZE;
  const mono = TC.MONOGRAM_SIZE;
  const disc = { width: size, height: size, borderRadius: size / 2 };
  const ring = rgbaFromHex(field.ink, store.logoUrl ? 0.34 : 0.5) ?? 'transparent';
  return (
    <V
      style={{
        ...rn(TS.stub),
        backgroundColor: field.stops[1],
        backgroundImage: `linear-gradient(160deg, ${field.stops[0]} 0%, ${field.stops[1]} 50%, ${field.stops[2]} 100%)`,
        opacity: dimmed ? S.dimmed.opacity : undefined,
      }}
    >
      <V style={rn(TS.disc, disc)}>
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <T style={rn({ fontFamily: typography.h3.fontFamily, fontSize: mono, letterSpacing: -mono * 0.02, color: field.ink })}>{storeInitials(store.name)}</T>
        )}
        <V style={{ ...rn(TS.ring, disc, { borderColor: ring }), position: 'absolute', inset: 0 }} />
      </V>
    </V>
  );
}

export function CouponTicketSeam({ offset, mode = 'dark' }: { offset: number; mode?: AppMode }) {
  const { colors } = appTheme(mode);
  const R_ = TC.NOTCH_R;
  const run = R_ + TC.PERF_CLEARANCE;
  const notch = { ...rn(TS.notch), backgroundColor: colors.background };
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <div style={{ ...notch, left: pt(offset - R_), top: pt(-R_) }} />
      <div style={{ ...notch, left: pt(offset - R_), bottom: pt(-R_) }} />
      <div
        style={{
          position: 'absolute',
          left: pt(offset - TC.PERF_DOT / 2),
          width: pt(TC.PERF_DOT),
          top: pt(run),
          bottom: pt(run),
          backgroundImage: `radial-gradient(circle, ${colors.background} ${pt(TC.PERF_DOT / 2)}, transparent calc(${TC.PERF_DOT / 2} * var(--pt) + 0.5px))`,
          backgroundSize: `${pt(TC.PERF_DOT)} ${pt(TC.PERF_PITCH)}`,
          backgroundRepeat: 'repeat-y',
        }}
      />
    </div>
  );
}

export interface CouponRowProps {
  coupon: KitCoupon;
  store: KitStore;
  mode?: AppMode;
  isFavorite?: boolean;
  /** Show the favourite heart (the Coupons tab passes a toggle). */
  showHeart?: boolean;
  now?: number;
  style?: React.CSSProperties;
}

export function CouponRow({ coupon, store, mode = 'dark', isFavorite = false, showHeart = true, now = DEMO_NOW, style }: CouponRowProps) {
  const { colors } = appTheme(mode);
  const expiry = describeCouponExpiry(coupon.expiresAt, now);
  const isExpired = expiry?.state === 'expired';
  const expiryColor = isExpired ? colors.destructiveText : expiry?.state === 'urgent' ? colors.warningText : colors.textSecondary;
  const termsLine = couponTermsLine(coupon);
  return (
    <V style={style}>
      <GlassCard mode={mode} padding="md" contentStyle={rn(S.cardContent)} emphasis={isExpired ? 'none' : 'neutral'} rim={TC.COUPON_TICKET_RIM} frost={1} bed={colors.receiptCardBed}>
        <V style={rn(S.ticket)}>
          <CouponStoreThumb store={store} mode={mode} dimmed={isExpired} />
          <V style={rn(S.body)}>
            <V style={rn(S.mainRow)}>
              <V style={rn(S.main)}>
                <V style={rn(S.identityLineFixed)}>
                  <T lines={1} style={rn(S.storeName, { color: colors.text })}>
                    {store.name}
                  </T>
                  <Tag mode={mode} label={couponKindChipLabel(coupon)} icon={COUPON_KIND_META[coupon.kind].icon} style={isExpired ? { opacity: S.dimmed.opacity } : undefined} />
                </V>
                <T lines={1} style={rn(S.title, { color: colors.text }, isExpired && S.dimmed)}>
                  {coupon.title}
                </T>
                {expiry || termsLine ? (
                  <T lines={1} style={rn(S.detail, { color: colors.textMuted })}>
                    {expiry ? <T style={{ color: expiryColor }}>{expiry.text}</T> : null}
                    {expiry && termsLine ? ' • ' : ''}
                    {termsLine}
                  </T>
                ) : null}
              </V>
              <V style={rn(S.trailRow)}>
                {showHeart ? (
                  <V style={rn(S.trailSlot)}>
                    <FavoriteHeartGlyph active={isFavorite} size={18} mode={mode} />
                  </V>
                ) : null}
                <V style={rn(S.trailSlot)}>
                  <V style={rn(S.chevronMirror)}>
                    <Glyph name="chevron-forward" size={18} color={colors.textMuted} />
                  </V>
                </V>
              </V>
            </V>
          </V>
          <CouponTicketSeam offset={TC.COUPON_STUB_WIDTH} mode={mode} />
        </V>
      </GlassCard>
    </V>
  );
}
