// lib/passwordRules.test.ts
//
// Standalone test script for the new-password rules the "Save to PapeX"
// sign-up sheet applies (lib/passwordRules.ts). Run with:
//   npm run test:passwordRules
//
// What keeps the website's rules equal to the app's and to Firebase's:
//   1. lib/passwordRules.fixture.json is the PapeX APP's own output
//      (PapeXV2 services/passwordRules.ts) for 746 fixed passwords: which of
//      the five requirements are met, the first error sentence, and the
//      "+ doesn't count" hint. This module must reproduce every line.
//   2. The password policy papexv2 enforces on the server (read live
//      2026-10-23) is pinned below, and the REAL Firebase SDK check
//      (firebase/auth validatePassword, fed that policy) must agree with the
//      uppercase / lowercase / number / special-character ticks for every
//      password, and must accept every password this module accepts.
//   3. With PAPEXV2_PASSWORD_RULES=<path to PapeXV2/services/passwordRules.ts>
//      the app's CURRENT file is run over the same passwords plus the app's
//      own 4,000-password fuzz and compared with this module. This is the
//      check that fails when the app's rules move and the website's don't:
//        PAPEXV2_PASSWORD_RULES=../PapeXV2/services/passwordRules.ts npm run test:passwordRules
//      Without the variable it is skipped (the website's CI has no app checkout).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  COMMON_PASSWORDS,
  MIN_PASSWORD_LENGTH,
  PASSWORD_POLICY_ERROR_MESSAGE,
  PASSWORD_SYMBOLS,
  SERVER_MIN_PASSWORD_LENGTH,
  getPasswordChecks,
  isPasswordPolicyErrorCode,
  symbolHint,
  validateStrongPassword,
} from "./passwordRules";
import { fixedCorpus, fuzz } from "./passwordRules.corpus";
import fixture from "./passwordRules.fixture.json";

let passed = 0;
let failed = 0;
const pending: Promise<void>[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  const run = (async () => {
    try {
      await fn();
      passed += 1;
      console.log(`  ok - ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`  FAIL - ${name}`);
      console.error(err instanceof Error ? err.message : err);
    }
  })();
  pending.push(run);
}

/** GET identitytoolkit v2/passwordPolicy for papexv2, read live 2026-10-23
 * (enforcementState ENFORCE; admin config forceUpgradeOnSignin unset). */
const POLICY_2026_10_23 = {
  customStrengthOptions: {
    minPasswordLength: 8,
    maxPasswordLength: 4096,
    containsLowercaseCharacter: true,
    containsUppercaseCharacter: true,
    containsNumericCharacter: true,
    containsNonAlphanumericCharacter: true,
  },
  schemaVersion: 1,
  allowedNonAlphanumericCharacters: ["^", "$", "*", ".", "[", "]", "{", "}", "(", ")", "?", '"', "!", "@", "#", "%", "&", "/", "\\", ",", ">", "<", "'", ":", ";", "|", "_", "~", "`", "-"],
  enforcementState: "ENFORCE",
};

/** This module's view of a password, in the fixture's shape. */
function view(password: string) {
  return {
    bits: getPasswordChecks(password).map((c) => (c.met ? "1" : "0")).join(""),
    message: validateStrongPassword(password),
    hint: symbolHint(password),
  };
}

/** A fixture case, decoded. */
function decode(row: readonly (string | number)[]) {
  const [password, bits, messageIndex, hintIndex] = row as [string, string, number, number];
  return {
    password,
    bits,
    message: messageIndex < 0 ? null : fixture.strings[messageIndex],
    hint: hintIndex < 0 ? "" : fixture.strings[hintIndex],
  };
}

// ---- 1. the app's own output --------------------------------------------------------

test("the constants are the app's, and the app's minimum is never below the server's", () => {
  assert.equal(PASSWORD_SYMBOLS, fixture.symbols);
  assert.equal(MIN_PASSWORD_LENGTH, fixture.minLength);
  assert.deepEqual(getPasswordChecks("").map((c) => c.label), fixture.labels);
  assert.equal(MIN_PASSWORD_LENGTH, 10);
  assert.ok(MIN_PASSWORD_LENGTH >= SERVER_MIN_PASSWORD_LENGTH);
});

test("the fixture is the PapeXV2 file it says it is, and covers the whole corpus", () => {
  assert.equal(fixture.source.repo, "PapeXV2");
  assert.equal(fixture.source.file, "services/passwordRules.ts");
  assert.match(fixture.source.commit, /^[0-9a-f]{40}$/);
  assert.match(fixture.source.sha256, /^[0-9a-f]{64}$/);
  // Editing the corpus without regenerating the fixture would leave new
  // passwords unchecked; this makes that fail loudly.
  assert.deepEqual(fixture.cases.map((row) => row[0]), fixedCorpus());
  assert.ok(fixture.cases.length >= 700);
});

test("every fixture password gets the app's ticks, first error and symbol hint", () => {
  for (const row of fixture.cases) {
    const want = decode(row);
    const got = view(want.password);
    const label = JSON.stringify(want.password);
    assert.equal(got.bits, want.bits, `ticks for ${label}`);
    assert.equal(got.message, want.message, `error for ${label}`);
    assert.equal(got.hint, want.hint, `hint for ${label}`);
  }
});

test("the reported bug: Receipts+2026 is refused here and the reason names the plus sign", () => {
  assert.equal(view("Receipts+2026").bits, "11110");
  assert.match(validateStrongPassword("Receipts+2026") ?? "", /^Password must include at least one special character\. \+ doesn.t count as a special character here\. Use one like ! @ # \$ or %\.$/);
  assert.equal(validateStrongPassword("Receipts+2026!"), null);
  assert.ok(/Spaces don.t count/.test(validateStrongPassword("Receipts 2026") ?? ""));
  // Nine characters are not enough here even though Firebase would take 8.
  assert.equal(validateStrongPassword("Receipt+1"), "Password must be at least 10 characters.");
  assert.equal(validateStrongPassword("Receipts-9"), null);
});

test("each of the 30 symbols Firebase counts is accepted; +, =, space and tab are not", () => {
  assert.equal(Array.from(PASSWORD_SYMBOLS).length, 30);
  for (const c of PASSWORD_SYMBOLS) assert.equal(validateStrongPassword(`Receipts${c}2026`), null, c);
  for (const c of ["+", "=", " ", "\t"]) assert.notEqual(validateStrongPassword(`Receipts${c}2026`), null, JSON.stringify(c));
});

test("the common-password list never changes a verdict: none of its entries has a counted symbol", () => {
  assert.ok(COMMON_PASSWORDS.length >= 30);
  for (const word of COMMON_PASSWORDS) {
    assert.ok(!Array.from(word).some((c) => PASSWORD_SYMBOLS.includes(c)), word);
    assert.notEqual(validateStrongPassword(word), null, word);
  }
});

test("the server-refusal message states the real rules, not 'at least 6 characters'", () => {
  assert.equal(
    PASSWORD_POLICY_ERROR_MESSAGE,
    "That password doesn't meet the requirements. Use at least 10 characters with an uppercase letter, a lowercase letter, a number and a special character such as ! @ # $ or %.",
  );
  assert.ok(!/\b6\b/.test(PASSWORD_POLICY_ERROR_MESSAGE));
  for (const code of ["auth/password-does-not-meet-requirements", "auth/weak-password", "password-does-not-meet-requirements"]) {
    assert.equal(isPasswordPolicyErrorCode(code), true, code);
  }
  for (const code of ["", "auth/wrong-password", "auth/invalid-credential", "auth/email-already-in-use", "auth/network-request-failed"]) {
    assert.equal(isPasswordPolicyErrorCode(code), false, code);
  }
});

// ---- 2. Firebase's own check --------------------------------------------------------

test("the pinned server policy is the one the symbols and minimums come from", () => {
  assert.equal(PASSWORD_SYMBOLS, POLICY_2026_10_23.allowedNonAlphanumericCharacters.join(""));
  assert.equal(SERVER_MIN_PASSWORD_LENGTH, POLICY_2026_10_23.customStrengthOptions.minPasswordLength);
});

test("the real Firebase SDK check agrees with every tick, and accepts everything this module accepts", async () => {
  // The SDK captures global fetch when it loads, so the stub goes in first and
  // the SDK is imported after. The only request it makes is the policy GET.
  const realFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = (async (url: string | URL | Request) => {
    requests += 1;
    assert.match(String(url), /\/v2\/passwordPolicy\?/);
    return new Response(JSON.stringify(POLICY_2026_10_23), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const { initializeApp, deleteApp } = await import("firebase/app");
    const { getAuth, validatePassword } = await import("firebase/auth");
    const app = initializeApp({ apiKey: "test-key-not-real", projectId: "papexv2-policy-test" }, "password-rules-test");
    const auth = getAuth(app);
    const passwords = [...fixedCorpus(), ...fuzz(4000)];
    assert.ok(passwords.length > 4000);
    for (const password of passwords) {
      const sdk = await validatePassword(auth, password);
      const label = JSON.stringify(password);
      const [length, upper, lower, number, special] = getPasswordChecks(password).map((c) => c.met);
      assert.equal(upper, sdk.containsUppercaseLetter, `uppercase for ${label}`);
      assert.equal(lower, sdk.containsLowercaseLetter, `lowercase for ${label}`);
      assert.equal(number, sdk.containsNumericCharacter, `number for ${label}`);
      assert.equal(special, sdk.containsNonAlphanumericCharacter, `special character for ${label}`);
      if (length) assert.equal(sdk.meetsMinPasswordLength, true, `length for ${label}`);
      if (validateStrongPassword(password) === null) assert.equal(sdk.isValid, true, `module passes ${label} but Firebase refuses it`);
    }
    assert.equal(requests, 1, "the policy is fetched once");
    await deleteApp(app);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ---- 3. the app's CURRENT file (opt-in) -----------------------------------------------

const upstreamPath = process.env.PAPEXV2_PASSWORD_RULES;
if (!upstreamPath) {
  console.log("  skip - app drift check (set PAPEXV2_PASSWORD_RULES=<PapeXV2/services/passwordRules.ts> to run it)");
} else {
  test("the app's current passwordRules.ts gives the same constants, list, ticks, errors and hints", async () => {
    const app = (await import(pathToFileURL(upstreamPath).href)) as {
      PASSWORD_SYMBOLS: string;
      MIN_PASSWORD_LENGTH: number;
      getPasswordChecks(p: string): { label: string; met: boolean }[];
      validateStrongPassword(p: string): string | null;
      symbolHint(p: string): string;
    };
    assert.equal(PASSWORD_SYMBOLS, app.PASSWORD_SYMBOLS, "PASSWORD_SYMBOLS drifted from the app");
    assert.equal(MIN_PASSWORD_LENGTH, app.MIN_PASSWORD_LENGTH, "MIN_PASSWORD_LENGTH drifted from the app");
    const literal = readFileSync(upstreamPath, "utf8").match(/const COMMON_PASSWORDS = \[([\s\S]*?)\];/);
    assert.ok(literal, "COMMON_PASSWORDS literal found in the app file");
    assert.deepEqual([...literal![1].matchAll(/'([^']*)'/g)].map((m) => m[1]), [...COMMON_PASSWORDS], "COMMON_PASSWORDS drifted from the app");
    const passwords = [...fixedCorpus(), ...fuzz(4000)];
    for (const password of passwords) {
      const label = JSON.stringify(password);
      assert.deepEqual(getPasswordChecks(password), app.getPasswordChecks(password), `ticks for ${label}`);
      assert.equal(validateStrongPassword(password), app.validateStrongPassword(password), `error for ${label}`);
      assert.equal(symbolHint(password), app.symbolHint(password), `hint for ${label}`);
    }
    console.log(`    (compared against ${upstreamPath}: ${passwords.length} passwords)`);
  });
}

void Promise.all(pending).then(() => {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  process.exit(0);
});
