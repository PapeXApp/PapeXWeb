// scripts/gen-password-rules-fixture.ts
//
// Regenerates lib/passwordRules.fixture.json from the PapeX APP's own rules
// (PapeXV2 services/passwordRules.ts). Run it whenever the app's rules
// change, AFTER updating lib/passwordRules.ts to match:
//
//   git -C ../PapeXV2 show <commit>:services/passwordRules.ts > /tmp/passwordRules.ts
//   npx tsx --tsconfig tsconfig.test.json scripts/gen-password-rules-fixture.ts \
//       /tmp/passwordRules.ts --commit <full PapeXV2 commit sha>
//
// The fixture is ASCII only (every other character is a \uXXXX escape), so no
// invisible character can hide in a review.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { fixedCorpus } from "../lib/passwordRules.corpus";

interface AppRules {
  PASSWORD_SYMBOLS: string;
  MIN_PASSWORD_LENGTH: number;
  getPasswordChecks(password: string): { label: string; met: boolean }[];
  validateStrongPassword(password: string): string | null;
  symbolHint(password: string): string;
}

async function main() {
  const file = process.argv[2];
  const commitFlag = process.argv.indexOf("--commit");
  const commit = commitFlag > 0 ? process.argv[commitFlag + 1] : "";
  if (!file || !/^[0-9a-f]{40}$/.test(commit)) {
    console.error("usage: gen-password-rules-fixture.ts <path to passwordRules.ts> --commit <40-hex PapeXV2 sha>");
    process.exit(2);
  }
  const app = (await import(pathToFileURL(file).href)) as AppRules;
  const strings: string[] = [];
  const idx = (s: string | null): number => {
    if (s === null || s === "") return -1;
    const at = strings.indexOf(s);
    if (at >= 0) return at;
    strings.push(s);
    return strings.length - 1;
  };
  const cases = fixedCorpus().map((password) => [
    password,
    app.getPasswordChecks(password).map((c) => (c.met ? "1" : "0")).join(""),
    idx(app.validateStrongPassword(password)),
    idx(app.symbolHint(password)),
  ]);
  const fixture = {
    source: {
      repo: "PapeXV2",
      file: "services/passwordRules.ts",
      commit,
      sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
    },
    symbols: app.PASSWORD_SYMBOLS,
    minLength: app.MIN_PASSWORD_LENGTH,
    labels: app.getPasswordChecks("").map((c) => c.label),
    strings,
    cases,
  };
  const ascii = (s: string) => s.replace(/[^\x00-\x7f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const head = JSON.stringify({ ...fixture, strings: undefined, cases: undefined }, null, 2).replace(/\n}$/, "");
  const body =
    `${head},\n  "strings": [\n${strings.map((t) => `    ${ascii(JSON.stringify(t))}`).join(",\n")}\n  ],\n` +
    `  "cases": [\n${cases.map((c) => `    ${ascii(JSON.stringify(c))}`).join(",\n")}\n  ]\n}\n`;
  const out = new URL("../lib/passwordRules.fixture.json", import.meta.url);
  writeFileSync(out, ascii(body));
  console.log(`wrote ${cases.length} cases, ${strings.length} strings -> lib/passwordRules.fixture.json`);
}

void main();
