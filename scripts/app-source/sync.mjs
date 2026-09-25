#!/usr/bin/env node
// npm run app:sync — regenerate the website's copy of the PapeX app's design
// source from the app's own code. No network. Idempotent: a second run with
// the same inputs rewrites nothing.
//
// Inputs (read-only):
//   PAPEXV2_DIR        default ../PapeXV2        (relative to this repo's root)
//   PAPEX_APPCLIP_DIR  default ../Papex_AppClip
//
// Outputs (committed):
//   lib/app-kit/tokens.ts        theme/tokens.ts + motion/pill/tab-bar tokens, and `clip`
//   lib/app-kit/rnStyles.ts      StyleSheets + constants of the mirrored components, tab bar
//   lib/app-kit/glyphs.ts        AppIcon's Material Symbols codepoint map
//   components/app-kit/tokens.css  the same tokens as CSS custom properties + @font-face
//   public/app/kit/**            icons, fonts, logos, screen glow + manifest.json
//
// See docs/design/app-source.md.

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSETS, CLIP_THEME, COMPONENTS, PURE_MODULES, TAB_LAYOUT, VENDOR } from './config.mjs';
import { Evaluator, extractComponent } from './lib/astEval.mjs';
import { EVAL_DEVICE, importPure } from './lib/pureImport.mjs';
import { parseClipTheme } from './lib/swiftTheme.mjs';
import { vendorModule } from './lib/vendor.mjs';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const V2 = path.resolve(WEB, process.env.PAPEXV2_DIR || '../PapeXV2');
const CLIP = path.resolve(WEB, process.env.PAPEX_APPCLIP_DIR || '../Papex_AppClip');
const KIT_PUBLIC = path.join(WEB, 'public/app/kit');
const KIT_URL = '/app/kit';
const CHECK = process.argv.includes('--check');

for (const [name, dir, probe] of [['PAPEXV2_DIR', V2, 'theme/tokens.ts'], ['PAPEX_APPCLIP_DIR', CLIP, CLIP_THEME]]) {
  if (!fs.existsSync(path.join(dir, probe))) {
    console.error(`app:sync: ${name} → ${dir} has no ${probe}. Point ${name} at the checkout.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// provenance
// ---------------------------------------------------------------------------
function git(dir, args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}
function provenance(dir, readFiles) {
  const hash = git(dir, ['rev-parse', 'HEAD']);
  const branch = git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const dirty = readFiles.length ? git(dir, ['status', '--porcelain', '--', ...readFiles]) : '';
  return {
    commit: hash ?? 'unknown',
    short: hash ? hash.slice(0, 8) : 'unknown',
    branch: branch ?? 'unknown',
    // Files this sync read that had uncommitted edits at sync time. Their
    // content is what was generated, so the commit alone doesn't reproduce it.
    uncommitted: dirty ? dirty.split('\n').map((l) => l.slice(3)).sort() : [],
  };
}

// ---------------------------------------------------------------------------
// value helpers
// ---------------------------------------------------------------------------
/** Deep copy keeping only JSON data; functions are dropped and their paths recorded. */
function toData(v, at, dropped) {
  if (typeof v === 'function') {
    dropped.push(at);
    return undefined;
  }
  if (Array.isArray(v)) return v.map((x, i) => toData(x, `${at}[${i}]`, dropped));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const d = toData(x, `${at}.${k}`, dropped);
      if (d !== undefined) o[k] = d;
    }
    return o;
  }
  return v;
}
const lit = (v) => JSON.stringify(v, null, 2);
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
const pt = (n) => (n === 0 ? '0' : `calc(${+n.toFixed(4)} * var(--pt))`);

function writeIfChanged(file, content) {
  const prev = fs.existsSync(file) ? fs.readFileSync(file) : null;
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (prev && prev.equals(next)) return false;
  if (CHECK) {
    changed.push(path.relative(WEB, file));
    return true;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next);
  changed.push(path.relative(WEB, file));
  return true;
}
const changed = [];

// ---------------------------------------------------------------------------
// 1. pure modules (really imported)
// ---------------------------------------------------------------------------
const pure = {};
const droppedFns = [];
for (const [key, rel] of Object.entries(PURE_MODULES)) {
  const ns = await importPure(path.join(V2, rel), V2);
  const data = {};
  for (const [k, v] of Object.entries(ns)) {
    if (k === 'default') continue;
    const d = toData(v, `${key}.${k}`, droppedFns);
    if (d !== undefined) data[k] = d;
  }
  pure[key] = { file: rel, data };
}
const T = pure.theme.data;

// Function-valued theme exports can't be copied as data, but the web kit needs
// their SHAPE at an arbitrary strength. Call the app's own functions at
// strength 1 (a reference sample the kit scales linearly, exactly as the
// function does).
const themeNs = await importPure(path.join(V2, PURE_MODULES.theme), V2);
const pillsNs = await importPure(path.join(V2, PURE_MODULES.pills), V2);
const samples = {
  glassFrostAt1: { dark: themeNs.glassFrostAt(1), light: themeNs.glassFrostAtLight(1) },
  glassTintAt1: { dark: themeNs.glassTintAt(1), light: themeNs.glassTintAtLight(1) },
  // pillTokens.ts `pillTokensFor(mode)` — the per-mode pill set (the named exports are dark only).
  pillTokensFor: { dark: toData(pillsNs.pillTokensFor('dark'), 'pillTokensFor.dark', []), light: toData(pillsNs.pillTokensFor('light'), 'pillTokensFor.light', []) },
};

// ---------------------------------------------------------------------------
// 2. component StyleSheets + constants (AST)
// ---------------------------------------------------------------------------
const ev = new Evaluator(V2, Object.values(PURE_MODULES));
const components = {};
for (const [key, spec] of Object.entries(COMPONENTS)) {
  components[key] = await extractComponent(ev, spec.file, { consts: spec.consts, styleSheets: spec.styleSheets });
}

// ---------------------------------------------------------------------------
// 3. App Clip
// ---------------------------------------------------------------------------
const clip = parseClipTheme(path.join(CLIP, CLIP_THEME));

// ---------------------------------------------------------------------------
// 4. assets
// ---------------------------------------------------------------------------
const repoDir = { papexv2: V2, appclip: CLIP };
const copies = []; // { src, dest, source }
for (const a of ASSETS) {
  const base = repoDir[a.repo];
  const from = path.join(base, a.from);
  if (!fs.existsSync(from)) throw new Error(`app:sync: asset source missing: ${a.repo}:${a.from}`);
  if (fs.statSync(from).isDirectory()) {
    for (const f of fs.readdirSync(from).sort()) {
      const full = path.join(from, f);
      if (!fs.statSync(full).isFile() || (a.match && !a.match.test(f))) continue;
      copies.push({ src: full, dest: path.join(a.to, f), source: `${a.repo}:${path.join(a.from, f)}` });
    }
  } else copies.push({ src: from, dest: a.to, source: `${a.repo}:${a.from}` });
}
const manifestFiles = [];
const wanted = new Set(['manifest.json']);
for (const c of copies) {
  const buf = fs.readFileSync(c.src);
  writeIfChanged(path.join(KIT_PUBLIC, c.dest), buf);
  wanted.add(c.dest);
  manifestFiles.push({
    url: `${KIT_URL}/${c.dest}`,
    source: c.source,
    bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16),
  });
}
// prune stale synced files (only inside public/app/kit, which this script owns)
function walk(dir, rel = '') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    const r = rel ? `${rel}/${f}` : f;
    return fs.statSync(p).isDirectory() ? walk(p, r) : [r];
  });
}
for (const f of walk(KIT_PUBLIC)) {
  if (!wanted.has(f)) {
    changed.push(`(removed) public/app/kit/${f}`);
    if (!CHECK) fs.rmSync(path.join(KIT_PUBLIC, f));
  }
}

/** Web URL of a synced PapeXV2 asset (`assets/…/x.png` → its @2x copy). */
function webAsset(repo, rel) {
  const want = [`${repo}:${rel}`, `${repo}:${rel.replace(/\.png$/, '@2x.png')}`];
  const hit = manifestFiles.find((m) => want.includes(m.source));
  return hit ? hit.url : null;
}

// ---------------------------------------------------------------------------
// 5. tab bar, from app/(tabs)/_layout.tsx
// ---------------------------------------------------------------------------
const layoutSrc = fs.readFileSync(path.join(V2, TAB_LAYOUT), 'utf8');
const TAB_ICONS = components.tabLayout.consts.TAB_ICONS;
const tabs = [];
const triggerRe = /<NativeTabs\.Trigger\s+name="(\w+)"/g;
const starts = [...layoutSrc.matchAll(triggerRe)];
for (const [i, m] of starts.entries()) {
  const chunk = layoutSrc.slice(m.index, starts[i + 1]?.index ?? layoutSrc.length);
  const label = /<NativeTabs\.Trigger\.Label>([^<]+)<\/NativeTabs\.Trigger\.Label>/.exec(chunk)?.[1];
  const iconKey = /src=\{TAB_ICONS\.(\w+)\[/.exec(chunk)?.[1];
  if (!label || !iconKey || !TAB_ICONS?.[iconKey]) throw new Error(`app:sync: tab "${m[1]}" has no label/icon in ${TAB_LAYOUT}`);
  const icons = {};
  for (const mode of ['dark', 'light'])
    for (const state of ['default', 'selected']) {
      const src = TAB_ICONS[iconKey][mode][state].asset;
      icons[`${mode}${state === 'selected' ? 'Selected' : 'Default'}`] = webAsset('papexv2', src);
    }
  tabs.push({ name: m[1], label, icons });
}
const tint = /<NativeTabs[\s\S]*?tintColor=\{colors\.(\w+)\}/.exec(layoutSrc)?.[1];
const minimize = /minimizeBehavior="(\w+)"/.exec(layoutSrc.replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))?.[1];
const navigation = {
  file: TAB_LAYOUT,
  tabs,
  fabTabs: components.tabLayout.consts.FAB_TABS,
  tintColorToken: tint,
  tintColor: T.colorsDark[tint],
  minimizeBehavior: minimize,
};
delete components.tabLayout;

// ---------------------------------------------------------------------------
// provenance + header
// ---------------------------------------------------------------------------
const v2Read = [...new Set([...Object.values(PURE_MODULES), ...VENDOR.map((v) => v.file), ...Object.values(COMPONENTS).map((c) => c.file), TAB_LAYOUT, ...copies.filter((c) => c.source.startsWith('papexv2:')).map((c) => c.source.slice(8))])];
const clipRead = [CLIP_THEME, ...copies.filter((c) => c.source.startsWith('appclip:')).map((c) => c.source.slice(8))];
const SOURCE = {
  papexv2: provenance(V2, v2Read),
  appclip: provenance(CLIP, clipRead),
  evalDevice: EVAL_DEVICE,
};
const headerLine = `GENERATED by npm run app:sync from PapeXV2@${SOURCE.papexv2.short} (${SOURCE.papexv2.branch}) + Papex_AppClip@${SOURCE.appclip.short} — do not edit by hand`;
const dirtyNote = [
  ...SOURCE.papexv2.uncommitted.map((f) => `PapeXV2 working tree: ${f}`),
  ...SOURCE.appclip.uncommitted.map((f) => `Papex_AppClip working tree: ${f}`),
];
const tsHeader = (what, { eslintDisable = false } = {}) =>
  [
    ...(eslintDisable ? ['/* eslint-disable */'] : []),
    `// ${headerLine}`,
    `// ${what}`,
    ...(dirtyNote.length ? ['// Read from uncommitted working-tree content:', ...dirtyNote.map((d) => `//   ${d}`)] : []),
    '// Re-generate: npm run app:sync   (see docs/design/app-source.md)',
    '',
  ].join('\n');

// ---------------------------------------------------------------------------
// emit: lib/app-kit/tokens.ts
// ---------------------------------------------------------------------------
const tokensTs =
  tsHeader('Design tokens: PapeXV2 theme/tokens.ts (+ motion, pills, tab-bar metrics) and the App Clip theme.') +
  `
/** Where these values came from. */
export const SOURCE = ${lit(SOURCE)} as const;

/** PapeXV2 \`${pure.theme.file}\` — every exported value that is data. */
export const theme = ${lit(T)} as const;

/** PapeXV2 \`${pure.motion.file}\` (durations, springs; easing functions omitted). */
export const motion = ${lit(pure.motion.data)} as const;

/** PapeXV2 \`${pure.pills.file}\`. */
export const pills = ${lit(pure.pills.data)} as const;

/** PapeXV2 \`${pure.tabBarMetrics.file}\` (evaluated as iOS). */
export const tabBarMetrics = ${lit(pure.tabBarMetrics.data)} as const;

/** Papex_AppClip \`${CLIP_THEME}\`. */
export const clip = ${lit(clip)} as const;

/** Function-valued exports sampled by calling them: glassFrostAt(1), glassTintAt(1), pillTokensFor(mode). */
export const samples = ${lit(samples)} as const;

/** Function-valued exports that could not be copied as data. */
export const OMITTED_FUNCTIONS = ${lit(droppedFns.sort())} as const;
`;
writeIfChanged(path.join(WEB, 'lib/app-kit/tokens.ts'), tokensTs);

// ---------------------------------------------------------------------------
// emit: lib/app-kit/rnStyles.ts
// ---------------------------------------------------------------------------
const rnTs =
  tsHeader('React Native StyleSheets + constants of the mirrored PapeXV2 components, and the tab bar.') +
  `
/**
 * \`rn.<key>.styles.styles.<name>\` is the object passed to \`StyleSheet.create\`
 * in \`rn.<key>.file\`, with every value resolved to a number/string. Values
 * chosen at runtime (theme colours from hooks, measured sizes) cannot be
 * resolved statically: those properties are ABSENT here and listed in
 * \`unresolved\` — the web port supplies them from \`theme\` in tokens.ts.
 */
export const rn = ${lit(components)} as const;

/** The system tab bar, read from \`${TAB_LAYOUT}\`. Icon URLs are the synced @2x copies. */
export const navigation = ${lit(navigation)} as const;
`;
writeIfChanged(path.join(WEB, 'lib/app-kit/rnStyles.ts'), rnTs);

// ---------------------------------------------------------------------------
// emit: lib/app-kit/glyphs.ts
// ---------------------------------------------------------------------------
const glyphTs =
  tsHeader(`AppIcon glyphs: PapeXV2 \`${PURE_MODULES.glyphs}\` (Material Symbols Rounded 200 codepoints).`) +
  `
export const glyphs = ${lit(pure.glyphs.data.materialGlyphMap)} as const;

export type GlyphName = keyof typeof glyphs;
`;
writeIfChanged(path.join(WEB, 'lib/app-kit/glyphs.ts'), glyphTs);

// ---------------------------------------------------------------------------
// emit: components/app-kit/tokens.css
// ---------------------------------------------------------------------------
const FACE_WEIGHT = { Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };
const fontFaces = manifestFiles
  .filter((m) => m.url.includes('/fonts/'))
  .map((m) => {
    const file = path.basename(m.url);
    let family, weight;
    const b = /^Barlow-(\w+)\.ttf$/.exec(file);
    const p = /^IBMPlexMono-(\w+)\.ttf$/.exec(file);
    if (b) [family, weight] = ['AK Barlow', FACE_WEIGHT[b[1]]];
    else if (p) [family, weight] = ['AK IBM Plex Mono', FACE_WEIGHT[p[1]]];
    else if (file === 'MaterialSymbolsRounded200.ttf') [family, weight] = ['AK Material Symbols', 400];
    else if (file === 'MaterialSymbolsRounded200Fill.ttf') [family, weight] = ['AK Material Symbols Fill', 400];
    else return null;
    return `@font-face {\n  font-family: '${family}';\n  src: url('${m.url}') format('truetype');\n  font-weight: ${weight};\n  font-style: normal;\n  font-display: ${family.includes('Material') ? 'block' : 'swap'};\n}`;
  })
  .filter(Boolean);

/** RN fontFamily name → CSS family var + weight. */
function fontOf(name) {
  const [fam, face = 'Regular'] = name.split('-');
  const family = fam === 'IBMPlexMono' ? 'var(--ak-font-mono)' : 'var(--ak-font-barlow)';
  return { family, weight: FACE_WEIGHT[face] ?? 400 };
}
function shadowCss(s) {
  if (!s || !s.shadowOffset) return 'none';
  const a = s.shadowOpacity ?? 0;
  const c = s.shadowColor === '#000' ? '0, 0, 0' : hexTriplet(s.shadowColor);
  return `${pt(s.shadowOffset.width)} ${pt(s.shadowOffset.height)} ${pt(s.shadowRadius)} rgba(${c}, ${a})`;
}
function hexTriplet(h) {
  const x = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)).join(', ');
}

function modeVars(mode) {
  const out = [];
  const colors = mode === 'dark' ? T.colorsDark : T.colorsLight;
  out.push(`  /* colors${mode === 'dark' ? 'Dark' : 'Light'} */`);
  for (const [k, v] of Object.entries(colors)) if (typeof v === 'string') out.push(`  --ak-c-${kebab(k)}: ${v};`);
  out.push(`  /* glass.${mode} */`);
  out.push(`  --ak-glass-bg: ${T.glass[mode].background};`, `  --ak-glass-border: ${T.glass[mode].border};`, `  --ak-glass-blur-intensity: ${T.glass[mode].blurIntensity};`);
  out.push(`  /* glassFaceByMode.${mode} */`);
  out.push(`  --ak-face-fill: ${T.glassFaceByMode[mode].fill};`, `  --ak-frost: ${T.glassFaceByMode[mode].frost};`);
  out.push(`  /* glassAccentsByMode.${mode} */`);
  out.push(`  --ak-accent-highlight: ${T.glassAccentsByMode[mode].highlight};`, `  --ak-accent-shade: ${T.glassAccentsByMode[mode].shade};`);
  out.push(`  /* glassTintByMode / glassTint05ByMode */`);
  out.push(`  --ak-tint: ${T.glassTintByMode[mode]};`, `  --ak-tint-05: ${T.glassTint05ByMode[mode]};`);
  out.push(`  /* glassEdgesByMode.${mode} + edgeFadeReachByMode.${mode} */`);
  for (const [tier, e] of Object.entries(T.glassEdgesByMode[mode])) {
    for (const k of ['lit', 'far', 'faint', 'clear', 'wash', 'halo', 'outerShadow'])
      if (e[k] != null) out.push(`  --ak-edge-${tier}-${kebab(k)}: ${e[k]};`);
    out.push(`  --ak-edge-${tier}-reach: ${T.edgeFadeReachByMode[mode][tier]};`);
  }
  if (T.glassEdgeSubtleByMode?.[mode]) {
    const e = T.glassEdgeSubtleByMode[mode];
    for (const k of ['lit', 'far', 'faint', 'clear']) if (e[k] != null) out.push(`  --ak-edge-subtle-${k}: ${e[k]};`);
  }
  out.push(`  /* shadows${mode === 'dark' ? 'Dark' : 'Light'} */`);
  for (const [k, s] of Object.entries(mode === 'dark' ? T.shadowsDark : T.shadowsLight)) out.push(`  --ak-shadow-${kebab(k)}: ${shadowCss(s)};`);
  return out;
}

const shared = [];
shared.push('  /* 1 app point. The host sets --pt = (rendered screen width / 393pt). */', '  --pt: 1px;');
shared.push(`  --ak-screen-w: ${pt(EVAL_DEVICE.width)};`, `  --ak-screen-h: ${pt(EVAL_DEVICE.height)};`);
shared.push("  --ak-font-barlow: 'AK Barlow', var(--font-barlow, 'Barlow'), system-ui, sans-serif;");
shared.push("  --ak-font-mono: 'AK IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace;");
shared.push("  --ak-font-system: -apple-system, 'SF Pro Text', system-ui, sans-serif;");
shared.push("  --ak-font-icon: 'AK Material Symbols';", "  --ak-font-icon-fill: 'AK Material Symbols Fill';");
shared.push('  /* spacing */');
for (const [k, v] of Object.entries(T.spacing)) shared.push(`  --ak-space-${k}: ${pt(v)};`);
shared.push('  /* radii */');
for (const [k, v] of Object.entries(T.radii)) shared.push(`  --ak-radius-${k}: ${pt(v)};`);
shared.push('  /* iconSize */');
for (const [k, v] of Object.entries(T.iconSize)) shared.push(`  --ak-icon-${k}: ${pt(v)};`);
shared.push('  /* typography */');
for (const [k, t] of Object.entries(T.typography)) {
  const f = fontOf(t.fontFamily);
  shared.push(`  --ak-type-${kebab(k)}-family: ${f.family};`, `  --ak-type-${kebab(k)}-weight: ${f.weight};`, `  --ak-type-${kebab(k)}-size: ${pt(t.fontSize)};`);
  if (t.lineHeight) shared.push(`  --ak-type-${kebab(k)}-leading: ${pt(t.lineHeight)};`);
  if (t.letterSpacing) shared.push(`  --ak-type-${kebab(k)}-tracking: ${pt(t.letterSpacing)};`);
}

const clipVars = [];
for (const [k, v] of Object.entries(clip.color)) clipVars.push(`  --akc-${kebab(k)}: ${v};`);
for (const [k, v] of Object.entries(clip.spacing)) clipVars.push(`  --akc-space-${k}: ${pt(v)};`);
for (const [k, v] of Object.entries(clip.radius)) clipVars.push(`  --akc-radius-${k}: ${pt(v)};`);
const orangeRgb = hexTriplet(clip.color.orange);
const rimStops = clip.glassCard.rimStops.map((s) => `rgba(var(--akc-rim-rgb), ${s.opacity}) ${s.location * 100}%`).join(', ');
clipVars.push(`  --akc-card-fill: ${clip.glassCard.fill};`, `  --akc-rim-width: ${pt(clip.glassCard.rimWidth)};`);
clipVars.push(`  /* GlassCardModifier rim: set --akc-rim-rgb per card (orange default) */`, `  --akc-rim-rgb: ${orangeRgb};`, `  --akc-rim: linear-gradient(135deg, ${rimStops});`);
clipVars.push(
  `  /* PapeXBackground */`,
  `  --akc-background: ${clip.background.glows
    .map((g) => `radial-gradient(circle ${pt(g.endRadius)} at ${g.x * 100}% ${g.y * 100}%, ${g.color}, transparent)`)
    .join(', ')}, ${clip.background.base};`
);

const css = [
  `/* ${headerLine}`,
  ' * PapeXV2 theme/tokens.ts (dark = default, [data-mode="light"] = colorsLight) and',
  ' * Papex_AppClip PapeXTheme.swift ([data-app-kit-clip]) as CSS custom properties.',
  ...dirtyNote.map((d) => ` * Read from uncommitted: ${d}`),
  ' * Re-generate: npm run app:sync   (see docs/design/app-source.md) */',
  '',
  ...fontFaces,
  '',
  '[data-app-kit] {',
  ...shared,
  ...modeVars('dark'),
  '}',
  '',
  "[data-app-kit][data-mode='light'] {",
  ...modeVars('light'),
  '}',
  '',
  '/* Sits INSIDE [data-app-kit] (which sets --pt); inherits --pt from it. */',
  '[data-app-kit-clip] {',
  "  --akc-font: 'AK Barlow', var(--font-barlow, 'Barlow'), system-ui, sans-serif;",
  ...clipVars,
  '}',
  '',
].join('\n');
writeIfChanged(path.join(WEB, 'components/app-kit/tokens.css'), css);

// ---------------------------------------------------------------------------
// emit: lib/app-kit/vendor/*
// ---------------------------------------------------------------------------
const byFile = new Map(VENDOR.map((v) => [v.file, v.out]));
const vendorWanted = new Set();
for (const v of VENDOR) {
  const body = vendorModule(V2, v, byFile);
  const header =
    tsHeader(`VENDORED verbatim from PapeXV2 \`${v.file}\` (only type imports stubbed, sibling imports re-pointed).`, { eslintDisable: true }) +
    '// @ts-nocheck — the app type-checks this file; here its domain types are `any` stubs.\n\n';
  writeIfChanged(path.join(WEB, 'lib/app-kit/vendor', v.out), header + body);
  vendorWanted.add(v.out);
}
for (const f of fs.existsSync(path.join(WEB, 'lib/app-kit/vendor')) ? fs.readdirSync(path.join(WEB, 'lib/app-kit/vendor')) : []) {
  if (!vendorWanted.has(f)) {
    changed.push(`(removed) lib/app-kit/vendor/${f}`);
    if (!CHECK) fs.rmSync(path.join(WEB, 'lib/app-kit/vendor', f));
  }
}

// ---------------------------------------------------------------------------
// emit: manifest
// ---------------------------------------------------------------------------
const manifest = {
  generatedBy: 'npm run app:sync (scripts/app-source/sync.mjs)',
  sources: {
    papexv2: { commit: SOURCE.papexv2.commit, branch: SOURCE.papexv2.branch, uncommitted: SOURCE.papexv2.uncommitted },
    appclip: { commit: SOURCE.appclip.commit, branch: SOURCE.appclip.branch, uncommitted: SOURCE.appclip.uncommitted },
  },
  files: manifestFiles.sort((a, b) => a.url.localeCompare(b.url)),
};
writeIfChanged(path.join(KIT_PUBLIC, 'manifest.json'), lit(manifest) + '\n');

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const count = (o) => (o && typeof o === 'object' ? Object.values(o).reduce((n, v) => n + count(v), 0) : 1);
const unresolvedTotal = Object.values(components).reduce((n, c) => n + c.unresolved.length, 0);
console.log(`app:sync  PapeXV2@${SOURCE.papexv2.short} (${SOURCE.papexv2.branch})  Papex_AppClip@${SOURCE.appclip.short} (${SOURCE.appclip.branch})`);
if (dirtyNote.length) console.log(`  uncommitted inputs: ${dirtyNote.join(', ')}`);
console.log(`  theme leaf values: ${count(T)}   motion: ${count(pure.motion.data)}   pills: ${count(pure.pills.data)}   clip: ${count(clip)}`);
console.log(`  components: ${Object.keys(components).length} (${Object.values(components).reduce((n, c) => n + Object.keys(c.styles.styles ?? {}).length, 0)} style entries, ${unresolvedTotal} runtime-only props listed as unresolved)`);
console.log(`  tabs: ${tabs.map((t) => t.label).join(' · ')}   fab on: ${navigation.fabTabs.join(', ')}`);
console.log(`  glyphs: ${Object.keys(pure.glyphs.data.materialGlyphMap).length}   assets: ${manifestFiles.length} files, ${(manifestFiles.reduce((n, m) => n + m.bytes, 0) / 1024).toFixed(0)} KB`);
console.log(`  omitted function exports: ${droppedFns.length}`);
if (CHECK) {
  if (changed.length) {
    console.log(`  OUT OF DATE (${changed.length}):\n    ${changed.join('\n    ')}`);
    process.exit(1);
  }
  console.log('  up to date');
} else console.log(changed.length ? `  wrote ${changed.length} file(s)` : '  no changes (idempotent)');
