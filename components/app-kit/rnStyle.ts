// rnStyle — turn a React Native style object (as extracted into
// lib/app-kit/rnStyles.ts by `npm run app:sync`) into React DOM CSS, sized in
// app POINTS.
//
// Every length becomes `calc(n * var(--pt))`; the host sets `--pt` once
// (AppKitRoot), so a 393pt screen scales to any phone frame. The translation
// follows Yoga's semantics, not CSS's, where they differ:
//   - `flex: n`       → flex-grow n, shrink 1, basis 0 (RN's shorthand)
//   - flexShrink      → defaults to 0 in Yoga; the `.v` base class sets that
//   - paddingHorizontal/Vertical, marginHorizontal/Vertical → the two sides
//   - fontFamily 'Barlow-Medium' → the synced Barlow face at weight 500
//   - shadow*         → one box-shadow (iOS model: offset + radius + opacity)
//   - transform array → a CSS transform string
// Unknown keys pass through unchanged. Values are never invented here.

import type { CSSProperties } from 'react';

/** A length in app points. */
export const pt = (n: number): string => (n === 0 ? '0' : `calc(${+n.toFixed(4)} * var(--pt))`);

const FACE_WEIGHT: Record<string, number> = { Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };

/** RN fontFamily ('Barlow-Medium', 'IBMPlexMono-SemiBold') → CSS family + weight. */
export function font(family: string): { fontFamily: string; fontWeight: number } {
  const [fam, face = 'Regular'] = family.split('-');
  return {
    fontFamily: fam === 'IBMPlexMono' ? 'var(--ak-font-mono)' : 'var(--ak-font-barlow)',
    fontWeight: FACE_WEIGHT[face] ?? 400,
  };
}

const LENGTH_KEYS = new Set([
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'top', 'bottom', 'left', 'right',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'gap', 'rowGap', 'columnGap',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'borderWidth', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
  'fontSize', 'lineHeight', 'letterSpacing', 'flexBasis',
]);

type RNStyle = Record<string, unknown>;

/** Merge RN styles left-to-right (like RN's style arrays), skipping falsy entries. */
export function rn(...styles: Array<RNStyle | false | null | undefined>): CSSProperties {
  const merged: RNStyle = {};
  for (const s of styles) if (s) Object.assign(merged, s);
  const out: Record<string, unknown> = {};
  let hasBorder = false;
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === null) continue;
    switch (k) {
      case 'paddingHorizontal':
        out.paddingLeft = len(v); out.paddingRight = len(v); continue;
      case 'paddingVertical':
        out.paddingTop = len(v); out.paddingBottom = len(v); continue;
      case 'marginHorizontal':
        out.marginLeft = len(v); out.marginRight = len(v); continue;
      case 'marginVertical':
        out.marginTop = len(v); out.marginBottom = len(v); continue;
      case 'flex':
        if (typeof v === 'number') { out.flexGrow = v; out.flexShrink = v > 0 ? 1 : 0; out.flexBasis = v > 0 ? '0%' : 'auto'; }
        continue;
      case 'fontFamily':
        Object.assign(out, font(String(v))); continue;
      case 'textTransform': case 'textAlign': case 'alignItems': case 'alignSelf': case 'justifyContent':
      case 'flexDirection': case 'flexWrap': case 'position': case 'overflow': case 'display': case 'opacity':
      case 'zIndex': case 'flexGrow': case 'flexShrink': case 'color': case 'backgroundColor': case 'aspectRatio':
        out[k] = v; continue;
      case 'borderColor': case 'borderTopColor': case 'borderBottomColor': case 'borderLeftColor': case 'borderRightColor':
        out[k] = v; continue;
      case 'transform':
        if (Array.isArray(v)) out.transform = v.map((t) => Object.entries(t as object).map(([f, a]) => `${f}(${typeof a === 'number' && /translate/.test(f) ? pt(a) : a})`).join(' ')).join(' ');
        continue;
      case 'shadowColor': case 'shadowOpacity': case 'shadowRadius': case 'shadowOffset': case 'elevation':
      case 'borderCurve': case 'includeFontPadding':
        continue; // shadows handled below; the rest has no CSS meaning
      default:
        if (LENGTH_KEYS.has(k)) {
          out[k] = len(v);
          if (/^border\w*Width$/.test(k)) hasBorder = true;
        } else out[k] = v;
    }
  }
  if (hasBorder && !out.borderStyle) out.borderStyle = 'solid';
  if (typeof merged.shadowOpacity === 'number' && merged.shadowOpacity > 0) {
    const o = (merged.shadowOffset as { width: number; height: number }) ?? { width: 0, height: 0 };
    out.boxShadow = `${pt(o.width)} ${pt(o.height)} ${pt(Number(merged.shadowRadius ?? 0))} ${alpha(String(merged.shadowColor ?? '#000'), merged.shadowOpacity)}`;
  }
  return out as CSSProperties;
}

function len(v: unknown): unknown {
  if (typeof v === 'number') return pt(v);
  return v; // '100%', 'auto'
}

/** '#RRGGBB' or '#RGB' (+ alpha) → rgba(). Passes rgba()/named colours through. */
export function alpha(color: string, a: number): string {
  let h = color.trim();
  if (!h.startsWith('#')) return color;
  h = h.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** RN `#RRGGBBAA` literal (used in some StyleSheets) → rgba(). */
export function hex8(color: string): string {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(color);
  if (!m) return color;
  return alpha('#' + m[1], +(parseInt(m[2], 16) / 255).toFixed(3));
}
