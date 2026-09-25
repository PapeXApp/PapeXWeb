// vendor — copy a pure PapeXV2 helper module into the web repo verbatim.
//
// The only edits are to imports:
//   - `import type { A, B as C } from 'x'`  →  `type A = any; type C = any;`
//     (the web has no copy of the app's domain types; the logic doesn't need them)
//   - a runtime import of another VENDORED file → re-pointed at its copy
// Any other runtime import is an error: the module isn't pure, so vendoring it
// would silently drag app code (or a package) into the website.

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export function vendorModule(root, entry, byFile) {
  const file = path.join(root, entry.file);
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const edits = [];
  const resolveRel = (spec) => {
    const base = path.resolve(path.dirname(file), spec);
    for (const e of ['.ts', '.tsx', '/index.ts', '']) {
      const rel = path.relative(root, base + e);
      if (byFile.has(rel)) return byFile.get(rel);
    }
    return null;
  };
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const spec = st.moduleSpecifier.text;
    const ic = st.importClause;
    const typeAliases = [];
    const valueNames = [];
    if (ic.isTypeOnly) {
      if (ic.name) typeAliases.push(ic.name.text);
      if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) for (const el of ic.namedBindings.elements) typeAliases.push(el.name.text);
    } else {
      if (ic.name) valueNames.push(ic.name.text);
      if (ic.namedBindings && ts.isNamedImports(ic.namedBindings))
        for (const el of ic.namedBindings.elements) (el.isTypeOnly ? typeAliases : valueNames).push(el.name.text);
      if (ic.namedBindings && ts.isNamespaceImport(ic.namedBindings)) valueNames.push(ic.namedBindings.name.text);
    }
    let replacement = typeAliases.map((n) => `type ${n} = any; // vendored: was \`import type\` from '${spec}'`).join('\n');
    if (valueNames.length) {
      const target = spec.startsWith('.') ? resolveRel(spec) : null;
      if (!target) throw new Error(`vendor: ${entry.file} imports runtime value(s) ${valueNames.join(', ')} from '${spec}', which is not vendored`);
      const kept = st.getText(sf).replace(/\btype\s+\w+\s*(as\s+\w+\s*)?,?/g, '').replace(spec, `./${target.replace(/\.ts$/, '')}`);
      replacement = (replacement ? replacement + '\n' : '') + kept;
    }
    edits.push({ start: st.getStart(sf), end: st.getEnd(), text: replacement });
  }
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}
