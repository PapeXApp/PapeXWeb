// lib/png.test.ts
//
// Standalone test script for the minimal PNG encoder (no test framework in
// this repo — see package.json). Run with: npm run test:png (uses `tsx`).
//
// Verifies round-trip pixel fidelity using Node's built-in zlib to inflate
// the encoder's own IDAT output and compare it back against the input
// bitmap — this file (unlike lib/png.ts itself) is allowed to use Node
// APIs since it only runs as a test script, never shipped.

import assert from "node:assert/strict";
import zlib from "node:zlib";
import { encodeMonoPngDataUri } from "./png";

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

function decode(dataUri: string) {
  const prefix = "data:image/png;base64,";
  assert.ok(dataUri.startsWith(prefix));
  const buf = Buffer.from(dataUri.slice(prefix.length), "base64");
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let offset = 8;
  const chunks: Record<string, Buffer> = {};
  const order: string[] = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    chunks[type] = buf.subarray(offset + 8, offset + 8 + len);
    order.push(type);
    offset += 8 + len + 4;
  }
  const ihdr = chunks.IHDR;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];
  const inflated = zlib.inflateSync(chunks.IDAT);
  const rowBytes = Math.ceil(width / 8);
  const bits = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + rowBytes);
    assert.equal(inflated[rowStart], 0);
    bits.set(inflated.subarray(rowStart + 1, rowStart + 1 + rowBytes), y * rowBytes);
  }
  return { width, height, bitDepth, colorType, bits, chunkOrder: order, palette: chunks.PLTE, trns: chunks.tRNS };
}

test("small bitmap round-trips pixel-exact", () => {
  const bits = new Uint8Array([0b10100000, 0b01010000, 0b11110000]);
  const uri = encodeMonoPngDataUri({ width: 4, height: 3, bits }, "#F4F4F4");
  assert.ok(uri);
  const d = decode(uri!);
  assert.equal(d.width, 4);
  assert.equal(d.height, 3);
  assert.equal(d.bitDepth, 1);
  assert.equal(d.colorType, 3);
  assert.deepEqual(d.chunkOrder, ["IHDR", "PLTE", "tRNS", "IDAT", "IEND"]);
  assert.deepEqual([...d.bits], [...bits]);
  // Foreground color lands in palette index 1; index 0 is fully transparent.
  assert.deepEqual([...d.trns], [0, 255]);
  assert.deepEqual([...d.palette.subarray(3, 6)], [0xf4, 0xf4, 0xf4]);
});

test("non-multiple-of-8 width pads the row correctly", () => {
  // width=9 -> rowBytes=2. Row 0: all 9 bits set. Row 1: none set.
  const bits = new Uint8Array([0xff, 0x80, 0x00, 0x00]);
  const uri = encodeMonoPngDataUri({ width: 9, height: 2, bits }, "#FFFFFF");
  assert.ok(uri);
  const d = decode(uri!);
  assert.equal(d.width, 9);
  assert.equal(d.height, 2);
  assert.deepEqual([...d.bits], [...bits]);
});

test("large bitmap forces multiple DEFLATE stored blocks and still round-trips", () => {
  // rowBytes=250, height=500 -> raw (filter+row) bytes = 251*500 = 125,500,
  // comfortably over the 65,535-byte stored-block limit.
  const width = 2000;
  const height = 500;
  const rowBytes = Math.ceil(width / 8);
  const bits = new Uint8Array(rowBytes * height);
  for (let i = 0; i < bits.length; i++) bits[i] = (i * 131 + 7) & 0xff;
  const uri = encodeMonoPngDataUri({ width, height, bits }, "#F4F4F4");
  assert.ok(uri);
  const d = decode(uri!);
  assert.equal(d.width, width);
  assert.equal(d.height, height);
  assert.deepEqual([...d.bits], [...bits]);
});

test("dispensary_biglogo.bin-sized bitmap (576x120) round-trips", () => {
  const width = 576;
  const height = 120;
  const rowBytes = width / 8;
  const bits = new Uint8Array(rowBytes * height);
  for (let i = 0; i < bits.length; i++) bits[i] = (i * 37 + i * i) & 0xff;
  const uri = encodeMonoPngDataUri({ width, height, bits }, "#F4F4F4");
  assert.ok(uri);
  const d = decode(uri!);
  assert.deepEqual([...d.bits], [...bits]);
});

test("degenerate inputs return undefined instead of throwing", () => {
  assert.equal(encodeMonoPngDataUri({ width: 0, height: 4, bits: new Uint8Array(4) }, "#FFFFFF"), undefined);
  assert.equal(encodeMonoPngDataUri({ width: 4, height: 0, bits: new Uint8Array(4) }, "#FFFFFF"), undefined);
  assert.equal(
    encodeMonoPngDataUri({ width: 100, height: 100, bits: new Uint8Array(1) }, "#FFFFFF"),
    undefined,
    "bits shorter than rowBytes*height must not throw"
  );
});

test("invalid foreground color falls back instead of throwing", () => {
  const uri = encodeMonoPngDataUri({ width: 4, height: 1, bits: new Uint8Array([0xf0]) }, "not-a-color");
  assert.ok(uri); // still encodes — just falls back to a default color
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
