// lib/starRaster.test.ts
//
// Standalone test script for the Star Line Mode raster decoder (no test
// framework in this repo — see package.json). Run with:
//   npm run test:raster   (uses `tsx`, same pattern as test:escpos)
//
// Two things are load-bearing here and everything else is detail:
//
//   1. DETECTION MUST NOT FIRE ON TEXT. If `looksLikeStarRaster` ever
//      returns true for an ordinary ESC/POS receipt, parseEscPos throws away
//      that receipt's text and renders a garbage image instead. Every golden
//      text fixture this repo has is replayed below as a negative case.
//   2. `ESC * r Y n` FEEDS MUST BECOME BLANK ROWS. Dropping them renders the
//      real pilot fixture at 338px instead of 815px — a vertically crushed,
//      unreadable receipt that still "works" enough to ship by accident.
//
// Fixture geometry mirrors the two real captures taken from Blaze at the
// Doobie Nights pilot on 2026-08-18 (3ea8e69cc7764ad8.bin /
// 5b8506ff227b1681.bin, both 552x815) without committing that sibling
// repo's binaries here — this repo's convention is self-contained synthetic
// fixtures, with the real captures used for manual end-to-end verification
// (see the task report). The 5-byte ASB-disable capture
// (665477603ed0ec3c.bin) IS reproduced literally below, because it is five
// bytes and it is the one capture that must be REJECTED.

import assert from "node:assert/strict";
import zlib from "node:zlib";
import { decodeStarRaster, looksLikeStarRaster } from "./starRaster";
import { encodeEscPos, parseEscPos } from "./escpos";
import { sampleReceiptLines } from "./sampleReceipt";

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

// ---- Test-only PNG decoder (same approach as escpos.test.ts) ----------------

function decodePngDataUri(dataUri: string): { width: number; height: number; bits: Uint8Array } {
  const prefix = "data:image/png;base64,";
  assert.ok(dataUri.startsWith(prefix), "data URI has the expected PNG prefix");
  const buf = Buffer.from(dataUri.slice(prefix.length), "base64");
  let offset = 8;
  const chunks: Record<string, Buffer> = {};
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    chunks[type] = buf.subarray(offset + 8, offset + 8 + len);
    offset += 8 + len + 4;
  }
  const width = chunks.IHDR.readUInt32BE(0);
  const height = chunks.IHDR.readUInt32BE(4);
  const rowBytes = Math.ceil(width / 8);
  const inflated = zlib.inflateSync(chunks.IDAT);
  const bits = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + rowBytes);
    bits.set(inflated.subarray(rowStart + 1, rowStart + 1 + rowBytes), y * rowBytes);
  }
  return { width, height, bits };
}

// ---- Star raster payload builder --------------------------------------------

const ESC_R = [0x1b, 0x2a, 0x72];

function ascii(s: string): number[] {
  return s.split("").map((c) => c.charCodeAt(0));
}

/** ESC * r <cmd> <ascii arg> NUL — the P/E/Y argument form. */
function rasterCmdWithArg(cmd: number, arg: string): number[] {
  return [...ESC_R, cmd, ...ascii(arg), 0x00];
}

/** 'b' + LE16 length + row bytes. */
function rasterRow(row: number[]): number[] {
  return [ROW_CMD, row.length & 0xff, (row.length >> 8) & 0xff, ...row];
}

const ROW_CMD = 0x62;

/**
 * Deterministic pseudo-ink for a synthetic row. Roughly a third of the bytes
 * carry ink and the rest are blank paper, which puts the resulting payload's
 * printable-byte ratio at ~12% — close to the 10.66% measured on the two
 * real pilot captures, so the detector is being exercised against realistic
 * byte statistics rather than uniform noise (uniform noise is ~37%
 * printable, which no real receipt bitmap ever is).
 */
function fillPattern(n: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push((i * 7 + seed) % 3 === 0 ? (i * 37 + seed * 11 + 1) & 0xff : 0x00);
  }
  return out;
}

/**
 * Build a payload shaped exactly like the pilot captures: reset, enter
 * raster mode, page length + margin, then alternating blocks of rows and
 * `ESC * r Y` feeds, then exit.
 *
 * `widthBytes` 69 -> 552 dots, matching the real fixtures.
 */
function buildStarRasterJob(opts: {
  widthBytes: number;
  blocks: Array<{ rows: number; feedAfter: number }>;
}): { bytes: Uint8Array; expectedHeight: number; rowBits: Array<number[] | null> } {
  const b: number[] = [];
  const rowBits: Array<number[] | null> = [];
  b.push(...ESC_R, 0x42); // ESC * r B — reset
  b.push(...ESC_R, 0x41); // ESC * r A — enter raster mode
  b.push(...rasterCmdWithArg(0x50, "0")); // page length 0 = continuous
  b.push(...rasterCmdWithArg(0x45, "1")); // margin

  let seed = 0;
  for (const block of opts.blocks) {
    for (let r = 0; r < block.rows; r++) {
      const row = fillPattern(opts.widthBytes, seed++);
      b.push(...rasterRow(row));
      rowBits.push(row);
    }
    if (block.feedAfter > 0) {
      b.push(...rasterCmdWithArg(0x59, String(block.feedAfter)));
      for (let f = 0; f < block.feedAfter; f++) rowBits.push(null);
    }
  }

  b.push(...ESC_R, 0x42); // ESC * r B — exit
  return { bytes: new Uint8Array(b), expectedHeight: rowBits.length, rowBits };
}

// ---- 1. Pilot-shaped job decodes to the right geometry ----------------------

test("pilot-shaped Star raster job decodes to 552 dots wide, feeds included in height", () => {
  const job = buildStarRasterJob({
    widthBytes: 69, // 552 dots, the real fixture width
    blocks: [
      { rows: 120, feedAfter: 30 },
      { rows: 200, feedAfter: 45 },
      { rows: 380, feedAfter: 40 },
    ],
  });
  const img = decodeStarRaster(job.bytes);
  assert.ok(img, "decoded");
  assert.equal(img!.widthPx, 552);
  assert.equal(img!.heightPx, 815); // 120+30+200+45+380+40
  assert.equal(img!.heightPx, job.expectedHeight);
  assert.equal(img!.bits.length, 69 * 815);
});

// ---- 2. Feeds are the difference between 815px and a crushed receipt -------

test("ESC * r Y feeds are preserved as blank rows (not dropped)", () => {
  const job = buildStarRasterJob({
    widthBytes: 69,
    blocks: [
      { rows: 100, feedAfter: 200 },
      { rows: 38, feedAfter: 0 },
    ],
  });
  const img = decodeStarRaster(job.bytes)!;
  // 138 printed rows; without feed preservation the image would be 138 tall.
  assert.equal(img.heightPx, 338);
  // The 200 fed rows must be entirely blank...
  for (let y = 100; y < 300; y++) {
    for (let x = 0; x < 69; x++) {
      assert.equal(img.bits[y * 69 + x], 0, `fed row ${y} byte ${x} is blank`);
    }
  }
  // ...and the printed rows after the feed must still be intact.
  assert.deepEqual([...img.bits.subarray(300 * 69, 301 * 69)], job.rowBits[300]);
});

// ---- 3. Pixel-exactness through the whole parseEscPos -> PNG path ----------

test("parseEscPos returns a full-page rasterPage, pixel-exact, with no text lines", () => {
  const job = buildStarRasterJob({
    widthBytes: 69,
    blocks: [
      { rows: 300, feedAfter: 60 },
      { rows: 455, feedAfter: 0 },
    ],
  });
  const receipt = parseEscPos(job.bytes);
  assert.ok(receipt.rasterPage, "rasterPage decoded");
  assert.equal(receipt.rasterPage!.source, "Star Line Mode raster");
  assert.equal(receipt.rasterPage!.widthPx, 552);
  assert.equal(receipt.rasterPage!.heightPx, 815);
  assert.equal(receipt.rasterPage!.fullPage, true);
  // The text state machine must never have run on these bytes.
  assert.deepEqual(receipt.lines, []);
  assert.equal(receipt.logo, undefined);

  const png = decodePngDataUri(receipt.rasterPage!.dataUri);
  assert.equal(png.width, 552);
  assert.equal(png.height, 815);
  for (let y = 0; y < 815; y++) {
    const expected = job.rowBits[y] ?? new Array(69).fill(0);
    assert.deepEqual([...png.bits.subarray(y * 69, (y + 1) * 69)], expected, `row ${y}`);
  }
});

// ---- 4. Variable-width rows are padded to the widest -----------------------

test("narrower rows are right-padded to the widest row", () => {
  const b: number[] = [];
  b.push(...ESC_R, 0x41);
  b.push(...rasterCmdWithArg(0x50, "0"));
  b.push(...rasterRow([0xff, 0xff, 0xff, 0xff]));
  b.push(...rasterRow([0xaa, 0xbb]));
  b.push(...rasterRow([0xff, 0xff, 0xff]));
  b.push(...ESC_R, 0x42);
  const img = decodeStarRaster(new Uint8Array(b))!;
  assert.equal(img.widthPx, 32);
  assert.equal(img.heightPx, 3);
  assert.deepEqual([...img.bits.subarray(4, 8)], [0xaa, 0xbb, 0x00, 0x00]);
  assert.deepEqual([...img.bits.subarray(8, 12)], [0xff, 0xff, 0xff, 0x00]);
});

// ---- 5. The ASB-disable command must be rejected ---------------------------
//
// Real capture 665477603ed0ec3c.bin, reproduced byte for byte. This is
// `ESC RS a 0` (automatic status back off) plus a trailing NUL — a command
// Blaze emits alongside the print job. It is not a receipt and must never
// render as one.

test("the 5-byte ASB-disable capture is not detected as a raster receipt", () => {
  const asb = new Uint8Array([0x1b, 0x1e, 0x61, 0x00, 0x00]);
  assert.equal(looksLikeStarRaster(asb), false);
  const receipt = parseEscPos(asb);
  assert.equal(receipt.rasterPage, undefined);
  // And it must not fall out of the TEXT parser as a receipt either: this is
  // `ESC RS a 0`, so consuming the parameter leaves zero lines and the page
  // resolves to NOT_AVAILABLE rather than showing the letter "a" as
  // somebody's purchase. See the ESC RS case in lib/escpos.ts.
  assert.deepEqual(receipt.lines, []);
});

// ---- 6. Detection negatives: every golden TEXT fixture in this repo --------
//
// These are replays of the fixtures asserted in escpos.test.ts. If any of
// them flips to `true`, that receipt's text silently disappears in prod.

const TEXT_FIXTURES: Array<{ name: string; bytes: Uint8Array }> = [
  {
    name: "minimal cafe receipt (escpos.test.ts #1)",
    bytes: new Uint8Array([
      0x1b, 0x40,
      0x1b, 0x61, 0x01,
      0x1b, 0x21, 0x30,
      ...ascii("BLUE BOTTLE"), 0x0a,
      0x1b, 0x21, 0x00,
      ...ascii("1234 Market St"), 0x0a, 0x0a,
      0x1b, 0x61, 0x00,
      ...ascii("Latte             4.50"), 0x0a,
      ...ascii("Croissant         3.25"), 0x0a, 0x0a,
      0x1b, 0x45, 0x01,
      ...ascii("TOTAL             7.75"), 0x0a,
      0x1b, 0x45, 0x00,
      0x1d, 0x56, 0x00,
    ]),
  },
  {
    name: "CP858 euro receipt (escpos.test.ts #2)",
    bytes: new Uint8Array([
      0x1b, 0x40, 0x1b, 0x74, 0x13, ...ascii("Total: "), 0xd5, ...ascii("12,50"), 0x0a,
    ]),
  },
  {
    name: "QR code mid-receipt (escpos.test.ts #4)",
    bytes: new Uint8Array([
      0x1b, 0x40,
      ...ascii("Before"), 0x0a,
      0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
      0x1d, 0x28, 0x6b, 0x07, 0x00, 0x31, 0x50, 0x30, 0x68, 0x69, 0x21, 0x21,
      0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
      ...ascii("After"), 0x0a,
    ]),
  },
  {
    name: "barcodes, GS k function A and B (escpos.test.ts #5)",
    bytes: new Uint8Array([
      0x1b, 0x40,
      ...ascii("Item"), 0x0a,
      0x1d, 0x6b, 0x49, 0x05, 0x31, 0x32, 0x33, 0x34, 0x35,
      0x1d, 0x6b, 0x04, ...ascii("9876543"), 0x00,
      ...ascii("After barcode"), 0x0a,
    ]),
  },
  {
    name: "the /r sample receipt, round-tripped through encodeEscPos",
    bytes: encodeEscPos(sampleReceiptLines),
  },
  {
    name: "empty stream",
    bytes: new Uint8Array([]),
  },
];

// A real Epson GS v 0 logo receipt: mostly-binary, which is the hardest
// negative case for a printable-ratio heuristic. It must still parse as text.
{
  const widthBytes = 72;
  const heightRows = 120;
  const raster: number[] = [];
  for (let i = 0; i < widthBytes * heightRows; i++) raster.push((i * 37 + 11) & 0xff);
  TEXT_FIXTURES.push({
    name: "Epson GS v 0 logo + text (mostly binary, but not Star raster)",
    bytes: new Uint8Array([
      0x1b, 0x40,
      0x1d, 0x76, 0x30, 0x00, widthBytes, 0x00, heightRows, 0x00,
      ...raster,
      ...ascii("MERCHANT NAME"), 0x0a,
    ]),
  });
}

for (const fixture of TEXT_FIXTURES) {
  test(`text fixture is NOT detected as Star raster: ${fixture.name}`, () => {
    assert.equal(looksLikeStarRaster(fixture.bytes), false);
    assert.equal(parseEscPos(fixture.bytes).rasterPage, undefined);
  });
}

test("golden text fixtures still parse to their original text after the raster check", () => {
  const cafe = parseEscPos(TEXT_FIXTURES[0].bytes);
  assert.deepEqual(
    cafe.lines.map((l) => l.text),
    [
      "BLUE BOTTLE",
      "1234 Market St",
      "",
      "Latte             4.50",
      "Croissant         3.25",
      "",
      "TOTAL             7.75",
    ],
  );
  const logoReceipt = parseEscPos(TEXT_FIXTURES[TEXT_FIXTURES.length - 1].bytes);
  assert.ok(logoReceipt.logo, "Epson logo still decodes on the text path");
  assert.deepEqual(logoReceipt.lines.map((l) => l.text), ["MERCHANT NAME"]);
});

// ---- 7. A text receipt that merely mentions ESC * r ------------------------

test("a text receipt containing the ESC * r byte sequence is not misdetected", () => {
  const b: number[] = [0x1b, 0x40];
  for (let i = 0; i < 5; i++) {
    b.push(...ESC_R, 0x41); // five stray ESC * r commands...
    b.push(...ascii(`Line ${i} of a perfectly ordinary receipt with plenty of text`), 0x0a);
  }
  const bytes = new Uint8Array(b);
  // The command-count threshold is met — the printable-ratio guard is what
  // has to save this one, and it is the only thing under test here. (The
  // Epson state machine's own handling of a stray `ESC *` is pre-existing
  // behaviour and unchanged: it reads it as a column bit-image header.)
  assert.equal(looksLikeStarRaster(bytes), false);
  assert.equal(parseEscPos(bytes).rasterPage, undefined);
});

// ---- 8. Logo-sized raster is decoded but NOT full-page ---------------------
//
// The "a receipt that is only a logo is still nothing to show" rule. A Star
// raster job too short to be a receipt decodes, but does not qualify as
// receipt content — app/r/page.tsx only threads through `fullPage` bitmaps.

test("a logo-sized Star raster band decodes but is not fullPage", () => {
  const job = buildStarRasterJob({
    widthBytes: 48, // 384 dots
    blocks: [{ rows: 120, feedAfter: 20 }], // 140 rows — a big logo, not a receipt
  });
  const receipt = parseEscPos(job.bytes);
  assert.ok(receipt.rasterPage, "still decoded");
  assert.equal(receipt.rasterPage!.heightPx, 140);
  assert.equal(receipt.rasterPage!.fullPage, false);
});

test("a raster job just over the full-page floor qualifies", () => {
  const job = buildStarRasterJob({ widthBytes: 48, blocks: [{ rows: 200, feedAfter: 0 }] });
  assert.equal(parseEscPos(job.bytes).rasterPage!.fullPage, true);
});

// ---- 9. Malformed / hostile input never throws -----------------------------

test("truncated and malformed raster payloads never throw", () => {
  const job = buildStarRasterJob({ widthBytes: 69, blocks: [{ rows: 300, feedAfter: 40 }] });
  for (let cut = 0; cut < job.bytes.length; cut += 97) {
    const truncated = job.bytes.subarray(0, cut);
    assert.doesNotThrow(() => parseEscPos(truncated));
    assert.doesNotThrow(() => looksLikeStarRaster(truncated));
    assert.doesNotThrow(() => decodeStarRaster(truncated));
  }
  // A row header claiming more bytes than remain must not be emitted.
  const lying = new Uint8Array([
    ...ESC_R, 0x41,
    ...rasterCmdWithArg(0x50, "0"),
    ...ESC_R, 0x45, ...ascii("1"), 0x00,
    ROW_CMD, 0xff, 0xff, 0x01, 0x02, 0x03,
  ]);
  assert.doesNotThrow(() => decodeStarRaster(lying));
  assert.equal(decodeStarRaster(lying), null);
});

test("feeds only, with no printed rows, is not a receipt", () => {
  const b: number[] = [...ESC_R, 0x41];
  for (let i = 0; i < 6; i++) b.push(...rasterCmdWithArg(0x59, "40"));
  b.push(...ESC_R, 0x42);
  const bytes = new Uint8Array(b);
  assert.equal(decodeStarRaster(bytes), null);
  assert.equal(parseEscPos(bytes).rasterPage, undefined);
});

// ---- Summary ---------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
