// app/r/signUpSheet.test.tsx
//
// The /r "Save to PapeX" sheet's new-password behaviour. Standalone tsx script:
//   npm run test:signUpSheet
//
// What this proves:
//   - sign-up mode states the real password rules up front (the five
//     requirements) and ticks them from lib/passwordRules.ts; sign-in mode
//     shows none (existing accounts keep older passwords);
//   - "Receipts+2026" shows "+ doesn't count" with Special character unmet,
//     and "Receipts+2026!" ticks everything and drops the hint;
//   - the Firebase error codes for a refused password map to the real rules
//     (it used to say "at least 6 characters"), every other branch is
//     unchanged;
//   - the submit handler checks a NEW password with validateStrongPassword
//     before it calls createUserWithEmailAndPassword, and never before
//     signInWithEmailAndPassword. The handler needs a browser to run, so this
//     one is a source check; the rules it calls are covered by
//     lib/passwordRules.test.ts.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import PasswordRequirements from "./PasswordRequirements";
import { SignInSheet } from "./SaveToPapex";
import { signInSheetError } from "./signInSheetError";
import { PASSWORD_POLICY_ERROR_MESSAGE } from "@/lib/passwordRules";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const noop = () => {};
const sheet = (initialMode: "signin" | "signup") =>
  renderToStaticMarkup(<SignInSheet onAuthed={noop} onClose={noop} initialMode={initialMode} />);

/** The rendered list items as [label, met]. */
function items(html: string): [string, boolean][] {
  return [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((m) => {
    const text = m[1].replace(/<span class="sr-only">(.*?)<\/span>/, "$1").replace(/<[^>]+>/g, "");
    return [text.replace(/^[✓○]\s*/, "").replace(/ \((met|not met yet)\)$/, ""), text.includes("(met)")];
  });
}

const LABELS = ["10 characters", "Uppercase letter", "Lowercase letter", "Number", "Special character"];

test("sign-up mode lists the five real requirements, none met, before anything is typed", () => {
  const html = sheet("signup");
  assert.match(html, /aria-label="Password requirements"/);
  assert.deepEqual(items(html), LABELS.map((l) => [l, false]));
  assert.match(html, /autoComplete="new-password"/);
  assert.match(html, /aria-describedby="papex-password-rules"/);
  assert.match(html, /id="papex-password-rules"/);
  assert.match(html, />Sign up</);
});

test("sign-in mode shows no password rules at all", () => {
  const html = sheet("signin");
  assert.ok(!html.includes("Password requirements"));
  assert.ok(!html.includes("papex-password-rules"));
  for (const label of LABELS) assert.ok(!html.includes(label), label);
  assert.match(html, /autoComplete="current-password"/);
  assert.match(html, />Sign in</);
});

test("Receipts+2026: four ticks, Special character unmet, and the hint names the plus sign", () => {
  const html = renderToStaticMarkup(<PasswordRequirements password="Receipts+2026" />);
  assert.deepEqual(items(html), [
    ["10 characters", true],
    ["Uppercase letter", true],
    ["Lowercase letter", true],
    ["Number", true],
    ["Special character", false],
  ]);
  assert.ok(html.includes("+ doesn’t count as a special character here. Use one like ! @ # $ or %."), html);
});

test("Receipts+2026!: all five met and no hint", () => {
  const html = renderToStaticMarkup(<PasswordRequirements password="Receipts+2026!" />);
  assert.deepEqual(items(html), LABELS.map((l) => [l, true]));
  assert.ok(!html.includes("doesn’t count"), html);
  assert.ok(!html.includes("don’t count"), html);
});

test("spaces and a second non-counting symbol are named", () => {
  const html = renderToStaticMarkup(<PasswordRequirements password="Receipts 2026 +" />);
  assert.ok(html.includes("Spaces and + don’t count as a special character here."), html);
  assert.equal(items(html)[4][1], false);
});

test("nine characters leave the length requirement unmet", () => {
  const html = renderToStaticMarkup(<PasswordRequirements password="Receipt-9" />);
  assert.deepEqual(items(html)[0], ["10 characters", false]);
  assert.equal(items(html)[4][1], true);
});

test("a refused password maps to the real rules, never 'at least 6 characters'", () => {
  for (const code of ["auth/password-does-not-meet-requirements", "auth/weak-password", "password-does-not-meet-requirements"]) {
    const message = signInSheetError(code);
    assert.equal(message, PASSWORD_POLICY_ERROR_MESSAGE, code);
    assert.match(message, /at least 10 characters/);
    assert.match(message, /special character such as ! @ # \$ or %/);
    assert.ok(!/\b6 characters/.test(message), code);
  }
});

test("the other error codes keep their copy", () => {
  assert.equal(signInSheetError("auth/wrong-password"), "Incorrect email or password.");
  assert.equal(signInSheetError("auth/invalid-credential"), "Incorrect email or password.");
  assert.equal(signInSheetError("auth/user-not-found"), "No PapeX account with that email yet — try Sign up instead.");
  assert.equal(signInSheetError("auth/email-already-in-use"), "An account already exists with that email — try Sign in instead.");
  assert.equal(signInSheetError("auth/network-request-failed"), "Couldn't sign in. Check your details and try again.");
  assert.equal(signInSheetError(""), "Couldn't sign in. Check your details and try again.");
});

test("submit checks a new password before createUserWithEmailAndPassword, and not before sign-in", () => {
  const source = readFileSync(join(__dirname, "SaveToPapex.tsx"), "utf8");
  assert.match(source, /import \{ validateStrongPassword \} from "@\/lib\/passwordRules";/);
  const guard = source.indexOf('if (mode === "signup") {');
  const check = source.indexOf("validateStrongPassword(password)");
  const busy = source.indexOf("setBusy(true);");
  const signIn = source.indexOf("await signInWithEmailAndPassword(");
  const create = source.indexOf("await createUserWithEmailAndPassword(");
  // The check is inside the sign-up-only guard, which returns before any
  // request (and before the busy state) is set; sign-in only comes after it.
  assert.ok(guard > 0 && check > guard && busy > check && signIn > busy && create > signIn, "order: guard, check, busy, requests");
  assert.match(source.slice(guard, busy), /setError\(problem\);\s*return;\s*}\s*}\s*$/);
  assert.ok(!source.includes("Password should be at least 6 characters"));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
