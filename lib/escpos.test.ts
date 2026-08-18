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
import zlib from "node:zlib";
import { parseEscPos, guessMerchantName, defaultStyle, type Style } from "./escpos";

// ---- Test-only PNG decoder ---------------------------------------------------
//
// Uses Node's built-in zlib/Buffer (fine here — this is a test script run
// under Node via tsx, not lib/png.ts itself, which stays Node-API-free) to
// walk chunks and inflate IDAT, so tests can assert the encoded logo is
// pixel-exact against the source bitmap rather than just "some string came
// back". Deliberately independent of lib/png.ts's own encoding logic (it
// re-derives width/height/rowBytes from the PNG's own IHDR chunk, not from
// what the test expects to send in) so a bug shared by both wouldn't just
// cancel out.
function decodePngDataUri(dataUri: string): { width: number; height: number; bits: Uint8Array } {
  const prefix = "data:image/png;base64,";
  assert.ok(dataUri.startsWith(prefix), "data URI has the expected PNG prefix");
  const buf = Buffer.from(dataUri.slice(prefix.length), "base64");
  assert.deepEqual(
    [...buf.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    "PNG signature"
  );
  let offset = 8;
  const chunks: Record<string, Buffer> = {};
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    chunks[type] = buf.subarray(offset + 8, offset + 8 + len);
    offset += 8 + len + 4;
  }
  const ihdr = chunks.IHDR;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  assert.equal(ihdr[8], 1, "bit depth 1");
  assert.equal(ihdr[9], 3, "color type 3 (indexed)");
  const rowBytes = Math.ceil(width / 8);
  const inflated = zlib.inflateSync(chunks.IDAT);
  const bits = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + rowBytes);
    assert.equal(inflated[rowStart], 0, `row ${y} filter byte is None`);
    bits.set(inflated.subarray(rowStart + 1, rowStart + 1 + rowBytes), y * rowBytes);
  }
  return { width, height, bits };
}

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

test("raster image (GS v 0) followed by text survives — logo does not swallow the receipt", () => {
  // Regression test for the P0 off-by-one: the GS v 0 handler used to read
  // xL at the offset that actually holds `m`, inflating dataLen and
  // swallowing the rest of the receipt (e.g. a receipt-top logo computing a
  // ~2MB length). Header is 8 bytes: 0x1D 0x76 0x30 m xL xH yL yH.
  // m=0, xL=2, xH=0, yL=16, yH=0 -> dataLen = (2+0*256)*(16+0*256) = 32.
  const b: number[] = [];
  b.push(0x1b, 0x40); // ESC @ init
  b.push(0x1d, 0x76, 0x30, 0x00, 0x02, 0x00, 0x10, 0x00); // GS v 0 header
  for (let i = 0; i < 32; i++) b.push(0xaa); // 32 dummy raster data bytes
  b.push(..."PAPEX TEST CAFE\n2x Latte 9.00\nTOTAL 13.50\n".split("").map((c) => c.charCodeAt(0)));
  b.push(0x1d, 0x56, 0x00); // GS V 0 cut

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["PAPEX TEST CAFE", "2x Latte 9.00", "TOTAL 13.50"]
  );
  // The raster is fully present (32 declared === 32 available), so it now
  // also decodes into a logo — width is in BYTES per the header (xL=2 ->
  // 16px), height in ROWS (yL=16).
  assert.ok(receipt.logo);
  assert.equal(receipt.logo?.widthPx, 16);
  assert.equal(receipt.logo?.heightPx, 16);
  assert.equal(receipt.logo?.source, "GS v 0");
  assert.ok(receipt.logo?.dataUri.startsWith("data:image/png;base64,"));
  assert.equal(receipt.nvLogoReferenced, false);
});

test("truncated GS v 0 raster (fewer data bytes than declared) does not throw and does not render a logo", () => {
  const b: number[] = [0x1b, 0x40];
  // Declares dataLen = 2*16 = 32 bytes of raster data but only supplies 5.
  b.push(0x1d, 0x76, 0x30, 0x00, 0x02, 0x00, 0x10, 0x00);
  b.push(0x01, 0x02, 0x03, 0x04, 0x05);
  assert.doesNotThrow(() => parseEscPos(new Uint8Array(b)));
  const receipt = parseEscPos(new Uint8Array(b));
  // All bytes consumed as raster payload (clamped to remaining input) —
  // nothing left to decode as text, and a partial/corrupt bitmap must not
  // be rendered as if it were a complete logo.
  assert.deepEqual(receipt.lines, []);
  assert.equal(receipt.logo, undefined);
});

test("stream ending mid-GS-v-0-header consumes to EOF (no garbage text)", () => {
  // Fewer than 8 header bytes remain after GS v 0. The old handler skipped
  // only 2 bytes and re-parsed the partial header bytes as text; the Swift
  // reference (ESCPOSParser.swift) consumes to EOF because there is no
  // reliable byte to resync on. Header bytes chosen printable-ASCII so a
  // regression shows up as visible garbage text.
  const b: number[] = [0x1b, 0x40];
  b.push(..."Item".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1d, 0x76, 0x30, 0x00, 0x41, 0x42); // GS v 0, m, then EOF mid-header
  assert.doesNotThrow(() => parseEscPos(new Uint8Array(b)));
  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(
    receipt.lines.map((l) => l.text),
    ["Item"]
  );
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

// ---- Logo / raster image decoding -------------------------------------------
//
// Geometry below mirrors the two real bench-captured fixtures at
// Papex_RDH_Firmware/bench/corpus/ — dispensary_logo.bin (48 bytes/row x 40
// rows) and dispensary_biglogo.bin (72 bytes/row x 120 rows) — without
// depending on that sibling repo's binary files from a committed test (this
// repo's existing convention is self-contained synthetic fixtures; the
// actual corpus files were used for manual end-to-end verification instead
// — see the task report). Pixel data here is a deterministic fill, not the
// real logos, but the header geometry and decode/roundtrip path are the
// same code the real captures exercise.

function fillPattern(n: number): Uint8Array {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (i * 37 + 11) & 0xff;
  return out;
}

test("GS v 0 raster matches dispensary_logo.bin geometry (48 bytes/row x 40 rows) and decodes pixel-exact", () => {
  const widthBytes = 48;
  const heightRows = 40;
  const raster = fillPattern(widthBytes * heightRows);
  const b: number[] = [0x1b, 0x40];
  b.push(0x1d, 0x76, 0x30, 0x00, widthBytes & 0xff, (widthBytes >> 8) & 0xff, heightRows & 0xff, (heightRows >> 8) & 0xff);
  b.push(...raster);
  b.push(..."MERCHANT NAME\n".split("").map((c) => c.charCodeAt(0)));

  const receipt = parseEscPos(new Uint8Array(b));
  assert.ok(receipt.logo, "logo decoded");
  assert.equal(receipt.logo?.source, "GS v 0");
  assert.equal(receipt.logo?.widthPx, widthBytes * 8);
  assert.equal(receipt.logo?.heightPx, heightRows);
  assert.deepEqual(receipt.lines.map((l) => l.text), ["MERCHANT NAME"]);

  const decoded = decodePngDataUri(receipt.logo!.dataUri);
  assert.equal(decoded.width, widthBytes * 8);
  assert.equal(decoded.height, heightRows);
  assert.deepEqual([...decoded.bits], [...raster]);
});

test("GS v 0 raster matches dispensary_biglogo.bin geometry (72 bytes/row x 120 rows) and decodes pixel-exact", () => {
  const widthBytes = 72;
  const heightRows = 120;
  const raster = fillPattern(widthBytes * heightRows);
  const b: number[] = [0x1b, 0x40];
  b.push(0x1d, 0x76, 0x30, 0x00, widthBytes & 0xff, (widthBytes >> 8) & 0xff, heightRows & 0xff, (heightRows >> 8) & 0xff);
  b.push(...raster);
  b.push(..."MERCHANT NAME\n".split("").map((c) => c.charCodeAt(0)));

  const receipt = parseEscPos(new Uint8Array(b));
  assert.ok(receipt.logo, "logo decoded");
  assert.equal(receipt.logo?.widthPx, widthBytes * 8);
  assert.equal(receipt.logo?.heightPx, heightRows);
  assert.deepEqual(receipt.lines.map((l) => l.text), ["MERCHANT NAME"]);

  const decoded = decodePngDataUri(receipt.logo!.dataUri);
  assert.equal(decoded.width, widthBytes * 8);
  assert.equal(decoded.height, heightRows);
  assert.deepEqual([...decoded.bits], [...raster]);
});

test("ESC * (8-dot column format) decodes a single band pixel-exact and transposes columns to rows", () => {
  // m=0 (8-dot single density), width=1 column, data=0xAA
  // (0b10101010 -> rows 0,2,4,6 set, MSB-first top-to-bottom).
  const b: number[] = [0x1b, 0x40];
  b.push(..."Before".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1b, 0x2a, 0x00, 0x01, 0x00, 0xaa);
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(receipt.lines.map((l) => l.text), ["Before", "After"]);
  assert.ok(receipt.logo);
  assert.equal(receipt.logo?.source, "ESC *");
  assert.equal(receipt.logo?.widthPx, 1);
  assert.equal(receipt.logo?.heightPx, 8);

  const decoded = decodePngDataUri(receipt.logo!.dataUri);
  assert.equal(decoded.width, 1);
  assert.equal(decoded.height, 8);
  // One row-byte per row (width=1 -> rowBytes=1); bit is in the MSB (col 0).
  assert.deepEqual([...decoded.bits], [0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00]);
});

test("GS ( L <Function 112> (store raster in print buffer) decodes pixel-exact, including a non-multiple-of-8 width", () => {
  // width=9px (rowBytes=2 -> padding bits in the 2nd byte of every row),
  // height=2px. Row 0 = all 9 pixels set, row 1 = none set.
  const widthPx = 9;
  const heightPx = 2;
  const bitmap = [0xff, 0x80, 0x00, 0x00];
  const subheader = [0x30, 0x01, 0x01, 0x31, widthPx & 0xff, (widthPx >> 8) & 0xff, heightPx & 0xff, (heightPx >> 8) & 0xff];
  const body = [0x30, 0x70, ...subheader, ...bitmap]; // m='0', fn='p', then payload
  const pL = body.length & 0xff;
  const pH = (body.length >> 8) & 0xff;

  const b: number[] = [0x1b, 0x40];
  b.push(..."Before".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1d, 0x28, 0x4c, pL, pH, ...body);
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(receipt.lines.map((l) => l.text), ["Before", "After"]);
  assert.ok(receipt.logo);
  assert.equal(receipt.logo?.source, "GS ( L");
  assert.equal(receipt.logo?.widthPx, widthPx);
  assert.equal(receipt.logo?.heightPx, heightPx);
  assert.equal(receipt.nvLogoReferenced, false);

  const decoded = decodePngDataUri(receipt.logo!.dataUri);
  assert.equal(decoded.width, widthPx);
  assert.equal(decoded.height, heightPx);
  assert.deepEqual([...decoded.bits], bitmap);
});

test("GS ( L <Function 69> (print NV graphics) is detected as an NV reference, not rendered", () => {
  const body = [0x30, 0x45, 0x01, 0x02]; // m='0', fn='E' (69), 2 arbitrary key-code/param bytes
  const pL = body.length & 0xff;
  const pH = (body.length >> 8) & 0xff;
  const b: number[] = [0x1b, 0x40];
  b.push(..."Before".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1d, 0x28, 0x4c, pL, pH, ...body);
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(receipt.lines.map((l) => l.text), ["Before", "After"]);
  assert.equal(receipt.logo, undefined);
  assert.equal(receipt.nvLogoReferenced, true);
});

test("FS p (print NV bit image) is detected as an NV reference, not rendered", () => {
  const b: number[] = [0x1b, 0x40];
  b.push(..."Before".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1c, 0x70, 0x01, 0x00); // FS p n m
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(receipt.lines.map((l) => l.text), ["Before", "After"]);
  assert.equal(receipt.logo, undefined);
  assert.equal(receipt.nvLogoReferenced, true);
});

test("GS 8 L (4-byte-length graphics) is safely skipped (resync only, not decoded) without corrupting following text", () => {
  const payload = [0x30, 0x70, 0x11, 0x22, 0x33]; // arbitrary — not decoded regardless of contents
  const b: number[] = [0x1b, 0x40];
  b.push(..."Before".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);
  b.push(0x1d, 0x38, 0x4c, payload.length & 0xff, 0x00, 0x00, 0x00, ...payload);
  b.push(..."After".split("").map((c) => c.charCodeAt(0)));
  b.push(0x0a);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.deepEqual(receipt.lines.map((l) => l.text), ["Before", "After"]);
  assert.equal(receipt.logo, undefined);
  assert.equal(receipt.nvLogoReferenced, false);
});

test("image-only stream (no text at all) still produces zero lines — logo lives outside .lines", () => {
  // Guards the honest-failure-state contract (lib/receiptState.ts): a
  // receipt that is only a logo, with no readable text, must still resolve
  // to "no visible content" upstream. This parser-level test only asserts
  // its half of that contract — .lines stays empty even though .logo is
  // populated — since hasVisibleContent()/resolveReceiptState() only ever
  // look at .lines/.bodyLines, never at .logo.
  const widthBytes = 4;
  const heightRows = 4;
  const raster = fillPattern(widthBytes * heightRows);
  const b: number[] = [0x1b, 0x40];
  b.push(0x1d, 0x76, 0x30, 0x00, widthBytes, 0x00, heightRows, 0x00);
  b.push(...raster);

  const receipt = parseEscPos(new Uint8Array(b));
  assert.ok(receipt.logo);
  assert.deepEqual(receipt.lines, []);
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
