// Tag + PillButton (small).
//
// Mirrors:
//   Tag         PapeXV2 components/ui/pills/Tag.tsx — geometry `tagGeometry`,
//               type `pillType.tag`, icon ink `tagIconInk[tone]`, label ink
//               `pillInk.selected`; the face is the quiet pill face
//               (`pillQuietFace` sheen + bottom shade + top gleam) that
//               `SelectedLayer variant="tag"` paints.
//   PillButton  PapeXV2 components/ui/pills/PillButton.tsx — `pillButtonGeometry`,
//               accent tone = orange fill, neutral = quiet face.
// Mode-specific pill colours come from `samples.pillTokensFor[mode]` (the sync
// calls pillTokens.ts `pillTokensFor('dark' | 'light')`); geometry and type are
// mode-independent named exports.

import type { CSSProperties } from 'react';
import type { GlyphName } from '@/lib/app-kit/glyphs';
import { pills, samples } from '@/lib/app-kit/tokens';
import type { AppMode } from './theme';
import { Glyph, T, V } from './primitives';
import { font, pt, rn } from './rnStyle';
import { rn as rnStyles } from '@/lib/app-kit/rnStyles';

type Tone = 'neutral' | 'attention' | 'shared';

function quietFace(radius: number, mode: AppMode): CSSProperties {
  const f = samples.pillTokensFor[mode].pillQuietFace;
  return {
    borderRadius: pt(radius),
    backgroundImage: `${f.gleam.image}, ${f.sheen}`,
    backgroundSize: `calc(100% - ${pt(f.gleam.inset * 2)}) ${pt(f.gleam.height)}, 100% 100%`,
    backgroundPosition: `center ${pt(f.gleam.top)}, 0 0`,
    backgroundRepeat: 'no-repeat',
    boxShadow: f.shade.replace(/(-?\d+(?:\.\d+)?)px/g, (_m, n) => pt(Number(n))),
  };
}

export function Tag({ label, icon, tone = 'neutral', mode = 'dark', style }: { label: string; icon?: GlyphName; tone?: Tone; mode?: AppMode; style?: CSSProperties }) {
  const P = samples.pillTokensFor[mode];
  const g = pills.tagGeometry;
  const type = pills.pillType.tag;
  return (
    <V style={{ ...rn(rnStyles.tag.styles.styles.tag), ...quietFace(g.radius, mode), ...style }}>
      {icon ? <Glyph name={icon} size={g.iconSize} color={P.tagIconInk[tone]} /> : null}
      <T lines={1} style={{ ...font(type.fontFamily), fontSize: pt(type.fontSize), lineHeight: pt(type.lineHeight), color: P.pillInk.selected }}>
        {label}
      </T>
    </V>
  );
}

export function PillButton({ label, icon, tone = 'neutral', size = 'md', mode = 'dark', style }: { label: string; icon?: GlyphName; tone?: 'neutral' | 'accent'; size?: 'md' | 'sm'; mode?: AppMode; style?: CSSProperties }) {
  const P = samples.pillTokensFor[mode];
  const g = pills.pillButtonGeometry[size];
  const type = size === 'sm' ? pills.pillType.buttonSm : pills.pillType.button;
  const accent = tone === 'accent';
  return (
    <V
      style={{
        ...rn(rnStyles.pillButton.styles.styles.body),
        height: pt(g.height),
        paddingLeft: pt(icon ? g.padLead : g.padText),
        paddingRight: pt(icon ? g.padTrail : g.padText),
        gap: pt(g.gap),
        justifyContent: 'center',
        ...(accent ? { borderRadius: pt(g.radius), backgroundColor: 'var(--ak-c-accent)' } : quietFace(g.radius, mode)),
        ...style,
      }}
    >
      {icon ? <Glyph name={icon} size={g.iconSize} color={accent ? 'var(--ak-c-button-text)' : P.pillInk.selected} /> : null}
      <T lines={1} style={{ ...font(type.fontFamily), fontSize: pt(type.fontSize), lineHeight: pt(type.lineHeight), color: accent ? 'var(--ak-c-button-text)' : P.pillInk.selected }}>
        {label}
      </T>
    </V>
  );
}
