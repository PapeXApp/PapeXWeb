// StoreBanner / StorePlate + StoreAppIcon + StoreTile + StoreHero.
//
// Mirrors:
//   StoreBanner   PapeXV2 components/coupons/storeBanners.tsx — base gradient
//                 (135°, base[0]→base[1]) + the art's paint, SVG shape for SVG
//                 shape: `brandPatternArt(primary, secondary)` for a store with
//                 its own colours, else one of the six PapeX banners picked by
//                 the vendored `papexBannerIndex(store.id)` (FNV-1a). Palette
//                 constants PX_* are generated. (The two bespoke arts in that
//                 file — a real partner merchant and the demo template — are
//                 not ported: the kit shows no real merchants.)
//   StorePlate    same file — compact paint scale (s 0.6) under PLATE_COMPACT_MAX.
//   StoreAppIcon  components/coupons/StoreAppIcon.tsx — `resolveIconField`
//                 (ported), radius APP_ICON_RADIUS_RATIO, logo or the PapeX app
//                 icon, hairline rim `groundHairline(colors)` (vendored).
//   StoreTile     components/coupons/StoreTile.tsx — card (radii.lg, border,
//                 darkCard + glassFrostAt(1)), 72pt cover plate + category
//                 eyebrow, 56pt mark, body (name / meta / footer). Constants and
//                 StyleSheet are rn.storeTile (generated).
//   StoreHero     components/coupons/StoreHero.tsx — full-bleed plate
//                 (safeTop + STORE_HERO_BELOW_STATUS), masked to fade from
//                 FADE_START, 108pt icon overlapping by half, name, meta, blurb.

import type { CSSProperties, ReactNode } from 'react';
import { rn as R } from '@/lib/app-kit/rnStyles';
import { contrastPole, groundHairline, hexToRgb, mixHex, pickFieldInk, resolveBrandTreatment } from '@/lib/app-kit/vendor/brandContrast';
import { papexBannerIndex } from '@/lib/app-kit/vendor/papexBannerPick';
import { resolveStoreTheme } from '@/lib/app-kit/vendor/storeTheme';
import { glassFrostAt } from './Glass';
import { FavoriteHeartGlyph } from './GlassIcon';
import { Glyph, T, V } from './primitives';
import { font, pt, rn } from './rnStyle';
import type { KitStore } from './sampleData';
import { appTheme, type AppColors, type AppMode } from './theme';

const BC = R.storeBanners.consts;
const n = (x: number) => (Math.round(x * 100) / 100).toString();

type Paint = (c: { w: number; h: number; s: number; id: (k: string) => string }) => ReactNode;
interface BannerArt {
  base: readonly [string, string];
  inkStops: readonly string[];
  paint: Paint;
}

function rings(key: string, cx: number, cy: number, step: number, count: number, palette: readonly string[], strokeWidth: number, peakOpacity: number) {
  const out: ReactNode[] = [];
  for (let i = 1; i <= count; i += 1)
    out.push(<circle key={`${key}-${i}`} cx={n(cx)} cy={n(cy)} r={n(i * step)} fill="none" stroke={palette[i % palette.length]} strokeWidth={n(strokeWidth)} strokeOpacity={n(peakOpacity * (1 - (i - 1) / count))} />);
  return out;
}

function brandPatternArt(primary: string, secondary: string): BannerArt {
  return {
    base: [primary, secondary],
    inkStops: [primary, mixHex(primary, secondary, 0.35)],
    paint: ({ w, h, s, id }) => {
      const pitch = 16 * s;
      return (
        <>
          <defs>
            <pattern id={id('dots')} patternUnits="userSpaceOnUse" x={0} y={0} width={n(pitch)} height={n(pitch)}>
              <circle cx={n(pitch / 2)} cy={n(pitch / 2)} r={n(1.3 * Math.max(s, 0.75))} fill="#FFFFFF" fillOpacity={0.22} />
            </pattern>
            <linearGradient id={id('dotfade')} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={primary} stopOpacity={1} />
              <stop offset="100%" stopColor={primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <circle cx={n(w * 0.86)} cy={n(h * 0.14)} r={n(h * 0.78)} fill="#FFFFFF" fillOpacity={0.1} />
          <circle cx={n(w * 0.6)} cy={n(h * 1.12)} r={n(h * 0.6)} fill="#000000" fillOpacity={0.1} />
          <rect x={n(w * 0.3)} width={n(w * 0.7)} height={h} fill={`url(#${id('dots')})`} />
          <rect x={n(w * 0.3 - 1)} width={n(w * 0.25)} height={h} fill={`url(#${id('dotfade')})`} />
        </>
      );
    },
  };
}

const { PX_ORANGE, PX_WHITE, PX_NAVY } = BC;
function sineEdge(w: number, baseY: number, amp: number, wavelength: number, phase: number): string {
  const step = Math.max(4, wavelength / 16);
  let d = '';
  for (let x = 0; x <= w + step; x += step) {
    const cx = Math.min(x, w);
    const y = baseY + amp * Math.sin((cx / wavelength) * Math.PI * 2 + phase);
    d += `${d ? ' L' : ''}${n(cx)} ${n(y)}`;
    if (cx === w) break;
  }
  return d;
}
function receiptPath(x: number, y: number, pw: number, ph: number, tooth: number): string {
  const teeth = Math.max(2, Math.round(pw / tooth));
  const tw = pw / teeth;
  let d = `M${n(x)} ${n(y)} L${n(x + pw)} ${n(y)} L${n(x + pw)} ${n(y + ph)}`;
  for (let i = teeth - 1; i >= 0; i -= 1) d += ` L${n(x + i * tw + tw / 2)} ${n(y + ph + tooth * 0.55)} L${n(x + i * tw)} ${n(y + ph)}`;
  return `${d} Z`;
}

/** The six PapeX banners, in PAPEX_BANNERS order (discs, flight, rings, dots, receipt, waves). */
const PAPEX_PAINTS: Paint[] = [
  ({ w, h, s, id }) => (
    <>
      <defs>
        <radialGradient id={id('glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PX_ORANGE} stopOpacity={0.55} />
          <stop offset="100%" stopColor={PX_ORANGE} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={n(w * 0.9)} cy={n(h * 0.92)} r={n(h * 0.62)} fill={`url(#${id('glow')})`} />
      <circle cx={n(w * 0.8)} cy={n(h * 0.3)} r={n(h * 0.5)} fill={PX_WHITE} fillOpacity={0.07} stroke={PX_WHITE} strokeOpacity={0.22} strokeWidth={n(1.2 * s)} />
      <circle cx={n(w * 0.98)} cy={n(h * 0.82)} r={n(h * 0.42)} fill={PX_WHITE} fillOpacity={0.06} stroke={PX_WHITE} strokeOpacity={0.18} strokeWidth={n(1.2 * s)} />
      <circle cx={n(w * 0.6)} cy={n(h * 0.98)} r={n(h * 0.3)} fill={PX_WHITE} fillOpacity={0.05} stroke={PX_WHITE} strokeOpacity={0.16} strokeWidth={n(1.2 * s)} />
    </>
  ),
  ({ w, h, s }) => {
    const px = w * 0.7;
    const py = h * 0.46;
    const trail = `M${n(w * 0.34)} ${n(h * 1.04)} Q${n(w * 0.6)} ${n(h * 0.5)} ${n(px - 14 * s)} ${n(py + 5 * s)}`;
    const ghost = `M${n(w * 0.5)} ${n(h * 1.04)} Q${n(w * 0.78)} ${n(h * 0.72)} ${n(w * 1.02)} ${n(h * 0.56)}`;
    const k = 1.25 * s;
    return (
      <>
        <path d={ghost} fill="none" stroke={PX_WHITE} strokeOpacity={0.14} strokeWidth={n(1.2 * s)} strokeDasharray={`${n(2 * s)} ${n(6 * s)}`} strokeLinecap="round" />
        <path d={trail} fill="none" stroke={PX_ORANGE} strokeOpacity={0.9} strokeWidth={n(1.8 * s)} strokeDasharray={`${n(6 * s)} ${n(6 * s)}`} strokeLinecap="round" />
        <g transform={`translate(${n(px)} ${n(py)}) rotate(-24) scale(${n(k)})`}>
          <polygon points="16,0 -14,-9 -6,0" fill={PX_WHITE} fillOpacity={0.95} />
          <polygon points="16,0 -6,0 -10,9" fill={PX_WHITE} fillOpacity={0.6} />
        </g>
      </>
    );
  },
  ({ w, h, s }) => {
    const step = 15 * s;
    const cx = w * 0.94;
    const cy = h * 1.08;
    const count = Math.ceil(Math.hypot(w * 0.62, h * 1.08) / step);
    return (
      <>
        {rings('px', cx, cy, step, count, [PX_WHITE], 1.2 * s, 0.26)}
        <circle cx={n(cx)} cy={n(cy)} r={n(step * 4)} fill="none" stroke={PX_ORANGE} strokeOpacity={0.85} strokeWidth={n(1.8 * s)} />
      </>
    );
  },
  ({ w, h, s, id }) => {
    const pitch = 14 * s;
    return (
      <>
        <defs>
          <pattern id={id('dots')} patternUnits="userSpaceOnUse" x={0} y={0} width={n(pitch)} height={n(pitch)}>
            <circle cx={n(pitch / 2)} cy={n(pitch / 2)} r={n(1.3 * Math.max(s, 0.75))} fill={PX_WHITE} fillOpacity={0.26} />
          </pattern>
          <linearGradient id={id('dotfade')} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={PX_NAVY} stopOpacity={1} />
            <stop offset="100%" stopColor={PX_NAVY} stopOpacity={0} />
          </linearGradient>
          <radialGradient id={id('glow')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={PX_ORANGE} stopOpacity={0.45} />
            <stop offset="100%" stopColor={PX_ORANGE} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={n(w * 0.84)} cy={n(h * 0.86)} r={n(h * 0.7)} fill={`url(#${id('glow')})`} />
        <rect x={n(w * 0.34)} width={n(w * 0.66)} height={h} fill={`url(#${id('dots')})`} />
        <rect x={n(w * 0.34 - 1)} width={n(w * 0.26)} height={h} fill={`url(#${id('dotfade')})`} />
      </>
    );
  },
  ({ w, h, s }) => {
    const pw = 92 * s;
    const ph = h * 0.74;
    const x = w * 0.66;
    const y = -8 * s;
    const tooth = 8 * s;
    const pad = 10 * s;
    const line = 2.6 * s;
    const rows = Math.max(2, Math.floor((ph - pad * 3 - line * 2) / (9 * s)));
    const items: ReactNode[] = [];
    for (let i = 0; i < rows; i += 1) {
      const lw = (i % 3 === 1 ? 0.5 : 0.72) * (pw - pad * 2);
      items.push(<rect key={`l${i}`} x={n(x + pad)} y={n(y + pad * 2 + i * 9 * s)} width={n(lw)} height={n(line)} rx={n(line / 2)} fill={PX_WHITE} fillOpacity={0.22} />);
    }
    const totalY = y + ph - pad - line;
    return (
      <>
        <g transform={`rotate(10 ${n(x + pw / 2)} ${n(h / 2)})`}>
          <path d={receiptPath(x - 34 * s, y + 6 * s, pw, ph, tooth)} fill={PX_WHITE} fillOpacity={0.04} stroke={PX_WHITE} strokeOpacity={0.1} strokeWidth={n(1 * s)} />
        </g>
        <g transform={`rotate(-8 ${n(x + pw / 2)} ${n(h / 2)})`}>
          <path d={receiptPath(x, y, pw, ph, tooth)} fill={PX_WHITE} fillOpacity={0.1} stroke={PX_WHITE} strokeOpacity={0.24} strokeWidth={n(1 * s)} />
          {items}
          <rect x={n(x + pad)} y={n(totalY)} width={n((pw - pad * 2) * 0.4)} height={n(line)} rx={n(line / 2)} fill={PX_WHITE} fillOpacity={0.4} />
          <rect x={n(x + pw - pad - (pw - pad * 2) * 0.3)} y={n(totalY - line * 0.3)} width={n((pw - pad * 2) * 0.3)} height={n(line * 1.6)} rx={n(line * 0.8)} fill={PX_ORANGE} fillOpacity={0.95} />
        </g>
      </>
    );
  },
  ({ w, h, s }) => {
    const wl = 130 * s;
    const amp = 7 * s;
    const band = (baseY: number, phase: number) => `M${sineEdge(w, baseY, amp, wl, phase)} L${n(w)} ${n(h)} L0 ${n(h)} Z`;
    return (
      <>
        <path d={band(h * 0.6, 0.4)} fill={PX_WHITE} fillOpacity={0.05} />
        <path d={`M${sineEdge(w, h * 0.6, amp, wl, 0.4)}`} fill="none" stroke={PX_ORANGE} strokeOpacity={0.85} strokeWidth={n(1.8 * s)} />
        <path d={band(h * 0.72, 2.2)} fill={PX_WHITE} fillOpacity={0.06} />
        <path d={band(h * 0.85, 4.1)} fill={PX_WHITE} fillOpacity={0.08} />
      </>
    );
  },
];

/** storeBanners.tsx `resolveStoreBanner` (minus the two bespoke arts). */
export function resolveStoreBanner(store: KitStore, colors: AppColors): BannerArt {
  const primary = store.brandColor && hexToRgb(store.brandColor) ? store.brandColor : undefined;
  const secondary = primary && store.brandColorSecondary && hexToRgb(store.brandColorSecondary) ? store.brandColorSecondary : undefined;
  if (primary && secondary) return brandPatternArt(primary, secondary);
  if (primary) return brandPatternArt(mixHex(primary, contrastPole(colors), 0.12), mixHex(primary, colors.background, 0.35));
  const i = papexBannerIndex(store.id) % PAPEX_PAINTS.length;
  const meta = BC.PAPEX_BANNERS[i] as unknown as { base: [string, string]; inkStops: string[] };
  return { base: meta.base, inkStops: meta.inkStops, paint: PAPEX_PAINTS[i] };
}

/** StoreBanner (w/h in points). `compact` = paint scale 0.6. */
export function StoreBanner({ store, width, height, compact = false, mode = 'dark', style }: { store: KitStore; width: number; height: number; compact?: boolean; mode?: AppMode; style?: CSSProperties }) {
  const { colors } = appTheme(mode);
  const art = resolveStoreBanner(store, colors);
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const prefix = `ak-sb-${store.id.replace(/[^A-Za-z0-9_-]/g, '_')}-${compact ? 'c' : 'p'}-${w}x${h}`;
  const id = (k: string) => `${prefix}-${k}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%', backgroundColor: art.base[0], ...style }} aria-hidden>
      <defs>
        <linearGradient id={id('base')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={art.base[0]} />
          <stop offset="100%" stopColor={art.base[1]} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id('base')})`} />
      {art.paint({ w, h, s: compact ? 0.6 : 1, id })}
    </svg>
  );
}

export function StorePlate(props: { store: KitStore; width: number; height: number; mode?: AppMode; style?: CSSProperties }) {
  return <StoreBanner {...props} compact={Math.min(props.width, props.height) < BC.PLATE_COMPACT_MAX} />;
}

// ---------------------------------------------------------------------------
const AIC = R.storeAppIcon;
export const appIconRadius = (size: number) => Math.round(size * AIC.consts.APP_ICON_RADIUS_RATIO);

/** StoreAppIcon.tsx `resolveIconField` (verbatim logic). */
function resolveIconField(store: KitStore, colors: AppColors): { backgroundColor: string; backgroundImage?: string; ink: string } {
  const primary = store.brandColor && hexToRgb(store.brandColor) ? store.brandColor : undefined;
  const secondary = primary && store.brandColorSecondary && hexToRgb(store.brandColorSecondary) ? store.brandColorSecondary : undefined;
  if (primary) {
    const stops: [string, string] = secondary ? [primary, secondary] : [mixHex(primary, colors.white, 0.14), mixHex(primary, colors.navy, 0.22)];
    const field = pickFieldInk(stops, colors);
    if (field.passes) return { backgroundColor: stops[0], backgroundImage: `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 100%)`, ink: field.ink };
    const flat = resolveBrandTreatment(primary, colors);
    if (flat.fill) return { backgroundColor: flat.fill, ink: flat.ink };
  }
  const accent = resolveBrandTreatment(store.brandColor, colors).accentOnGround;
  const pole = contrastPole(colors);
  const neutralStops: [string, string] = [mixHex(colors.background, accent, 0.35), mixHex(colors.background, pole, 0.06)];
  return { backgroundColor: mixHex(colors.background, pole, 0.1), backgroundImage: `linear-gradient(135deg, ${neutralStops[0]} 0%, ${neutralStops[1]} 100%)`, ink: pickFieldInk(neutralStops, colors).ink };
}

export function StoreAppIcon({ store, size, radius, mode = 'dark', style }: { store: KitStore; size: number; radius?: number; mode?: AppMode; style?: CSSProperties }) {
  const { colors } = appTheme(mode);
  const field = resolveIconField(store, colors);
  const corner = radius ?? appIconRadius(size);
  return (
    <V style={{ ...rn(AIC.styles.styles.tile, { width: size, height: size, borderRadius: corner, backgroundColor: field.backgroundColor }), backgroundImage: field.backgroundImage, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={store.logoUrl ?? '/app/kit/brand/papex_app_icon.png'} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: store.logoUrl ? 'contain' : 'cover' }} />
      <V style={{ ...rn(AIC.styles.styles.rim, { borderRadius: corner, borderColor: groundHairline(colors) }), position: 'absolute', inset: 0, borderWidth: 'max(0.5px, calc(0.3333 * var(--pt)))' }} />
    </V>
  );
}

// ---------------------------------------------------------------------------
const ST = R.storeTile;

export interface StoreTileProps {
  store: KitStore;
  mode?: AppMode;
  /** Coupons the shopper holds for this store (undefined = no count row). */
  couponCount?: number;
  /** Lead coupon title (+ expiry) shown under the name. */
  lead?: { title: string; expiry?: string };
  isFavorite?: boolean;
  /** Width of the tile in points (2-up grid on a 393pt screen = (393 − 16·2 − 12) / 2). */
  width?: number;
}

export function StoreTile({ store, mode = 'dark', couponCount, lead, isFavorite = false, width = (393 - ST.consts.STORE_TILE_EDGE_INSET * 2 - ST.consts.STORE_TILE_GAP) / 2 }: StoreTileProps) {
  const { colors, radii } = appTheme(mode);
  const S = ST.styles.styles;
  const C = ST.consts;
  const art = resolveStoreBanner(store, colors);
  const bannerInk = pickFieldInk(art.inkStops, colors);
  const coverInk = bannerInk.passes ? bannerInk.ink : colors.buttonText;
  const countLabel = typeof couponCount === 'number' ? (couponCount === 0 ? 'No coupons yet' : `${couponCount} ${couponCount === 1 ? 'coupon' : 'coupons'}`) : null;
  return (
    <V style={{ width: pt(width) }}>
      <V style={{ ...rn(S.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.darkCard }), backgroundImage: glassFrostAt(mode, 1) }}>
        <V style={rn(S.cover, { borderBottomColor: colors.border })}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <StorePlate store={store} width={width} height={C.COVER_HEIGHT} mode={mode} />
          </div>
          {store.category ? (
            <T lines={1} style={rn(S.eyebrow, S.eyebrowScrim, { color: coverInk })}>
              {store.category}
            </T>
          ) : null}
        </V>
        <V style={rn(S.body)}>
          <T lines={2} style={rn(S.name, { color: colors.text, minHeight: C.NAME_LINE_HEIGHT * C.NAME_LINES })}>
            {store.name}
          </T>
          <V style={rn(S.metaBox, { minHeight: C.META_LINE_HEIGHT * C.META_LINES })}>
            {lead ? (
              <T lines={1} style={rn(S.offer, { color: colors.text })}>
                {lead.title}
              </T>
            ) : null}
            {lead?.expiry ? (
              <T lines={1} style={rn(S.meta, { color: colors.textSecondary })}>
                {lead.expiry}
              </T>
            ) : null}
            {!lead && store.blurb ? (
              <T lines={1} style={rn(S.meta, { color: colors.textSecondary })}>
                {store.blurb}
              </T>
            ) : null}
          </V>
          {countLabel ? (
            <V style={rn(S.footer, { borderTopColor: colors.border })}>
              <V style={rn(S.stat, { flexDirection: 'row' })}>
                <Glyph name="pricetag" size={13} color={couponCount ? colors.accent : colors.textMuted} />
                <T lines={1} style={rn(S.statText, { color: couponCount ? colors.accent : colors.textMuted })}>
                  {countLabel}
                </T>
              </V>
            </V>
          ) : null}
        </V>
        <V style={{ ...rn(S.mark, { borderRadius: appIconRadius(C.MARK_INNER) + C.MARK_RING, backgroundColor: colors.darkCard }) }}>
          <StoreAppIcon store={store} size={C.MARK_INNER} radius={appIconRadius(C.MARK_INNER)} mode={mode} />
        </V>
        <V style={rn(S.favoriteBadge)}>
          <V style={{ ...rn(S.heartBubble), borderRadius: pt(C.HEART_DISC / 2), backgroundColor: C.SCRIM, alignItems: 'center', justifyContent: 'center' }}>
            <FavoriteHeartGlyph active={isFavorite} size={C.HEART_GLYPH} mode={mode} />
          </V>
        </V>
      </V>
    </V>
  );
}

// ---------------------------------------------------------------------------
const SH = R.storeHero;

export function StoreHero({ store, mode = 'dark', safeTop = 59, openNow, width = 393 }: { store: KitStore; mode?: AppMode; safeTop?: number; openNow?: boolean; width?: number }) {
  const { colors, typography } = appTheme(mode);
  const C = SH.consts;
  const S = SH.styles.styles;
  const height = safeTop + C.STORE_HERO_BELOW_STATUS;
  const inkOnGround = resolveStoreTheme(store, colors).ink;
  return (
    <V>
      <V style={{ height: pt(height), marginLeft: pt(-16), marginRight: pt(-16), WebkitMaskImage: `linear-gradient(180deg, #000 0%, #000 ${C.FADE_START * 100}%, transparent 100%)`, maskImage: `linear-gradient(180deg, #000 0%, #000 ${C.FADE_START * 100}%, transparent 100%)` }}>
        <StorePlate store={store} width={width} height={height} mode={mode} />
      </V>
      <V style={{ ...rn(S.identity), marginTop: pt(-C.LOGO_OVERLAP) }}>
        <V style={rn(S.logoShadow, { borderRadius: appIconRadius(C.STORE_LOGO_SIZE), backgroundColor: colors.background })}>
          <StoreAppIcon store={store} size={C.STORE_LOGO_SIZE} mode={mode} />
        </V>
        <T lines={2} style={rn(S.name, { fontFamily: typography.h1.fontFamily, color: colors.text })}>
          {store.name}
        </T>
        {store.category || openNow !== undefined ? (
          <T lines={1} style={rn(typography.caption, S.meta)}>
            {store.category ? <T style={{ color: inkOnGround }}>{store.category}</T> : null}
            {store.category && openNow !== undefined ? <T style={{ color: colors.textMuted }}>{'  ·  '}</T> : null}
            {openNow === undefined ? null : <T style={{ color: openNow ? colors.successText : colors.textSecondary }}>{openNow ? 'Open now' : 'Closed'}</T>}
          </T>
        ) : null}
        {store.blurb ? (
          <T lines={2} style={rn(typography.body, S.blurb, { color: colors.textSecondary })}>
            {store.blurb}
          </T>
        ) : null}
      </V>
    </V>
  );
}

export { font };
