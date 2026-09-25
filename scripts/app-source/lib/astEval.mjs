// astEval — read constant data out of a PapeXV2 COMPONENT file without running
// it. Component files import React, Reanimated, expo-* … so they cannot be
// imported in Node; but their `StyleSheet.create({...})` block and their
// top-level numeric constants (FAB_SIZE, HEADER_BUBBLE_HEIGHT, …) are plain
// data, and that data is exactly the geometry the web kit must match.
//
// The evaluator understands literals, templates, arithmetic, `?:`, `??`,
// object/array literals with spreads, `as`/`satisfies`, Math.*, the usual
// StyleSheet/Platform/PixelRatio calls, and identifiers that resolve to:
//   - a top-level `const` in the same file (evaluated lazily, recursively),
//   - a named import from a PURE module (really imported, see pureImport),
//   - a named import from another local file (AST-evaluated the same way).
// Anything else (a hook result, a theme colour chosen at runtime, a function
// call) is UNRESOLVED: the property is dropped from the output and its path is
// listed under `unresolved`, so a porter can see exactly what is dynamic.

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { analyse, importPure, EVAL_DEVICE } from './pureImport.mjs';

export const UNRESOLVED = Symbol('unresolved');

const EXTS = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

export class Evaluator {
  /**
   * @param root   PapeXV2 checkout
   * @param allowReal  repo-relative paths that may be REALLY imported (executed).
   *   Everything else is only ever parsed. Keep this to token leaves: executing
   *   app code (services, screens) at sync time is exactly what must not happen.
   */
  constructor(root, allowReal = []) {
    this.root = root;
    this.allowReal = new Set(allowReal);
    this.modules = new Map(); // abs path -> ModuleEval
    this.pureCache = new Map(); // abs path -> namespace | null
  }

  resolve(fromFile, spec) {
    let base;
    if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
    else if (spec.startsWith('@/')) base = path.join(this.root, spec.slice(2));
    else return null;
    for (const e of EXTS) {
      const p = base + e;
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }
    return null;
  }

  async preloadPure(file) {
    if (this.pureCache.has(file)) return this.pureCache.get(file);
    let ns = null;
    const rel = path.relative(this.root, file);
    if (this.allowReal.has(rel) && analyse(file, this.root).pure) ns = await importPure(file, this.root);
    this.pureCache.set(file, ns);
    return ns;
  }

  /** Exported binding `name` of `file`: from the real module if it was imported, else by AST. */
  valueOf(file, name) {
    const ns = this.pureCache.get(file);
    if (ns) return name in ns ? ns[name] : UNRESOLVED;
    return this.module(file).get(name);
  }

  module(file) {
    if (!this.modules.has(file)) this.modules.set(file, new ModuleEval(this, file));
    return this.modules.get(file);
  }

  /** Walk the local import graph of `file` and really-import every pure module in it. */
  async prepare(file, seen = new Set()) {
    if (seen.has(file)) return;
    seen.add(file);
    if (await this.preloadPure(file)) return;
    const mod = this.module(file);
    for (const imp of mod.imports.values()) {
      if (imp.file) await this.prepare(imp.file, seen);
    }
    for (const r of mod.reexports.values()) await this.prepare(r.file, seen);
    for (const f of mod.starFrom) await this.prepare(f, seen);
  }
}

class ModuleEval {
  constructor(ev, file) {
    this.ev = ev;
    this.file = file;
    this.rel = path.relative(ev.root, file);
    const src = fs.readFileSync(file, 'utf8');
    this.sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    this.decls = new Map(); // name -> initializer node
    this.imports = new Map(); // local -> { file|null, spec, name }
    this.reexports = new Map(); // exported name -> { file, name }  (export { a as b } from './x')
    this.starFrom = []; // files of `export * from './x'`
    this.cache = new Map();
    this.evaluating = new Set();
    for (const st of this.sf.statements) {
      if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (ts.isIdentifier(d.name) && d.initializer) this.decls.set(d.name.text, d.initializer);
        }
      } else if (ts.isExportDeclaration(st) && st.moduleSpecifier && !st.isTypeOnly) {
        const target = ev.resolve(file, st.moduleSpecifier.text);
        if (!target) continue;
        if (!st.exportClause) this.starFrom.push(target);
        else if (ts.isNamedExports(st.exportClause)) {
          for (const el of st.exportClause.elements) {
            if (el.isTypeOnly) continue;
            this.reexports.set(el.name.text, { file: target, name: (el.propertyName || el.name).text });
          }
        }
      } else if (ts.isImportDeclaration(st) && st.importClause && !st.importClause.isTypeOnly) {
        const spec = st.moduleSpecifier.text;
        const target = ev.resolve(file, spec);
        const ic = st.importClause;
        if (ic.name) this.imports.set(ic.name.text, { file: target, spec, name: 'default' });
        if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) {
          for (const el of ic.namedBindings.elements) {
            if (el.isTypeOnly) continue;
            this.imports.set(el.name.text, { file: target, spec, name: (el.propertyName || el.name).text });
          }
        } else if (ic.namedBindings && ts.isNamespaceImport(ic.namedBindings)) {
          this.imports.set(ic.namedBindings.name.text, { file: target, spec, name: '*' });
        }
      }
    }
  }

  /** Value of a top-level binding (const or import), or UNRESOLVED. */
  get(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    if (this.evaluating.has(name)) return UNRESOLVED;
    this.evaluating.add(name);
    let v = UNRESOLVED;
    if (this.decls.has(name)) v = this.eval(this.decls.get(name), []);
    else if (this.reexports.has(name)) {
      const r = this.reexports.get(name);
      v = r.name === 'default' ? UNRESOLVED : this.ev.valueOf(r.file, r.name);
    } else if (this.imports.has(name)) {
      const imp = this.imports.get(name);
      if (imp.file) {
        const ns = this.ev.pureCache.get(imp.file);
        if (imp.name === '*') v = ns ?? UNRESOLVED;
        else if (imp.name !== 'default') v = this.ev.valueOf(imp.file, imp.name);
      } else if (imp.spec === 'react-native') {
        v = RN_EVAL[imp.name] ?? UNRESOLVED;
      }
    }
    if (v === UNRESOLVED && !this.decls.has(name) && !this.imports.has(name)) {
      for (const f of this.starFrom) {
        v = this.ev.valueOf(f, name);
        if (v !== UNRESOLVED) break;
      }
    }
    this.evaluating.delete(name);
    this.cache.set(name, v);
    return v;
  }

  /** The object passed to the first `const <name> = StyleSheet.create(...)`. */
  styleSheet(name = 'styles') {
    const init = this.decls.get(name);
    if (!init) return null;
    const unresolved = [];
    const value = this.eval(init, unresolved, name);
    return { value: value === UNRESOLVED ? {} : value, unresolved };
  }

  eval(node, unresolved, at = '') {
    const E = (n, p = at) => this.eval(n, unresolved, p);
    switch (node.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return Number(node.text);
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        return node.text;
      case ts.SyntaxKind.TrueKeyword:
        return true;
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.NullKeyword:
        return null;
      case ts.SyntaxKind.TemplateExpression: {
        let s = node.head.text;
        for (const span of node.templateSpans) {
          const v = E(span.expression);
          if (v === UNRESOLVED || (typeof v === 'object' && v !== null)) return UNRESOLVED;
          s += String(v) + span.literal.text;
        }
        return s;
      }
      case ts.SyntaxKind.ParenthesizedExpression:
      case ts.SyntaxKind.AsExpression:
      case ts.SyntaxKind.SatisfiesExpression:
      case ts.SyntaxKind.TypeAssertionExpression:
      case ts.SyntaxKind.NonNullExpression:
        return E(node.expression);
      case ts.SyntaxKind.PrefixUnaryExpression: {
        const v = E(node.operand);
        if (v === UNRESOLVED) return UNRESOLVED;
        switch (node.operator) {
          case ts.SyntaxKind.MinusToken: return -v;
          case ts.SyntaxKind.PlusToken: return +v;
          case ts.SyntaxKind.ExclamationToken: return !v;
          default: return UNRESOLVED;
        }
      }
      case ts.SyntaxKind.BinaryExpression: {
        const op = node.operatorToken.kind;
        const l = E(node.left);
        if (op === ts.SyntaxKind.QuestionQuestionToken) return l === UNRESOLVED ? UNRESOLVED : l ?? E(node.right);
        const r = E(node.right);
        if (l === UNRESOLVED || r === UNRESOLVED) return UNRESOLVED;
        switch (op) {
          case ts.SyntaxKind.PlusToken: return l + r;
          case ts.SyntaxKind.MinusToken: return l - r;
          case ts.SyntaxKind.AsteriskToken: return l * r;
          case ts.SyntaxKind.SlashToken: return l / r;
          case ts.SyntaxKind.PercentToken: return l % r;
          case ts.SyntaxKind.BarBarToken: return l || r;
          case ts.SyntaxKind.AmpersandAmpersandToken: return l && r;
          case ts.SyntaxKind.GreaterThanToken: return l > r;
          case ts.SyntaxKind.LessThanToken: return l < r;
          case ts.SyntaxKind.EqualsEqualsEqualsToken: return l === r;
          case ts.SyntaxKind.ExclamationEqualsEqualsToken: return l !== r;
          default: return UNRESOLVED;
        }
      }
      case ts.SyntaxKind.ConditionalExpression: {
        const c = E(node.condition);
        if (c === UNRESOLVED) return UNRESOLVED;
        return c ? E(node.whenTrue) : E(node.whenFalse);
      }
      case ts.SyntaxKind.Identifier:
        if (node.text === 'undefined') return undefined;
        return this.get(node.text);
      case ts.SyntaxKind.PropertyAccessExpression: {
        const o = E(node.expression);
        if (o === UNRESOLVED || o == null || typeof o !== 'object') return UNRESOLVED;
        const k = node.name.text;
        return k in o ? o[k] : UNRESOLVED;
      }
      case ts.SyntaxKind.ElementAccessExpression: {
        const o = E(node.expression);
        const k = E(node.argumentExpression);
        if (o === UNRESOLVED || k === UNRESOLVED || o == null || typeof o !== 'object') return UNRESOLVED;
        return k in o ? o[k] : UNRESOLVED;
      }
      case ts.SyntaxKind.ArrayLiteralExpression: {
        const out = [];
        for (const [i, el] of node.elements.entries()) {
          if (ts.isSpreadElement(el)) {
            const v = E(el.expression);
            if (!Array.isArray(v)) return UNRESOLVED;
            out.push(...v);
          } else {
            const v = E(el, `${at}[${i}]`);
            if (v === UNRESOLVED) return UNRESOLVED;
            out.push(v);
          }
        }
        return out;
      }
      case ts.SyntaxKind.ObjectLiteralExpression: {
        const out = {};
        for (const p of node.properties) {
          if (ts.isSpreadAssignment(p)) {
            const v = E(p.expression);
            if (v && typeof v === 'object' && v !== UNRESOLVED) Object.assign(out, v);
            else unresolved.push(`${at}.…${p.expression.getText(this.sf)}`);
            continue;
          }
          let key;
          if (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) {
            if (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) || ts.isNumericLiteral(p.name)) key = p.name.text;
            else if (ts.isComputedPropertyName(p.name)) {
              const k = E(p.name.expression);
              if (k === UNRESOLVED) continue;
              key = String(k);
            } else continue;
          } else continue; // methods / accessors: not data
          const path = at ? `${at}.${key}` : key;
          const v = ts.isShorthandPropertyAssignment(p) ? this.get(key) : E(p.initializer, path);
          if (v === UNRESOLVED) unresolved.push(`${path} = ${ts.isShorthandPropertyAssignment(p) ? key : p.initializer.getText(this.sf).replace(/\s+/g, ' ').slice(0, 80)}`);
          else if (typeof v !== 'function') out[key] = v;
        }
        return out;
      }
      case ts.SyntaxKind.CallExpression: {
        const callee = node.expression.getText(this.sf);
        const args = node.arguments;
        if (callee === 'StyleSheet.create' || callee === 'Object.freeze') return E(args[0]);
        // `require('../../assets/x.png')` → { asset: 'assets/x.png' } (repo-relative).
        if (callee === 'require' && args[0] && ts.isStringLiteral(args[0])) {
          const abs = path.resolve(path.dirname(this.file), args[0].text);
          return { asset: path.relative(this.ev.root, abs) };
        }
        if (callee === 'Platform.select') {
          const o = E(args[0]);
          if (o === UNRESOLVED) return UNRESOLVED;
          return 'ios' in o ? o.ios : 'native' in o ? o.native : o.default;
        }
        if (callee === 'PixelRatio.roundToNearestPixel') {
          const v = E(args[0]);
          return v === UNRESOLVED ? UNRESOLVED : Math.round(v * EVAL_DEVICE.scale) / EVAL_DEVICE.scale;
        }
        if (callee === 'PixelRatio.get') return EVAL_DEVICE.scale;
        const m = /^Math\.(\w+)$/.exec(callee);
        if (m && typeof Math[m[1]] === 'function') {
          const vs = args.map((a) => E(a));
          if (vs.some((v) => v === UNRESOLVED || typeof v !== 'number')) return UNRESOLVED;
          return Math[m[1]](...vs);
        }
        return UNRESOLVED;
      }
      case ts.SyntaxKind.NewExpression: {
        // `new Set([...])` → the array; anything else is runtime.
        if (node.expression.getText(this.sf) === 'Set' && node.arguments?.length === 1) {
          const v = E(node.arguments[0]);
          return Array.isArray(v) ? v : UNRESOLVED;
        }
        return UNRESOLVED;
      }
      default:
        return UNRESOLVED;
    }
  }
}

const RN_EVAL = {
  StyleSheet: { hairlineWidth: 1 / EVAL_DEVICE.scale, absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } },
  Platform: { OS: 'ios' },
};

/**
 * Extract `{ consts, styles, unresolved }` from a component file.
 * `consts` = every requested top-level const that evaluates to data.
 */
export async function extractComponent(ev, relFile, { consts = [], styleSheets = ['styles'] } = {}) {
  const file = path.join(ev.root, relFile);
  await ev.prepare(file);
  const mod = ev.module(file);
  const outConsts = {};
  const unresolved = [];
  // Every top-level SCREAMING_CASE const that is plain data, plus any named
  // explicitly. Auto ones that don't resolve are skipped quietly (most are
  // Reanimated configs or colour picks made at runtime); explicit ones that
  // don't resolve are reported.
  const auto = [...mod.decls.keys()].filter((n) => /^[A-Z][A-Z0-9_]+$/.test(n));
  for (const name of [...new Set([...auto, ...consts])]) {
    const v = mod.get(name);
    const isData = v !== UNRESOLVED && typeof v !== 'function' && !(v && typeof v === 'object' && Object.values(v).some((x) => typeof x === 'function'));
    if (isData) outConsts[name] = v;
    else if (consts.includes(name)) unresolved.push(`const ${name}`);
  }
  const outStyles = {};
  for (const name of styleSheets) {
    const s = mod.styleSheet(name);
    if (!s) {
      unresolved.push(`${name} (no such StyleSheet)`);
      continue;
    }
    outStyles[name] = s.value;
    unresolved.push(...s.unresolved);
  }
  return { file: relFile, consts: outConsts, styles: outStyles, unresolved };
}
