// lib/escpos.test.ts
//
// Standalone test script for the ESC/POS parser (no test framework in this
// repo — see package.json). Run with: npm run test:escpos (uses `tsx`,
// already a devDependency for the blog-image migration scripts).
//
// Fixtures are ported from the Swift reference parser's synthetic fixtures
// at Papex_AppClip/Tests/FixturesSupport/SyntheticFixtures.swift and
// Papex_AppClip/Tests/ESCPOSParserTests/ESCPOSParserTests.swift, so both
// clients are validated against the same byte sequences even though there's
// no CI cross-diff (the shared-fixtures CI job was collapsed out of pilot
// scope per docs/rdh_orchestrator.md "Shared cross-stream" table).

import assert from "node:assert/strict";
import { parseEscPos, guessMerchantName, defaultStyle, type Style } from "./escpos";

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

function style(overrides: Partial<Style>): Style {
  return { ...defaultStyle(), ...overrides };
}

// ---- 1. Minimal cafe receipt ----------------------------------------------

test("minimal cafe receipt: header + items + bold total", () => {
  const b: number[] = [];
  b.push(0x1b, 0x40); // ESC @ init
  b.push(0x1b, 0x61, 0x01); // ESC a 1 (center)
  b.push(0x1b, 0x21, 0x30); // ESC ! (double H + W)
  b.push(..."BLUE BOTTLE".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1b, 0x21, 0x00); // reset style
  b.push(..."1234 Market St".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x0a); // blank line
  b.push(0x1b, 0x61, 0x00); // left
  b.push(..."Latte             4.50".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(..."Croissant         3.25".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x0a);
  b.push(0x1b, 0x45, 0x01); // bold on
  b.push(..."TOTAL             7.75".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1b, 0x45, 0x00); // bold off
  b.push(0x1d, 0x56, 0x00); // GS V 0 cut

  const receipt = parseEscPos(new Uint8Array(b));
  assert.equal(receipt.lines.length, 7);
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["BLUE BOTTLE", "1234 Market St", "", "Latte             4.50", "Croissant         3.25", "", "TOTAL             7.75"]
  );
  assert.equal(receipt.lines[0].align, "center");
  assert.deepEqual(receipt.lines[0].style, style({ doubleHeight: true, doubleWidth: true }));
  assert.deepEqual(receipt.lines[1].style, defaultStyle());
  assert.equal(receipt.lines[3].align, "left");
  assert.deepEqual(receipt.lines[6].style, style({ bold: true }));
});

// ---- 2. CP858 euro sign -----------------------------------------------------

test("CP858 codepage decodes euro sign (0xD5)", () => {
  const b: number[] = [];
  b.push(0x1b, 0x40);
  b.push(0x1b, 0x74, 0x13); // ESC t 19 -> CP858
  b.push(..."Total: ".split("").map((c) => c.charCodeAt(0)));
  b.push(0xd5); // euro in CP858
  b.push(..."12,50".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.equal(receipt.lines.length, 1);
  assert.equal(receipt.lines[0].text, "Total: €12,50");
});

// ---- 3. Underline + alignment toggle ---------------------------------------

test("underline and alignment toggles", () => {
  const b: number[] = [];
  b.push(0x1b, 0x40);
  b.push(0x1b, 0x2d, 0x01); // underline 1-dot on
  b.push(..."Underlined".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1b, 0x2d, 0x00); // off
  b.push(..."Plain".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1b, 0x61, 0x02); // align right
  b.push(..."Right".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["Underlined", "Plain", "Right"]
  );
  assert.deepEqual(receipt.lines[0].style, style({ underline: true, underlineThickness: 1 }));
  assert.deepEqual(receipt.lines[1].style, defaultStyle());
  assert.equal(receipt.lines[2].align, "right");
});

// ---- 4. QR code in the middle must not desync following text --------------

test("QR code (GS ( k) resync does not corrupt following text", () => {
  const b: number[] = [];
  b.push(0x1b, 0x40);
  b.push(..."Before".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  // GS ( k pL=4 pH=0 -> 4 bytes body
  b.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
  // GS ( k pL=7 pH=0 -> 7 bytes body
  b.push(0x1d, 0x28, 0x6b, 0x07, 0x00, 0x31, 0x50, 0x30, 0x68, 0x69, 0x21, 0x21);
  // GS ( k pL=3 pH=0 -> 3 bytes body
  b.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["Before", "After"]
  );
});

// ---- 5. Barcode skip (Function A + Function B) -----------------------------

test("barcodes (GS k, function A and B) are skipped cleanly", () => {
  const b: number[] = [];
  b.push(0x1b, 0x40);
  b.push(..."Item".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  // GS k m=73 (CODE128) n=5 d1..d5 (Function B, explicit length)
  b.push(0x1d, 0x6b, 0x49, 0x05, 0x7b, 0x42, 0x31, 0x32, 0x33);
  // GS k m=0 (UPC-A), null-terminated (Function A)
  b.push(0x1d, 0x6b, 0x00);
  b.push(..."123456789012".split("").map((c) => c.charCodeAt(0)));
  b.push(0x00);
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["Item", "After"]
  );
});

// ---- 6. Combined ESC ! mode (bold + underline + double-height together) ---

test("combined ESC ! mode sets multiple style flags at once", () => {
  const b: number[] = [];
  b.push(0x1b, 0x40);
  b.push(0x1b, 0x21, 0x98); // bold(0x08) | doubleH(0x10) | underline(0x80)
  b.push(..."BIG".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1b, 0x21, 0x00); // reset
  b.push(..."small".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["BIG", "small"]
  );
  assert.deepEqual(
    receipt.lines[0].style,
    style({ bold: true, underline: true, doubleHeight: true, underlineThickness: 1 })
  );
  assert.deepEqual(receipt.lines[1].style, defaultStyle());
});

// ---- 7. Empty stream --------------------------------------------------------

test("empty input produces an empty receipt", () => {
  const receipt = parseEscPos(new Uint8Array());
  assert.deepEqual(receipt.lines, []);
});

// ---- 8. ESC d feed-n-lines --------------------------------------------------

test("ESC d n emits n blank lines", () => {
  const b: number[] = [];
  b.push(0x1b, 0x40);
  b.push(..."Top".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1b, 0x64, 0x03); // feed 3 lines
  b.push(..."Bottom".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["Top", "", "", "", "Bottom"]
  );
});

// ---- Edge cases --------------------------------------------------------------

test("unknown ESC command does not crash and resyncs after 2-byte skip", () => {
  const data = new Uint8Array([0x1b, 0xff, 0x41, 0x42, 0x0a]);
  const receipt = parseEscPos(data);
  assert.equal(receipt.lines[0]?.text, "AB");
});

test("truncated input (ESC E with no parameter) does not crash or hang", () => {
  const data = new Uint8Array([0x1b, 0x45]);
  const receipt = parseEscPos(data);
  assert.equal(receipt.lines.length, 0);
});

test("plain ASCII passthrough", () => {
  const data = new TextEncoder().encode("Hello\nWorld\n");
  const receipt = parseEscPos(data);
  assert.equal(receipt.lines.length, 2);
  assert.equal(receipt.lines[0].text, "Hello");
  assert.equal(receipt.lines[1].text, "World");
});

test("CP437 box-drawing decodes without an explicit ESC t", () => {
  const data = new Uint8Array([0xcd, 0xcd, 0xcd, 0x0a]);
  const receipt = parseEscPos(data);
  assert.equal(receipt.lines[0].text, "═══");
});

test("GS V cut does not swallow bytes that follow it", () => {
  const b: number[] = [0x1b, 0x40];
  b.push(..."Before".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a, 0x1d, 0x56, 0x01);
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["Before", "After"]
  );
});

test("ASCII-form alignment param ('1' instead of 0x01) is normalized", () => {
  const data = new Uint8Array([0x1b, 0x61, 0x31, ..."Center".split("").map((c) => c.charCodeAt(0)), 0x0a]);
  const receipt = parseEscPos(data);
  assert.equal(receipt.lines[0]?.align, "center");
});

test("large well-formed stream never throws (fuzz-lite smoke test)", () => {
  // Not a real fixture — just enough command variety + garbage bytes to
  // exercise every dispatch branch without a real capture available yet.
  const b: number[] = [0x1b, 0x40];
  for (let i = 0; i < 50; i++) {
    b.push(0x1b, 0x21, i % 256);
    b.push(..."x".repeat(5).split("").map((c) => c.charCodeAt(0)));
    b.push(0x0a);
    b.push(0x1d, 0x28, 0x6b, 0x02, 0x00, 0x31, 0x41);
  }
  b.push(0x1d, 0x56, 0x00);
  assert.doesNotThrow(() => parseEscPos(new Uint8Array(b)));
});

// ---- guessMerchantName heuristic --------------------------------------------

test("guessMerchantName picks the first short centered line, skipping rules", () => {
  const receipt = parseEscPos(
    new Uint8Array([
      0x1b, 0x40,
      0x1b, 0x61, 0x01, // center
      ..."BLUEBIRD COFFEE".split("").map((c) => c.charCodeAt(0)),
      0x0a,
      ..."------------".split("").map((c) => c.charCodeAt(0)),
      0x0a,
      0x1b, 0x61, 0x00, // left
      ..."1 Latte   4.50".split("").map((c) => c.charCodeAt(0)),
      0x0a,
    ])
  );
  assert.equal(guessMerchantName(receipt.lines), "BLUEBIRD COFFEE");
});

test("guessMerchantName returns undefined when nothing qualifies", () => {
  const receipt = parseEscPos(new TextEncoder().encode("just some left aligned text\n"));
  assert.equal(guessMerchantName(receipt.lines), undefined);
});

// ---- Summary -----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
