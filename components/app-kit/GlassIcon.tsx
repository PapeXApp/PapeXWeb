// GlassIcon — mirrors PapeXV2 components/icons/GlassIcon.tsx: the 3D glass PNG
// set (synced to /app/kit/icons/glass, @2x), dark bake or `-light` bake by
// mode, names resolved through the app's own GLASS_ALIASES (generated).
// FavoriteHeartGlyph — components/coupons/FavoriteHeartGlyph.tsx: grey
// `heart-off` with the orange `heart` over it when active.

import { rn as R } from '@/lib/app-kit/rnStyles';
import { pt } from './rnStyle';
import type { AppMode } from './theme';

const ALIASES = R.glassIcon.consts.GLASS_ALIASES as Record<string, string>;
const BASES = R.glassIcon.consts.GLASS_SOURCES as Record<string, { asset: string }>;
export type GlassIconName = keyof typeof R.glassIcon.consts.GLASS_SOURCES | keyof typeof R.glassIcon.consts.GLASS_ALIASES;

export function glassIconUrl(name: GlassIconName, mode: AppMode = 'dark'): string {
  const base = ALIASES[name] ?? name;
  if (!(base in BASES)) throw new Error(`GlassIcon: no glass icon "${name}"`);
  return `/app/kit/icons/glass/${base}${mode === 'light' ? '-light' : ''}@2x.png`;
}

export function GlassIcon({ name, size = 24, mode = 'dark', style }: { name: GlassIconName; size?: number; mode?: AppMode; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={glassIconUrl(name, mode)} alt="" aria-hidden style={{ width: pt(size), height: pt(size), display: 'block', flexShrink: 0, ...style }} />;
}

export function FavoriteHeartGlyph({ active, size, mode = 'dark' }: { active: boolean; size: number; mode?: AppMode }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: pt(size), height: pt(size), flexShrink: 0 }} aria-hidden>
      <GlassIcon name="heart-off" size={size} mode={mode} style={{ position: 'absolute', inset: 0 }} />
      {active ? <GlassIcon name="heart" size={size} mode={mode} style={{ position: 'absolute', inset: 0 }} /> : null}
    </span>
  );
}
