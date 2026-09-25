// swiftTheme — read the App Clip's design tokens out of
// Papex_AppClip/Sources/AppClip/PapeXTheme.swift.
//
// The file is small and regular, so this is a strict line parser rather than
// a Swift front end. It is STRICT on purpose: every section the web kit relies
// on must be found, or the sync fails loudly instead of emitting a half-empty
// `clip` namespace.
//
//   enum PXColor { static let x = Color(hex: 0xRRGGBB[, alpha: a]) | Color.white.opacity(a) }
//   enum PXSpacing / PXRadius { static let x: CGFloat = n }
//   PXFont.barlow weight switch  (.bold → "Barlow-Bold", …)
//   GlassCardModifier            (rim gradient stops, default padding/radius)
//   PapeXBackground              (two orange radial glows)

import fs from 'node:fs';

const hex = (n) => '#' + n.toString(16).padStart(6, '0').toUpperCase();
const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${+a.toFixed(4)})`;
const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function block(src, header) {
  const i = src.indexOf(header);
  if (i < 0) throw new Error(`swiftTheme: "${header}" not found`);
  let depth = 0;
  let start = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') {
      if (depth === 0) start = j + 1;
      depth++;
    } else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, j);
    }
  }
  throw new Error(`swiftTheme: unbalanced block after "${header}"`);
}

function numbers(body, what) {
  const out = {};
  for (const m of body.matchAll(/static let (\w+)\s*:\s*CGFloat\s*=\s*([\d.]+)/g)) out[m[1]] = Number(m[2]);
  if (!Object.keys(out).length) throw new Error(`swiftTheme: no CGFloat values in ${what}`);
  return out;
}

export function parseClipTheme(file) {
  const src = fs.readFileSync(file, 'utf8');

  // --- colours -------------------------------------------------------------
  const colorBody = block(src, 'enum PXColor');
  const color = {};
  for (const m of colorBody.matchAll(/static let (\w+)\s*=\s*(.+)/g)) {
    const [, name, expr] = m;
    let v;
    let h = /Color\(hex:\s*0x([0-9A-Fa-f]{6})(?:\s*,\s*alpha:\s*([\d.]+))?\)/.exec(expr);
    if (h) {
      const base = hex(parseInt(h[1], 16));
      v = h[2] ? rgba(...rgbOf(base), Number(h[2])) : base;
    } else if ((h = /Color\.(white|black)\.opacity\(([\d.]+)\)/.exec(expr))) {
      v = h[1] === 'white' ? rgba(255, 255, 255, Number(h[2])) : rgba(0, 0, 0, Number(h[2]));
    } else throw new Error(`swiftTheme: unparsed colour ${name} = ${expr}`);
    color[name] = v;
  }
  for (const k of ['navy', 'orange', 'blue', 'standardOutline', 'textPrimary', 'textSecondary', 'textMuted', 'cardSurface', 'cardBorder', 'hairline'])
    if (!(k in color)) throw new Error(`swiftTheme: PXColor.${k} missing`);

  // --- font weights (PXFont.barlow switch) ----------------------------------
  const fontBody = block(src, 'enum PXFont');
  const fontFace = {};
  for (const m of fontBody.matchAll(/case ([^:]+):\s*name\s*=\s*"([\w-]+)"/g)) {
    for (const w of m[1].split(',')) fontFace[w.trim().replace(/^\./, '')] = m[2];
  }
  const def = /default:\s*name\s*=\s*"([\w-]+)"/.exec(fontBody);
  if (!def || !Object.keys(fontFace).length) throw new Error('swiftTheme: PXFont.barlow switch not parsed');
  fontFace.regular = def[1];

  // --- spacing / radius ----------------------------------------------------
  const spacing = numbers(block(src, 'enum PXSpacing'), 'PXSpacing');
  const radius = numbers(block(src, 'enum PXRadius'), 'PXRadius');

  // --- glass card rim -------------------------------------------------------
  const card = block(src, 'struct GlassCardModifier');
  const rimStops = [...card.matchAll(/\.init\(color:\s*edge\.opacity\(([\d.]+)\),\s*location:\s*([\d.]+)\)/g)].map((m) => ({
    opacity: Number(m[1]),
    location: Number(m[2]),
  }));
  const lw = /lineWidth:\s*([\d.]+)/.exec(card);
  if (rimStops.length < 2 || !lw) throw new Error('swiftTheme: GlassCardModifier rim not parsed');

  // --- background glows ------------------------------------------------------
  const bg = block(src, 'struct PapeXBackground');
  const glows = [...bg.matchAll(/RadialGradient\(\s*colors:\s*\[PXColor\.(\w+)\.opacity\(([\d.]+)\)[^\]]*\],\s*center:\s*UnitPoint\(x:\s*([\d.]+),\s*y:\s*([\d.]+)\),\s*startRadius:\s*([\d.]+),\s*endRadius:\s*([\d.]+)/g)].map(
    (m) => ({ color: rgba(...rgbOf(color[m[1]]), Number(m[2])), x: Number(m[3]), y: Number(m[4]), startRadius: Number(m[5]), endRadius: Number(m[6]) })
  );
  if (glows.length < 1) throw new Error('swiftTheme: PapeXBackground glows not parsed');

  return {
    color,
    font: { family: 'Barlow', faceByWeight: fontFace },
    spacing,
    radius,
    glassCard: { rimStops, rimWidth: Number(lw[1]), fill: color.cardSurface },
    background: { base: color.navy, glows },
  };
}
