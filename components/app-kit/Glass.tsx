// GlassEdgeRing + GlassCard + LiquidBubble.
//
// Mirrors:
//   GlassEdgeRing  PapeXV2 components/ui/GlassEdgeRing.tsx — the SAME eight
//                  pieces (four quarter-arc corners + four gradient walls),
//                  the same fade builder (buildFade/mixColor/smoothstep,
//                  ported line for line), fed by the generated
//                  glassEdgesByMode / edgeFadeReachByMode / edgeRimProfileByMode.
//   GlassCard      PapeXV2 components/ui/GlassCard.tsx — painted-frost branch
//                  (material 'frost', the app default): radius radii.xl,
//                  padding spacing[padding], face = glassFace.frost (or
//                  glassFrostAt(frost)) + the inset accent pair, rim last.
//   LiquidBubble   PapeXV2 components/ui/GlassBubble.tsx — iOS 26 system glass;
//                  web APPROXIMATION (backdrop blur), see appKit.module.css.

import type { CSSProperties, ReactNode } from 'react';
import { rn as rnStyles } from '@/lib/app-kit/rnStyles';
import { samples, theme as T } from '@/lib/app-kit/tokens';
import s from './appKit.module.css';
import { pt } from './rnStyle';
import { appTheme, type AppMode } from './theme';

type Tier = 'neutral' | 'important' | 'standard';
type Segment = readonly [string, string, number, number];
type Fade = { colors: string[]; locations: number[] };

// --- ported verbatim from GlassEdgeRing.tsx ---------------------------------
const SMOOTH_SAMPLES = 8;
const smoothstep = (u: number) => u * u * (3 - 2 * u);
function parseRgba(color: string): [number, number, number, number] | null {
  const m = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])] : null;
}
function mixColor(a: string, b: string, t: number): string {
  const pa = parseRgba(a);
  const pb = parseRgba(b);
  if (!pa || !pb) return t < 0.5 ? a : b;
  const ch = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  const alpha = +(pa[3] + (pb[3] - pa[3]) * t).toFixed(3);
  return `rgba(${ch(0)}, ${ch(1)}, ${ch(2)}, ${alpha})`;
}
function buildFade(segments: readonly Segment[], curve: 'linear' | 'smooth'): Fade {
  const colors: string[] = [];
  const locations: number[] = [];
  const push = (c: string, x: number) => {
    if (locations.length && locations[locations.length - 1] === x && colors[colors.length - 1] === c) return;
    colors.push(c);
    locations.push(x);
  };
  for (const [a, b, x0, x1] of segments) {
    if (x1 <= x0) continue;
    push(a, x0);
    if (curve === 'smooth' && a !== b) {
      for (let i = 1; i < SMOOTH_SAMPLES; i++) {
        const u = i / SMOOTH_SAMPLES;
        push(mixColor(a, b, smoothstep(u)), +(x0 + (x1 - x0) * u).toFixed(4));
      }
    }
    push(b, x1);
  }
  if (colors.length < 2) return { colors: [colors[0], colors[0]], locations: [0, 1] };
  return { colors, locations };
}
// -----------------------------------------------------------------------------

const grad = (dir: string, f: Fade) => `linear-gradient(${dir}, ${f.colors.map((c, i) => `${c} ${+(f.locations[i] * 100).toFixed(2)}%`).join(', ')})`;
/** 1pt, but never under one device pixel — a mockup renders the app at ~0.4–0.8 CSS px/pt. */
const HAIR = 'max(1px, calc(1 * var(--pt)))';

export function GlassEdgeRing({ emphasis, radius, rim = 'full', subtle = false, mode = 'dark' }: { emphasis: Tier | 'none'; radius: number; rim?: 'full' | 'topLeft'; subtle?: boolean; mode?: AppMode }) {
  if (emphasis === 'none') return null;
  const th = appTheme(mode);
  const tone = subtle ? th.glassEdgeSubtle : th.glassEdges[emphasis];
  const { lit, far, faint, clear } = tone as { lit: string; far: string; faint: string; clear: string };
  const reach = Math.min(1, Math.max(0, th.edgeFadeReach[emphasis]));
  const curve = th.edgeRimProfile.curve[emphasis] as 'linear' | 'smooth';
  const uShape = rim === 'full' && (th.edgeRimProfile.shape as string) === 'u';
  const fadeFrom = (from: string): Segment[] => [[from, faint, 0, reach], [faint, faint, reach, 1]];
  const fadeInto = (to: string): Segment[] => [[faint, faint, 0, 1 - reach], [faint, to, 1 - reach, 1]];
  const topLeftFade: Segment[] = curve === 'smooth' ? [[lit, clear, 0, 1]] : [[lit, faint, 0, reach], [faint, clear, reach, 1]];
  const litWall = buildFade(rim === 'topLeft' ? topLeftFade : fadeFrom(lit), curve);
  const flatWall = buildFade([[faint, faint, 0, 1]], curve);
  const uDip = mixColor(faint, lit, T.RIM_U_BOTTOM_DIP);
  const walls = uShape
    ? { top: flatWall, left: buildFade(fadeInto(lit), curve), bottom: buildFade([[lit, uDip, 0, 0.5], [uDip, far, 0.5, 1]], curve), right: buildFade(fadeInto(far), curve) }
    : { top: litWall, left: litWall, bottom: buildFade(fadeInto(far), curve), right: buildFade(fadeInto(far), curve) };
  const corners = uShape ? { tl: faint, tr: faint, bl: lit, br: far } : { tl: lit, tr: faint, bl: faint, br: far };
  const showFar = rim === 'full';
  const r = pt(radius);
  const arc: CSSProperties = { position: 'absolute', width: r, height: r, boxSizing: 'border-box', borderStyle: 'solid', borderWidth: 0 };
  return (
    <div className={s.abs} aria-hidden>
      <div style={{ ...arc, top: 0, left: 0, borderTopLeftRadius: r, borderTopWidth: HAIR, borderLeftWidth: HAIR, borderColor: corners.tl }} />
      {showFar && (
        <>
          <div style={{ ...arc, top: 0, right: 0, borderTopRightRadius: r, borderTopWidth: HAIR, borderRightWidth: HAIR, borderColor: corners.tr }} />
          <div style={{ ...arc, bottom: 0, left: 0, borderBottomLeftRadius: r, borderBottomWidth: HAIR, borderLeftWidth: HAIR, borderColor: corners.bl }} />
          <div style={{ ...arc, bottom: 0, right: 0, borderBottomRightRadius: r, borderBottomWidth: HAIR, borderRightWidth: HAIR, borderColor: corners.br }} />
        </>
      )}
      <div style={{ position: 'absolute', top: 0, left: r, right: r, height: HAIR, backgroundImage: grad('90deg', walls.top) }} />
      <div style={{ position: 'absolute', left: 0, top: r, bottom: r, width: HAIR, backgroundImage: grad('180deg', walls.left) }} />
      {showFar && (
        <>
          <div style={{ position: 'absolute', bottom: 0, left: r, right: r, height: HAIR, backgroundImage: grad('90deg', walls.bottom) }} />
          <div style={{ position: 'absolute', right: 0, top: r, bottom: r, width: HAIR, backgroundImage: grad('180deg', walls.right) }} />
        </>
      )}
    </div>
  );
}

/**
 * theme/tokens.ts `glassFrostAt(strength)` / `glassFrostAtLight(strength)`.
 * The app's function is linear in `strength`; the sync calls it at 1
 * (`samples.glassFrostAt1`) and this scales every alpha in that sample.
 */
export function glassFrostAt(mode: AppMode, strength: number): string {
  return samples.glassFrostAt1[mode].replace(/rgba\(([^)]*),\s*([\d.]+)\)/g, (_m, rgb: string, a: string) => `rgba(${rgb}, ${+(Number(a) * strength).toFixed(4)})`);
}

export interface GlassCardProps {
  children?: ReactNode;
  mode?: AppMode;
  emphasis?: Tier | 'none';
  padding?: keyof typeof T.spacing | 'none';
  radius?: number;
  rim?: 'full' | 'topLeft' | 'none';
  /** Face frost strength (omit = glassFace.frost). 0 = no frost. */
  frost?: number;
  /** 'flat' = the opaque-panel variant (glass.background fill, no rim). */
  variant?: 'default' | 'flat';
  /** A solid bed UNDER the face (e.g. colors.receiptCardBed on receipt rows). */
  bed?: string;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
}

export function GlassCard({ children, mode = 'dark', emphasis = 'none', padding = 'md', radius, rim = 'full', frost, variant = 'default', bed, style, contentStyle }: GlassCardProps) {
  const th = appTheme(mode);
  const r = radius ?? th.radii.xl;
  const isPanel = variant === 'flat';
  const edge = emphasis === 'none' ? null : th.glassEdges[emphasis];
  const face: CSSProperties = isPanel
    ? { backgroundColor: th.glass.background }
    : {
        backgroundColor: th.glassFace.fill,
        backgroundImage: frost == null ? th.glassFace.frost : frost > 0 ? glassFrostAt(mode, frost) : undefined,
        boxShadow:
          th.isDark && rim !== 'none'
            ? `inset ${pt(2)} ${pt(2)} ${pt(4)} ${pt(-2)} ${th.glassAccents.highlight}, inset 0 ${pt(-12)} ${pt(24)} ${th.glassAccents.shade}`
            : `inset 0 ${pt(-12)} ${pt(24)} ${th.glassAccents.shade}`,
      };
  const outer = (edge as { outerShadow?: string | null } | null)?.outerShadow;
  return (
    <div className={s.v} style={{ borderRadius: pt(r), backgroundColor: bed, boxShadow: outer ?? undefined, ...style }}>
      <div className={s.v} style={{ flexGrow: 1, overflow: 'hidden', borderRadius: pt(r), ...face }}>
        <div className={s.v} style={{ padding: padding === 'none' ? 0 : pt(th.spacing[padding]), ...contentStyle }}>
          {children}
        </div>
        {!isPanel && rim !== 'none' ? <GlassEdgeRing emphasis={emphasis} radius={r} rim={rim} mode={mode} /> : null}
      </div>
    </div>
  );
}

/**
 * GlassBubble glassStyle="clear" — header title bubbles, header circles, search
 * fields, the Select capsule. Geometry from GlassBubble.tsx `styles.content`
 * (row, gap 8, padding 16 × 8) unless the caller overrides it.
 */
export function LiquidBubble({ children, style, contentStyle, round = true }: { children?: ReactNode; style?: CSSProperties; contentStyle?: CSSProperties; round?: boolean }) {
  const c = rnStyles.glassBubble.styles.styles.content;
  return (
    <div className={`${s.v} ${s.liquid}`} style={{ borderRadius: round ? pt(999) : undefined, ...style }}>
      <div
        className={s.v}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: pt(c.gap),
          paddingLeft: pt(c.paddingHorizontal),
          paddingRight: pt(c.paddingHorizontal),
          paddingTop: pt(c.paddingVertical),
          paddingBottom: pt(c.paddingVertical),
          height: '100%',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
