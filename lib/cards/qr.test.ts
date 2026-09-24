// lib/cards/qr.test.ts
//
// The web QR encoder (lib/cards/qr.ts). Standalone tsx script:
//   npm run test:qr
//
// KNOWN PAYLOAD -> KNOWN MODULES, from an independent encoder: the goldens in
// ./__fixtures__/qrGoldens.ts are CoreImage's CIQRCodeGenerator output
// (Apple's encoder, the one the App Clip draws with). With the mask forced to
// Apple's choice our matrix must equal Apple's bit for bit; that pins the
// version, mode, data and Reed-Solomon codewords, module placement and format
// information. Our own auto-masked output for ELLS10OFF75 is pinned too (it
// was decoded back to its payload by CoreImage's QR detector). The format
// information is also decoded here from first principles (ISO/IEC 18004
// §7.9) so a mislabelled golden cannot pass.

import assert from "node:assert/strict";
import { encodeQr, qrRuns, type QrModules } from "./qr";
import { APPLE_QR_M, OURS_ELLS10OFF75_M } from "./__fixtures__/qrGoldens";

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

const rows = (q: QrModules) => q.modules.map((r) => r.map((b) => (b ? "1" : "0")).join(""));
const matrix = (rs: string[]) => rs.map((r) => [...r].map((c) => c === "1"));

/** Read and check the format information: {ecc bits, mask}. Throws if either copy is invalid or they disagree. */
function formatInfo(m: boolean[][]): { ecc: number; mask: number } {
  const size = m.length;
  const at = (x: number, y: number) => (m[y][x] ? 1 : 0);
  let a = 0;
  let b = 0;
  for (let i = 0; i <= 5; i++) a |= at(8, i) << i;
  a |= at(8, 7) << 6;
  a |= at(8, 8) << 7;
  a |= at(7, 8) << 8;
  for (let i = 9; i < 15; i++) a |= at(14 - i, 8) << i;
  for (let i = 0; i < 8; i++) b |= at(size - 1 - i, 8) << i;
  for (let i = 8; i < 15; i++) b |= at(8, size - 15 + i) << i;
  assert.equal(a, b, "the two format-information copies agree");
  const raw = a ^ 0x5412;
  const data = raw >> 10;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  assert.equal(raw & 0x3ff, rem & 0x3ff, "BCH(15,5) check bits");
  return { ecc: data >> 3, mask: data & 7 };
}

function hasFinder(m: boolean[][], x0: number, y0: number): boolean {
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
      if (m[y0 + y][x0 + x] !== (ring !== 2)) return false;
    }
  }
  return true;
}

const ECC_M = 0; // format-information ECC bits: L=01, M=00, Q=11, H=10

for (const [payload, apple] of Object.entries(APPLE_QR_M)) {
  test(`${payload}: with Apple's mask (${apple.mask}) the matrix equals CIQRCodeGenerator's, bit for bit`, () => {
    const fi = formatInfo(matrix(apple.rows));
    assert.deepEqual(fi, { ecc: ECC_M, mask: apple.mask }, "the golden really is level M with that mask");
    assert.deepEqual(rows(encodeQr(payload, { mask: apple.mask })), apple.rows);
  });
}

test("ELLS10OFF75 (auto mask): known payload -> known modules", () => {
  const q = encodeQr("ELLS10OFF75");
  assert.equal(q.size, 21, "version 1");
  assert.deepEqual(rows(q), OURS_ELLS10OFF75_M);
  assert.deepEqual(formatInfo(q.modules), { ecc: ECC_M, mask: q.mask });
});

test("every output is well-formed: square, three finder patterns, level M, valid format information", () => {
  const payloads = ["a", "0", "EM10-000006", "https://papex.app/r?sid=7e57ca4d00000003", "Q".repeat(80), "~".repeat(80), " !\"#$%&'()*+,-./0123456789:;<=>?@AZ[\\]^_`az{|}~"];
  for (const p of payloads) {
    const q = encodeQr(p);
    assert.equal(q.modules.length, q.size);
    assert.ok((q.size - 17) % 4 === 0 && q.size >= 21 && q.size <= 37, `${p.length} chars -> size ${q.size} (at most version 5)`);
    assert.ok(hasFinder(q.modules, 0, 0) && hasFinder(q.modules, q.size - 7, 0) && hasFinder(q.modules, 0, q.size - 7), "finders");
    assert.equal(formatInfo(q.modules).ecc, ECC_M);
  }
});

test("rejects anything outside the contract (1..80 printable ASCII)", () => {
  for (const bad of ["", "Q".repeat(81), "A\nB", "tab\there", "café", "‮RTL", "\u0000"]) {
    assert.throws(() => encodeQr(bad), RangeError, JSON.stringify(bad));
  }
  assert.throws(() => encodeQr(undefined as unknown as string), RangeError);
});

test("qrRuns covers exactly the dark modules", () => {
  const q = encodeQr("TCP-7Q4X-01");
  const rebuilt = q.modules.map((r) => r.map(() => false));
  for (const [x, y, w] of qrRuns(q)) for (let i = 0; i < w; i++) rebuilt[y][x + i] = true;
  assert.deepEqual(rebuilt, q.modules);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
