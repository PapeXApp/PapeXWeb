// lib/png.ts
//
// Minimal from-scratch PNG encoder for 1-bit monochrome bitmaps, used by
// lib/escpos.ts to render decoded ESC/POS raster logos as inline
// `data:image/png;base64,...` URIs — no external image library, and no
// Node-only APIs (Buffer, zlib), so this stays usable from either a
// Next.js server component or a browser bundle unmodified, same
// portability contract lib/escpos.ts documents for itself.
//
// Scope: encodes a 1-bit-per-pixel, row-major, MSB-first packed bitmap
// (exactly the wire format ESC/POS raster commands already use) as a PNG
// with a 2-entry indexed palette: index 0 fully transparent, index 1
// opaque in a caller-supplied foreground color. That covers this file's
// one job — no grayscale, no RGB, no interlacing, no real DEFLATE
// compression. IDAT uses DEFLATE "stored" (uncompressed) blocks only;
// receipt logos are small (a few KB of packed bits at most) so the size
// cost of skipping real compression is negligible, and a stored-block
// encoder is a fraction of the code (and risk) of a real Huffman/LZ77
// implementation.

// ---------------------------------------------------------------------------
// CRC-32 (PNG chunk checksums) — standard IEEE 802.3 polynomial, table-driven.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// Adler-32 (zlib stream checksum, RFC 1950).
// ---------------------------------------------------------------------------

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

// ---------------------------------------------------------------------------
// Byte-buffer helpers
// ---------------------------------------------------------------------------

function u32be(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function concatBytes(chunks: Array<number[] | Uint8Array>): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** One PNG chunk: 4-byte length + 4-byte type + data + 4-byte CRC (over type+data). */
function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = Uint8Array.from(type.split("").map((c) => c.charCodeAt(0)));
  const body = concatBytes([typeBytes, data]);
  const crc = crc32(body);
  return concatBytes([u32be(data.length), body, u32be(crc)]);
}

/**
 * Wrap raw bytes as a zlib stream (RFC 1950) using only DEFLATE "stored"
 * (uncompressed, BTYPE=00) blocks (RFC 1951 §3.2.4). Each stored block's
 * 3-bit header (BFINAL + BTYPE, padded to a byte) collapses to exactly one
 * whole byte here because every block we emit starts at a byte boundary:
 * the very first one right after the 2-byte zlib header, and every later
 * one because a stored block's LEN/NLEN/data are themselves a whole number
 * of bytes. So the header is just a single 0x00 (more blocks) / 0x01
 * (final block) byte, never bit-packed with the following LEN field.
 */
function zlibStore(data: Uint8Array): Uint8Array {
  const MAX_BLOCK = 65535;
  const blocks: Uint8Array[] = [];
  let offset = 0;
  if (data.length === 0) {
    blocks.push(Uint8Array.from([1, 0, 0, 0xff, 0xff])); // one empty final block
  }
  while (offset < data.length) {
    const remaining = data.length - offset;
    const len = Math.min(MAX_BLOCK, remaining);
    const isFinal = offset + len >= data.length;
    const nlen = ~len & 0xffff;
    const header = Uint8Array.from([
      isFinal ? 1 : 0,
      len & 0xff,
      (len >>> 8) & 0xff,
      nlen & 0xff,
      (nlen >>> 8) & 0xff,
    ]);
    blocks.push(concatBytes([header, data.subarray(offset, offset + len)]));
    offset += len;
  }
  const deflate = concatBytes(blocks);
  const zlibHeader = Uint8Array.from([0x78, 0x01]); // CMF/FLG: deflate, 32K window, no preset dict, fastest level
  const trailer = Uint8Array.from(u32be(adler32(data)));
  return concatBytes([zlibHeader, deflate, trailer]);
}

// ---------------------------------------------------------------------------
// Base64 — hand-rolled so this stays Buffer/btoa-free (browser + server safe).
// ---------------------------------------------------------------------------

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64Encode(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 3 <= bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += BASE64_CHARS[(n >> 18) & 0x3f];
    out += BASE64_CHARS[(n >> 12) & 0x3f];
    out += BASE64_CHARS[(n >> 6) & 0x3f];
    out += BASE64_CHARS[n & 0x3f];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const n = bytes[i] << 16;
    out += BASE64_CHARS[(n >> 18) & 0x3f];
    out += BASE64_CHARS[(n >> 12) & 0x3f];
    out += "==";
  } else if (remaining === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += BASE64_CHARS[(n >> 18) & 0x3f];
    out += BASE64_CHARS[(n >> 12) & 0x3f];
    out += BASE64_CHARS[(n >> 6) & 0x3f];
    out += "=";
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface MonoBitmap {
  /** Pixel width. Need not be a multiple of 8 — trailing bits in the last byte of each row are padding and are ignored. */
  width: number;
  height: number;
  /**
   * Row-major, MSB-first packed 1bpp pixel data. Bit value 1 = foreground
   * (opaque), 0 = background (transparent). Must be at least
   * `Math.ceil(width / 8) * height` bytes (extra trailing bytes, if any,
   * are ignored).
   */
  bits: Uint8Array;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return [255, 255, 255];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/**
 * Encode a 1-bit bitmap as a PNG `data:` URI: a 2-color indexed palette
 * (transparent background, opaque `foregroundColor` for set bits). Returns
 * `undefined` — never throws — if the input dimensions/byte length don't
 * line up, matching lib/escpos.ts's "render something or render nothing,
 * never crash" contract.
 */
export function encodeMonoPngDataUri(bitmap: MonoBitmap, foregroundColor: string): string | undefined {
  const { width, height, bits } = bitmap;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return undefined;
  const rowBytes = Math.ceil(width / 8);
  if (bits.length < rowBytes * height) return undefined;

  try {
    const [r, g, b] = hexToRgb(foregroundColor);

    const ihdr = concatBytes([
      u32be(width),
      u32be(height),
      [1, 3, 0, 0, 0], // bit depth 1, color type 3 (indexed), default compression/filter/interlace
    ]);
    const plte = Uint8Array.from([0, 0, 0, r, g, b]);
    const trns = Uint8Array.from([0, 255]); // index 0 transparent, index 1 opaque

    // Raw (pre-zlib) image data: one filter byte (0 = None) + rowBytes of
    // packed pixel data per scanline.
    const raw = new Uint8Array((1 + rowBytes) * height);
    for (let y = 0; y < height; y++) {
      const srcOffset = y * rowBytes;
      const dstOffset = y * (1 + rowBytes);
      raw[dstOffset] = 0; // filter: None
      raw.set(bits.subarray(srcOffset, srcOffset + rowBytes), dstOffset + 1);
    }

    const idat = zlibStore(raw);

    const png = concatBytes([
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      pngChunk("IHDR", ihdr),
      pngChunk("PLTE", plte),
      pngChunk("tRNS", trns),
      pngChunk("IDAT", idat),
      pngChunk("IEND", new Uint8Array(0)),
    ]);

    return `data:image/png;base64,${base64Encode(png)}`;
  } catch {
    // Contract: never throw. A malformed/edge-case bitmap just doesn't
    // render — the caller (lib/escpos.ts) treats that the same as "no logo
    // found" rather than propagating a rendering bug into a parse failure.
    return undefined;
  }
}
