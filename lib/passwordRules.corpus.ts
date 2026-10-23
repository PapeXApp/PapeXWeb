// lib/passwordRules.corpus.ts
//
// TEST SUPPORT. The passwords that lib/passwordRules.test.ts and
// scripts/gen-password-rules-fixture.ts run through the rules. It mirrors the
// corpus of PapeXV2's services/__tests__/passwordRulesParity.test.mjs (every
// printable ASCII character, look-alike and surrogate-pair characters, lengths
// around both minimums, and a seeded fuzz), so a failure here means the same
// thing it means there.
//
// Every non-ASCII character is built from a numeric code point ON PURPOSE: a
// literal zero-width space or combining accent in this file would be invisible
// in review, and editor tooling can silently rewrite \u escapes into literals.

const cp = (...points: number[]): string => String.fromCodePoint(...points);

/** A small deterministic PRNG (mulberry32), so failures reproduce. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PRINTABLE_ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

/** Characters that look like letters, digits or symbols but are not ASCII (plus
 * a tab, a no-break space, a zero-width space and a combining accent), as code
 * points: e acute, E acute, sharp s, o slash, fullwidth A, a, 1, !, #, pound,
 * euro, yen, section, plus-minus, times, divide, en dash, em dash, curly
 * quotes, ellipsis, nbsp, zero-width space, combining acute, tab, receipt
 * emoji, grinning emoji, CJK, omega, dotless i, dotted I. */
const LOOKALIKE_CODE_POINTS = [
  0xe9, 0xc9, 0xdf, 0xf8, 0xff21, 0xff41, 0xff11, 0xff01, 0xff03, 0xa3, 0x20ac, 0xa5, 0xa7,
  0xb1, 0xd7, 0xf7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0xa0, 0x200b,
  0x301, 0x9, 0x1f9fe, 0x1f600, 0x4e2d, 0x3a9, 0x131, 0x130,
];

const RECEIPT = cp(0x1f9fe);

export const ALPHABET: string[] = [...PRINTABLE_ASCII, ...LOOKALIKE_CODE_POINTS.map((p) => cp(p))];

/** Seeded random strings of 1-16 characters from ALPHABET. The same seed and
 * stream as PapeXV2's parity test, so `fuzz(4000)` is the same 4,000 passwords. */
export function fuzz(count: number): string[] {
  const next = rng(20261023);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const length = 1 + Math.floor(next() * 16);
    let s = "";
    for (let j = 0; j < length; j += 1) s += ALPHABET[Math.floor(next() * ALPHABET.length)];
    out.push(s);
  }
  return out;
}

/** How many of fuzz() go into the committed fixture. */
export const FIXTURE_FUZZ_COUNT = 300;

/** The fixed set committed in lib/passwordRules.fixture.json. */
export function fixedCorpus(): string[] {
  const list: string[] = [
    "", "Receipts+2026", "Receipts+2026!", "Receipts=2026", "Receipts 2026", "Receipts#2026",
    "Rc#1", "receipts#2026", "RECEIPTS#2026", "Receipts#abc", "Receipts2026",
    `Ab#1${RECEIPT}defg`, `Ab#1${RECEIPT}defgh`, `Caf${cp(0xe9)}#2026A`,
    `${cp(0xff21, 0xff22, 0xff23, 0xff11, 0xff12, 0xff13, 0xff01)}abc`,
    "Passw0rd!x", "Password1!", "Password1", "PASSWORD1", "Pass word 1A", "Receipts+=2026",
    "Receipts+ 2026", `Receipts${cp(0xa0)}2026`, `Receipts${cp(0x2013)}2026`,
  ];
  // Every printable ASCII character and every look-alike, alone and inside a
  // password that is one symbol short of passing.
  for (const c of ALPHABET) list.push(c, `Receipts${c}2026`, c.repeat(10));
  // Lengths around both minimums (8 on the server, 10 here), with and without
  // a surrogate pair.
  for (let n = 6; n <= 12; n += 1) {
    list.push(`Aa1!${"x".repeat(n - 4)}`, `Aa1!${RECEIPT.repeat(n - 4)}`);
  }
  // Entries of the app's common-password list, in the shapes that matter.
  for (const word of ["password", "Password1", "qwerty", "letmein", "passw0rd", "zaq1zaq1", "123qwe", "iloveyou"]) {
    list.push(word, word.toUpperCase(), word[0].toUpperCase() + word.slice(1));
  }
  list.push(...fuzz(FIXTURE_FUZZ_COUNT));
  return list;
}
