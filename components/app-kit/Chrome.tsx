// App chrome: tab bar, FAB, header row pieces, search field, segmented
// control, Button.
//
// Mirrors (sizes from lib/app-kit/rnStyles.ts / tokens.ts unless noted):
//   TabBar            app/(tabs)/_layout.tsx NativeTabs — tab list, order,
//                     labels and icon PNGs are `navigation` (generated from
//                     the Trigger JSX); selected label = tintColor
//                     (colors.orange). The bar itself is the SYSTEM UITabBar
//                     (iOS 26 Liquid Glass capsule): its geometry is not in app
//                     code, so the capsule inset/height below are MEASURED from
//                     app-media/reference/app-receipts-list.png (per
//                     docs/design/app-reference.md §2).
//   Fab               components/ui/FloatingFAB.tsx — FAB_SIZE, `fab` style,
//                     accent fill, 2pt white .12 edge, shadows.lg, `add` 28 in
//                     colors.background; bottom = inset + TAB_BAR_HEIGHT +
//                     FAB_TO_NAV_GAP, right 16 (inline literal in the JSX).
//   HeaderCircle      components/ui/GlassScreenHeader.tsx `headerCircle` +
//                     HEADER_CIRCLE_ICON.
//   TitleBubble       GlassBubble + `headerBubbleTitle`, HEADER_BUBBLE_HEIGHT.
//   headerTop()       GlassBubble.tsx `headerBubbleTop` (NOTCHED_INSET_MIN,
//                     HEADER_BUBBLE_PULL, HEADER_BUBBLE_TOP).
//   SearchField       app/(tabs)/receipts.tsx searchBar/searchContent/
//                     searchInput + SEARCH_GLYPH.
//   SegmentedControl  components/ui/NativeSegmentedControl.tsx — the SYSTEM
//                     UISegmentedControl (iOS 26 glass track + lens): web
//                     approximation of the look; height = RESERVED_HEIGHT.default.
//   Button            components/ui/Button.tsx — SIZE_CONFIG, pill radius,
//                     variant fills (primary = attention, danger = error).

import type { CSSProperties, ReactNode } from 'react';
import type { GlyphName } from '@/lib/app-kit/glyphs';
import { navigation, rn as R } from '@/lib/app-kit/rnStyles';
import { tabBarMetrics } from '@/lib/app-kit/tokens';
import s from './appKit.module.css';
import { LiquidBubble } from './Glass';
import { Glyph, T, V } from './primitives';
import { font, pt, rn } from './rnStyle';
import { appTheme, type AppMode } from './theme';

/** iPhone 15/16 safe-area insets (a device fact, not app code). */
export const DEVICE = { insetTop: 59, insetBottom: 34 } as const;

const GB = R.glassBubble.consts;
const GSH = R.glassScreenHeader;

/** GlassBubble.tsx `headerBubbleTop(insetTop)`. */
export function headerTop(insetTop: number = DEVICE.insetTop): number {
  return insetTop >= GB.NOTCHED_INSET_MIN ? insetTop - GB.HEADER_BUBBLE_PULL : insetTop + GB.HEADER_BUBBLE_TOP;
}
/** GlassScreenHeader.tsx `glassHeaderContentTop(insetTop)`. */
export function headerContentTop(insetTop: number = DEVICE.insetTop): number {
  return headerTop(insetTop) + GB.HEADER_BUBBLE_HEIGHT + GSH.consts.HEADER_CONTENT_GAP;
}

// ---------------------------------------------------------------------------
export type TabName = (typeof navigation.tabs)[number]['name'];

/** Measured off the reference capture (system chrome, see header). */
const CAPSULE = { inset: 21, height: 59, labelSize: 10, iconSize: 25 } as const;

export function TabBar({ active, mode = 'dark' }: { active: TabName; mode?: AppMode }) {
  const { colors, isDark } = appTheme(mode);
  return (
    <V
      className={s.liquid}
      aria-hidden
      style={{
        position: 'absolute',
        left: pt(CAPSULE.inset),
        right: pt(CAPSULE.inset),
        bottom: pt(CAPSULE.inset),
        height: pt(CAPSULE.height),
        borderRadius: pt(CAPSULE.height / 2),
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: pt(4),
        paddingRight: pt(4),
        zIndex: 20,
      }}
    >
      {navigation.tabs.map((tab) => {
        const on = tab.name === active;
        const src = isDark ? (on ? tab.icons.darkSelected : tab.icons.darkDefault) : on ? tab.icons.lightSelected : tab.icons.lightDefault;
        return (
          <V
            key={tab.name}
            style={{
              flex: '1 1 0%',
              height: pt(CAPSULE.height - 8),
              alignItems: 'center',
              justifyContent: 'center',
              gap: pt(1),
              borderRadius: pt((CAPSULE.height - 8) / 2),
              background: on ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,18,29,0.07)') : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src ?? ''} alt="" style={{ width: pt(CAPSULE.iconSize), height: pt(CAPSULE.iconSize) }} />
            <T lines={1} style={{ fontFamily: 'var(--ak-font-system)', fontWeight: 600, fontSize: pt(CAPSULE.labelSize), lineHeight: pt(12), color: on ? navigation.tintColor : colors.text }}>
              {tab.label}
            </T>
          </V>
        );
      })}
    </V>
  );
}

// ---------------------------------------------------------------------------
export function Fab({ mode = 'dark', glyph = 'add', badge }: { mode?: AppMode; glyph?: GlyphName; badge?: number }) {
  const { colors, shadows } = appTheme(mode);
  const FF = R.floatingFab;
  const bottom = DEVICE.insetBottom + tabBarMetrics.TAB_BAR_HEIGHT + FF.consts.FAB_TO_NAV_GAP;
  return (
    <V style={{ ...rn(FF.styles.styles.fabFloat), bottom: pt(bottom), right: pt(16) }} aria-hidden>
      <V style={rn(FF.styles.styles.fab, { backgroundColor: colors.accent, borderColor: 'rgba(255, 255, 255, 0.12)' }, shadows.lg)}>
        <Glyph name={glyph} size={28} color={colors.background} filled />
      </V>
      {badge ? (
        <V style={{ position: 'absolute', top: pt(-4), right: pt(-4), minWidth: pt(18), height: pt(18), borderRadius: pt(9), backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingLeft: pt(4), paddingRight: pt(4) }}>
          <T style={{ ...font('IBMPlexMono-SemiBold'), fontSize: pt(11), color: colors.accent }}>{badge}</T>
        </V>
      ) : null}
    </V>
  );
}

// ---------------------------------------------------------------------------
export function HeaderCircle({ children, glyph, mode = 'dark' }: { children?: ReactNode; glyph?: GlyphName; mode?: AppMode }) {
  const { colors } = appTheme(mode);
  const c = GSH.consts.headerCircle;
  return (
    <LiquidBubble style={{ width: pt(c.bubble.width), height: pt(c.bubble.height) }} contentStyle={{ padding: 0, gap: 0, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      {children ?? (glyph ? <Glyph name={glyph} size={GSH.consts.HEADER_CIRCLE_ICON} color={colors.text} /> : null)}
    </LiquidBubble>
  );
}

export function TitleBubble({ title, meta, mode = 'dark' }: { title: string; meta?: ReactNode; mode?: AppMode }) {
  const { colors } = appTheme(mode);
  const t = GB.headerBubbleTitle;
  return (
    <LiquidBubble style={{ minHeight: pt(GB.HEADER_BUBBLE_HEIGHT) }} contentStyle={meta ? { flexDirection: 'column', gap: 0 } : undefined}>
      <T lines={1} style={rn(t, { color: colors.text, lineHeight: meta ? GB.HEADER_BUBBLE_TITLE_LINE_HEIGHT : undefined })}>
        {title}
      </T>
      {meta}
    </LiquidBubble>
  );
}

/** The "Select" capsule (receipts.tsx headerSelectBubble + headerSelectLabel). */
export function SelectCapsule({ mode = 'dark' }: { mode?: AppMode }) {
  const { colors } = appTheme(mode);
  const RS = R.receiptsScreen.styles.styles;
  return (
    <LiquidBubble style={rn(RS.headerSelectBubble)}>
      <T style={rn(RS.headerSelectLabel, { color: colors.text })}>Select</T>
    </LiquidBubble>
  );
}

/**
 * A tab root's pinned title row: [left] [title bubble] [right], the sides
 * `flex:1` so the bubble centres (receipts.tsx `header` / `headerTitleRow`).
 */
export function TabTitleRow({ left, title, right, mode = 'dark' }: { left?: ReactNode; title: ReactNode; right?: ReactNode; mode?: AppMode }) {
  const RS = R.receiptsScreen.styles.styles;
  void mode;
  return (
    <V style={{ ...rn(RS.header), position: 'absolute', left: 0, right: 0, top: pt(headerTop()), zIndex: 10, alignItems: 'flex-start' }}>
      <V style={{ flex: '1 1 0%', flexDirection: 'row', alignItems: 'center', minHeight: pt(GB.HEADER_BUBBLE_HEIGHT) }}>{left}</V>
      <V style={{ alignItems: 'center' }}>{title}</V>
      <V style={rn(RS.headerActions)}>{right}</V>
    </V>
  );
}

/** A pushed screen's header: back circle · optional title · right slot (GlassScreenHeader). */
export function ScreenHeader({ title, right, mode = 'dark' }: { title?: string; right?: ReactNode; mode?: AppMode }) {
  const S = GSH.styles.styles;
  return (
    <V style={{ ...rn(S.row), position: 'absolute', left: 0, right: 0, top: pt(headerTop()), zIndex: 10, flexDirection: 'row' }}>
      <V style={rn(S.side)}>
        <HeaderCircle glyph="chevron-back" mode={mode} />
      </V>
      {title ? <TitleBubble title={title} mode={mode} /> : null}
      <V style={rn(S.side, S.sideRight)}>{right}</V>
    </V>
  );
}

// ---------------------------------------------------------------------------
export function SearchField({ placeholder = 'Search', query, mode = 'dark', style }: { placeholder?: string; query?: string; mode?: AppMode; style?: CSSProperties }) {
  const { colors } = appTheme(mode);
  const RS = R.receiptsScreen;
  return (
    <LiquidBubble style={{ ...rn(RS.styles.styles.searchBar), ...style }} contentStyle={rn(RS.styles.styles.searchContent, { flexDirection: 'row', alignItems: 'center' })}>
      <Glyph name="search" size={RS.consts.SEARCH_GLYPH} color={colors.textSecondary} />
      <T lines={1} style={rn(RS.styles.styles.searchInput, { color: query ? colors.text : colors.textMuted, lineHeight: RS.styles.styles.searchInput.height })}>
        {query || placeholder}
      </T>
      {query ? <Glyph name="close-circle" size={RS.consts.SEARCH_GLYPH} color={colors.textMuted} filled /> : null}
    </LiquidBubble>
  );
}

// ---------------------------------------------------------------------------
export function SegmentedControl({ items, value, mode = 'dark', style }: { items: readonly string[]; value: string; mode?: AppMode; style?: CSSProperties }) {
  const { colors, isDark } = appTheme(mode);
  const h = R.segmented.consts.RESERVED_HEIGHT.default;
  return (
    <V className={s.liquid} style={{ height: pt(h), borderRadius: pt(h / 2), flexDirection: 'row', padding: pt(2), ...style }}>
      {items.map((it) => {
        const on = it === value;
        return (
          <V
            key={it}
            style={{
              flex: '1 1 0%',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: pt((h - 4) / 2),
              background: on ? (isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,136,234,0.35)') : undefined,
            }}
          >
            <T lines={1} style={{ ...font('Barlow-Medium'), fontSize: pt(13), color: isDark ? colors.white : colors.navy }}>
              {it}
            </T>
          </V>
        );
      })}
    </V>
  );
}

// ---------------------------------------------------------------------------
export function Button({ title, variant = 'primary', size = 'md', icon, fullWidth = false, mode = 'dark', style }: { title: string; variant?: 'primary' | 'secondary' | 'danger'; size?: 'sm' | 'md' | 'lg'; icon?: GlyphName; fullWidth?: boolean; mode?: AppMode; style?: CSSProperties }) {
  const { colors, glass, radii } = appTheme(mode);
  const cfg = R.button.consts.SIZE_CONFIG[size];
  const fill = variant === 'danger' ? colors.error : variant === 'secondary' ? glass.background : colors.attention;
  const ink = variant === 'secondary' ? colors.text : colors.buttonText;
  return (
    <V style={{ ...rn(R.button.styles.styles.base, { height: cfg.height, paddingHorizontal: cfg.paddingHorizontal, borderRadius: radii.pill, backgroundColor: fill }), width: fullWidth ? '100%' : undefined, alignSelf: fullWidth ? undefined : 'flex-start', ...style }}>
      {icon ? <Glyph name={icon} size={cfg.fontSize} color={ink} style={{ marginRight: pt(R.button.styles.styles.icon.marginRight) }} /> : null}
      <T lines={1} style={rn(R.button.styles.styles.text, { fontSize: cfg.fontSize, color: ink })}>
        {title}
      </T>
    </V>
  );
}
