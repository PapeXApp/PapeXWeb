// pureImport — load a PapeXV2 TypeScript module FOR REAL (not by parsing it),
// so computed tokens (glassEdges built by edgeTier(), glassFace.frost built by
// solidFrost(), …) come out exactly as the app computes them.
//
// How: transpile the module and every LOCAL module it imports with the
// `typescript` compiler already in this repo, write them as .mjs into a temp
// dir, rewrite the relative specifiers, and `import()` the entry.
//
// Package imports are NOT loaded. Only `react-native` is allowed, and it is
// replaced by EVAL_RN_STUB below: the handful of APIs the token modules touch
// at module scope (Platform, PixelRatio, StyleSheet, Easing, Dimensions),
// answering as an iPhone 15/16 on iOS (393×852 pt, @3x). Any other package
// import makes the module "impure" and the caller falls back to AST
// evaluation. Type-only imports are erased by the transpiler, so they never
// count.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

export const EVAL_DEVICE = { os: 'ios', width: 393, height: 852, scale: 3, fontScale: 1 };

const EVAL_RN_STUB = `
const scale = ${EVAL_DEVICE.scale};
const easingFn = (name) => { const f = (t) => t; f.__easing = name; return f; };
export const Platform = { OS: 'ios', Version: '26.0', select: (o) => ('ios' in o ? o.ios : 'native' in o ? o.native : o.default) };
export const PixelRatio = { get: () => scale, getFontScale: () => ${EVAL_DEVICE.fontScale}, roundToNearestPixel: (x) => Math.round(x * scale) / scale, getPixelSizeForLayoutSize: (x) => Math.round(x * scale) };
export const Dimensions = { get: () => ({ width: ${EVAL_DEVICE.width}, height: ${EVAL_DEVICE.height}, scale, fontScale: ${EVAL_DEVICE.fontScale} }) };
export const StyleSheet = { create: (s) => s, hairlineWidth: 1 / scale, absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, flatten: (s) => s };
export const Easing = new Proxy({}, { get: (_, k) => (k === 'bezier' ? (...p) => easingFn('bezier(' + p.join(',') + ')') : ['in', 'out', 'inOut'].includes(k) ? (f) => f : easingFn(String(k))) });
export default { Platform, PixelRatio, Dimensions, StyleSheet, Easing };
`;

const STUB_EXPORTS = ['Platform', 'PixelRatio', 'Dimensions', 'StyleSheet', 'Easing', 'default'];
function rnNamedImports(js) {
  const out = [];
  for (const m of js.matchAll(/import\s*(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"]react-native['"]/g)) {
    if (m[1]) out.push('default');
    if (m[2]) out.push(...m[2].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean));
  }
  return out;
}

const LOCAL_EXTS = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

function resolveLocal(fromFile, spec, root) {
  let base;
  if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else if (spec.startsWith('@/')) base = path.join(root, spec.slice(2));
  else return null;
  for (const e of ['', ...LOCAL_EXTS]) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  throw new Error(`pureImport: cannot resolve ${spec} from ${fromFile}`);
}

/** Specifiers of runtime imports/exports left after type erasure. */
function runtimeSpecifiers(js) {
  const out = [];
  const re = /(?:^|\n)\s*(?:import|export)\s[^;'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(js))) out.push(m[1] || m[2]);
  return out;
}

function transpile(file) {
  const src = fs.readFileSync(file, 'utf8');
  return ts.transpileModule(src, {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      verbatimModuleSyntax: false,
      isolatedModules: true,
    },
  }).outputText;
}

/**
 * Is `file` pure, i.e. loadable with only local modules + the RN stub?
 * Returns { pure: true, files } or { pure: false, reason }.
 */
export function analyse(file, root) {
  const files = new Map();
  const stack = [file];
  while (stack.length) {
    const f = stack.pop();
    if (files.has(f)) continue;
    const js = transpile(f);
    files.set(f, js);
    for (const spec of runtimeSpecifiers(js)) {
      if (spec === 'react-native') {
        const missing = rnNamedImports(js).filter((n) => !STUB_EXPORTS.includes(n));
        if (missing.length) return { pure: false, reason: `${path.relative(root, f)} needs react-native ${missing.join(', ')}` };
        continue;
      }
      const local = resolveLocal(f, spec, root);
      if (!local) return { pure: false, reason: `${path.relative(root, f)} imports package "${spec}"` };
      stack.push(local);
    }
  }
  return { pure: true, files };
}

/** Import a pure module for real. Throws if it is not pure. */
export async function importPure(file, root) {
  const a = analyse(file, root);
  if (!a.pure) throw new Error(`pureImport: ${a.reason}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-sync-'));
  try {
    const stub = path.join(tmp, '__react_native_stub.mjs');
    fs.writeFileSync(stub, EVAL_RN_STUB);
    const outOf = (f) => path.join(tmp, path.relative(root, f).replace(/\.tsx?$/, '.mjs'));
    for (const [f, js] of a.files) {
      const out = outOf(f);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const rewritten = js.replace(/(from\s*|import\s*)(['"])([^'"]+)\2/g, (whole, kw, q, spec) => {
        let target;
        if (spec === 'react-native') target = stub;
        else {
          const local = resolveLocal(f, spec, root);
          if (!local) return whole;
          target = outOf(local);
        }
        let rel = path.relative(path.dirname(out), target);
        if (!rel.startsWith('.')) rel = './' + rel;
        return `${kw}${q}${rel}${q}`;
      });
      fs.writeFileSync(out, rewritten);
    }
    return await import(pathToFileURL(outOf(file)).href);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
