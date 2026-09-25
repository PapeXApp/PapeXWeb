// Primitives: <V> (View), <T> (Text), <Glyph> (AppIcon), <AppKitRoot>,
// <Screen> (ScreenGlow), <StatusBar>.
//
// Mirrors:
//   <V>/<T>        react-native View/Text (Yoga defaults in appKit.module.css)
//   <Glyph>        PapeXV2 components/icons/AppIcon.tsx — Material Symbols
//                  Rounded 200 by codepoint (lib/app-kit/glyphs.ts, synced font)
//   <Screen>       PapeXV2 components/ui/ScreenGlow.tsx — flat background +
//                  the synced pre-rasterised glow PNG, full-bleed and stretched
//   <StatusBar>    NOT app code: iOS system chrome, drawn minimally here.

import type { CSSProperties, ReactNode } from 'react';
import './tokens.css';
import { glyphs, type GlyphName } from '@/lib/app-kit/glyphs';
import { SOURCE } from '@/lib/app-kit/tokens';
import s from './appKit.module.css';
import { pt } from './rnStyle';
import type { AppMode } from './theme';

type Div = { style?: CSSProperties; className?: string; children?: ReactNode; 'aria-hidden'?: boolean; 'aria-label'?: string; role?: string };

export function V({ style, className, children, ...rest }: Div) {
  return (
    <div className={className ? `${s.v} ${className}` : s.v} style={style} {...rest}>
      {children}
    </div>
  );
}

export function T({ style, lines, children, className }: { style?: CSSProperties; lines?: 1 | 2; children?: ReactNode; className?: string }) {
  const cls = [s.t, lines === 1 ? s.one : lines === 2 ? s.two : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}

/** AppIcon.tsx: `lineHeight: size * MATERIAL_LINE_BOX (1.2)`, `marginVertical: -(size * 0.2)/2`. */
export function Glyph({ name, size = 24, color, filled = false, style }: { name: GlyphName; size?: number; color?: string; filled?: boolean; style?: CSSProperties }) {
  const cp = glyphs[name];
  return (
    <span
      aria-hidden
      className={filled ? `${s.glyph} ${s.glyphFill}` : s.glyph}
      style={{
        fontSize: pt(size),
        lineHeight: pt(size * 1.2),
        marginTop: pt(-(size * 0.2) / 2),
        marginBottom: pt(-(size * 0.2) / 2),
        width: pt(size),
        color,
        ...style,
      }}
    >
      {String.fromCodePoint(cp)}
    </span>
  );
}

/**
 * The scope every kit component must sit inside: turns on the generated token
 * variables (tokens.css) for `mode`, and sets `--pt`.
 *
 * `width` is the rendered width of the 393pt screen, in CSS px (or any CSS
 * length). Omit it to set --pt yourself (e.g. `--pt: calc(100cqw / 393)`).
 */
export function AppKitRoot({ mode = 'dark', width, children, style, className }: { mode?: AppMode; width?: number | string; children: ReactNode; style?: CSSProperties; className?: string }) {
  const ptVar = width === undefined ? undefined : typeof width === 'number' ? `${width / SOURCE.evalDevice.width}px` : `calc(${width} / ${SOURCE.evalDevice.width})`;
  return (
    <div
      data-app-kit=""
      data-mode={mode}
      className={className ? `${s.root} ${className}` : s.root}
      style={{ ...(ptVar ? ({ '--pt': ptVar } as CSSProperties) : null), ...style }}
    >
      {children}
    </div>
  );
}

/** A full 393×852pt app screen: ground colour + ScreenGlow. */
export function Screen({ mode = 'dark', children, glow = true, style }: { mode?: AppMode; children?: ReactNode; glow?: boolean; style?: CSSProperties }) {
  return (
    <div className={s.screen} style={style}>
      {glow ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={s.glow} src={mode === 'dark' ? '/app/kit/images/screen-glow.png' : '/app/kit/images/screen-glow-light.png'} alt="" />
      ) : null}
      {children}
    </div>
  );
}

/**
 * iOS status bar. SYSTEM CHROME, not PapeX code — there is nothing in the app to
 * sync it from, so it is drawn minimally (time left, signal/battery right) at
 * the real safe-area height (59pt on a Dynamic Island phone). Pass
 * `show={false}` when the host frame draws its own.
 */
export function StatusBar({ time = '9:41', color = 'var(--ak-c-text)' }: { time?: string; color?: string }) {
  return (
    <div className={s.statusBar} style={{ height: pt(54), paddingLeft: pt(48), paddingRight: pt(34), paddingTop: pt(8), color, fontSize: pt(17) }} aria-hidden>
      <span>{time}</span>
      <span style={{ display: 'flex', gap: pt(6), alignItems: 'center' }}>
        <svg width={pt(18)} height={pt(12)} viewBox="0 0 18 12" style={{ width: pt(18), height: pt(12) }}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.7} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="0.8" fill="currentColor" />
          ))}
        </svg>
        <svg viewBox="0 0 27 13" style={{ width: pt(27), height: pt(13) }}>
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" />
          <rect x="24.5" y="4.5" width="1.6" height="4" rx="0.8" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

export { s as kitStyles };
