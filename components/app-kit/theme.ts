// appTheme(mode) — the web twin of PapeXV2 `theme/useAppTheme.ts`: the same
// bundle of mode-resolved tokens a component reads, taken from the GENERATED
// lib/app-kit/tokens.ts (never hand-copied). Kit components receive `mode` as a
// prop instead of reading a context, so they stay plain server-renderable
// functions.

import { theme } from '@/lib/app-kit/tokens';

export type AppMode = 'dark' | 'light';

export function appTheme(mode: AppMode = 'dark') {
  const isDark = mode === 'dark';
  return {
    mode,
    isDark,
    colors: isDark ? theme.colorsDark : theme.colorsLight,
    glass: theme.glass[mode],
    glassEdges: theme.glassEdgesByMode[mode],
    glassEdgeSubtle: theme.glassEdgeSubtleByMode[mode],
    edgeFadeReach: theme.edgeFadeReachByMode[mode],
    edgeRimProfile: theme.edgeRimProfileByMode[mode],
    glassFace: theme.glassFaceByMode[mode],
    glassAccents: theme.glassAccentsByMode[mode],
    glassTint05: theme.glassTint05ByMode[mode],
    shadows: isDark ? theme.shadowsDark : theme.shadowsLight,
    radii: theme.radii,
    spacing: theme.spacing,
    typography: theme.typography,
    iconSize: theme.iconSize,
  };
}

export type AppTheme = ReturnType<typeof appTheme>;
/** The palette, as the vendored helpers (brandContrast, storeTheme) expect it. */
export type AppColors = AppTheme['colors'];
