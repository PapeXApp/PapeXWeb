// lib/starRaster.ts
//
// Star Line Mode raster decoder — a TypeScript port of the verified Python
// reference decoder at
// papex-adapter-backend/test/fixtures/rdh-raster/REFERENCE_decoder.py
// (proven against real merchant captures). Same algorithm, same thresholds,
// same "preserve the feeds as blank rows" behaviour.
//
// Why this exists
// ---------------
// Blaze POS does not send text ESC/POS. It renders the whole receipt to a
// 1bpp bitmap on the POS side and ships it as Star Line Mode raster. This
// was confirmed at the Doobie Nights pilot on 2026-08-18 with two different
// printer models selected in Blaze (mC-Print3 and one other) producing
// byte-identical raster jobs — so it is Blaze behaviour, not a merchant
// misconfiguration. Fixtures: 3ea8e69cc7764ad8.bin / 5b8506ff227b1681.bin
// (20,954 / 20,953 bytes, both decoding to 552x815).
//
// Nothing in such a payload is text, so lib/escpos.ts's text state machine
// produces zero lines and `/r` renders "Receipt not available" — the exact
// bug this module fixes.
//
// Wire format (as captured)
// -------------------------
//   1b 2a 72 42        ESC * r B      exit/reset raster mode (also seen leading)
//   1b 2a 72 41        ESC * r A      enter raster mode
//   1b 2a 72 50 30 00  ESC * r P 0    page length, ASCII digits + NUL
//   1b 2a 72 45 31 00  ESC * r E 1    margin, same argument form
//   62 n1 n2 <data>    'b' + LITTLE-ENDIAN 16-bit byte count, one raster row,
//                      MSB-first per byte, bit set = black
//   1b 2a 72 59 n 00   ESC * r Y n    feed n dot lines
//
// `ESC * r Y n` carries real layout information — the vertical gaps between
// blocks — and MUST be emitted as n blank rows. Dropping it renders the
// pilot fixture at 338px tall instead of the correct 815px, i.e. a
// vertically-squashed, unreadable receipt.
//
// This is a DIFFERENT protocol from the Epson `ESC * m nL nH` column-format
// bit-image command lib/escpos.ts already implements. `ESC * r ...` is Star's
// raster command; feeding these bytes to the Epson state machine desyncs it
// immediately. Hence detection runs over the WHOLE blob up front (see
// `looksLikeStarRaster`, called from `parseEscPos` before any byte-by-byte
// parsing), never as a case inside the state machine.
//
// Portability: Uint8Array only, no Node-only APIs — same contract as
// lib/escpos.ts and lib/png.ts, so this runs unmodified in a server
// component or a browser bundle.

/** ESC * r — the Star raster command prefix. */
const RASTER_PREFIX_0 = 0x1b;
const RASTER_PREFIX_1 = 0x2a;
const RASTER_PREFIX_2 = 0x72;

/** 'b' — one raster row, followed by a little-endian 16-bit byte count. */
const ROW_CMD = 0x62;

/**
 * A payload must carry at least this many `ESC * r` commands before we treat
 * it as a bitmap. A text receipt that happens to contain those three bytes
 * once is far more likely to be a coincidence (a `ESC *` bit image whose
 * first data byte is 0x72, say) than a raster job. Matches the reference.
 */
const MIN_RASTER_CMDS = 3;

/**
 * ...and stripping everything non-printable must leave essentially no text
 * behind. A real Star raster job is ~2-5% printable-by-accident; a text
 * receipt is 80%+. 25% is the reference decoder's threshold and leaves a
 * very wide margin on both sides — see starRaster.test.ts, which asserts
 * every golden text fixture in this repo lands on the "not raster" side.
 */
const PRINTABLE_RATIO_MAX = 0.25;

/**
 * Anything shorter than this can't be a receipt bitmap. Notably this is what
 * rejects the 5-byte `1b 1e 61 00 00` capture (fixture 665477603ed0ec3c) —
 * an ASB-disable *command* Blaze emits alongside the print job, not a
 * receipt. It must never render as one.
 */
const MIN_PAYLOAD_BYTES = 16;

/** Reference caps a single feed at 4096 dot lines. */
const MAX_FEED_ROWS = 4096;

/**
 * Sanity caps this port adds on top of the reference (which runs offline on
 * trusted captures; this runs in a request handler on whatever bytes the
 * backend hands us). 20,000 rows at 203dpi is ~2.5 metres of tape, and no
 * thermal head is 8,192 dots wide — either is malformed input, not a
 * receipt, and neither should be allowed to allocate unbounded memory.
 */
const MAX_ROWS = 20_000;
const MAX_ROW_BYTES = 1024;

export interface StarRasterBitmap {
  widthPx: number;
  heightPx: number;
  /**
   * Row-major, MSB-first packed 1bpp pixel data, stride =
   * `Math.ceil(widthPx / 8)`. Bit set = black ink on the paper. This is
   * exactly the layout lib/png.ts's `encodeMonoPngDataUri` expects.
   */
  bits: Uint8Array;
}

/** Count non-overlapping `ESC * r` occurrences. The pattern can't self-overlap. */
function countRasterCommands(bytes: Uint8Array): number {
  let count = 0;
  for (let i = 0; i + 2 < bytes.length; i++) {
    if (
      bytes[i] === RASTER_PREFIX_0 &&
      bytes[i + 1] === RASTER_PREFIX_1 &&
      bytes[i + 2] === RASTER_PREFIX_2
    ) {
      count += 1;
      i += 2;
    }
  }
  return count;
}

function printableRatio(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  let printable = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 0x20 && b <= 0x7e) printable += 1;
  }
  return printable / bytes.length;
}

/**
 * True if this blob is a Star Line Mode raster bitmap rather than a text
 * ESC/POS receipt. Deliberately conservative in both directions: it takes
 * three raster commands AND an almost-entirely-unprintable payload, so an
 * ordinary text receipt can't be misdetected into the image path (which
 * would blank its text), and a command fragment like the 5-byte ASB-disable
 * capture can't be misdetected into a "receipt".
 */
export function looksLikeStarRaster(bytes: Uint8Array): boolean {
  if (bytes.length < MIN_PAYLOAD_BYTES) return false;
  if (countRasterCommands(bytes) < MIN_RASTER_CMDS) return false;
  return printableRatio(bytes) < PRINTABLE_RATIO_MAX;
}

/**
 * Parse an ASCII-digits-then-NUL command argument (`ESC * r P 0 NUL`,
 * `ESC * r Y 30 NUL`). Non-numeric or empty arguments decode to 0, matching
 * the reference decoder's `int(arg.decode("ascii") or "0")` + ValueError
 * fallback.
 */
function parseAsciiArg(bytes: Uint8Array, start: number, end: number): number {
  if (end <= start) return 0;
  let n = 0;
  for (let i = start; i < end; i++) {
    const b = bytes[i];
    if (b < 0x30 || b > 0x39) return 0; // non-digit -> 0, same as the reference
    n = n * 10 + (b - 0x30);
    if (n > MAX_FEED_ROWS) return MAX_FEED_ROWS; // clamp early, don't overflow
  }
  return n;
}

/**
 * Reconstruct the bitmap, or `null` if the payload carries no usable raster
 * rows. Never throws — same "render something or render nothing, never
 * crash" contract as lib/escpos.ts.
 *
 * Rows are variable width; the image width is the widest row, and narrower
 * rows are zero-padded on the right (white). `ESC * r Y n` feeds become n
 * blank rows so vertical layout is preserved.
 */
export function decodeStarRaster(bytes: Uint8Array): StarRasterBitmap | null {
  // `null` entries are blank rows (from feeds); non-null entries are packed
  // row data held as subarray views — no copying until the final assembly.
  const rows: Array<Uint8Array | null> = [];
  let maxLen = 0;
  let i = 0;
  const n = bytes.length;

  while (i < n && rows.length <= MAX_ROWS) {
    const b = bytes[i];

    if (
      b === RASTER_PREFIX_0 &&
      bytes[i + 1] === RASTER_PREFIX_1 &&
      bytes[i + 2] === RASTER_PREFIX_2
    ) {
      const cmd = i + 3 < n ? bytes[i + 3] : -1;
      i += 4;
      // P (page length), E (margin), Y (feed) all take an ASCII argument
      // terminated by NUL. A / B (enter / exit raster mode) take none.
      if (cmd === 0x50 || cmd === 0x45 || cmd === 0x59) {
        const start = i;
        while (i < n && bytes[i] !== 0x00) i += 1;
        const arg = parseAsciiArg(bytes, start, i);
        i += 1; // consume the NUL
        if (cmd === 0x59) {
          const blank = Math.min(arg, MAX_FEED_ROWS, MAX_ROWS - rows.length);
          for (let k = 0; k < blank; k++) rows.push(null);
        }
      }
      continue;
    }

    if (b === ROW_CMD && i + 3 <= n) {
      const length = bytes[i + 1] | (bytes[i + 2] << 8);
      if (length > 0 && length <= MAX_ROW_BYTES && n - (i + 3) >= length) {
        rows.push(bytes.subarray(i + 3, i + 3 + length));
        if (length > maxLen) maxLen = length;
        i += 3 + length;
        continue;
      }
    }

    i += 1;
  }

  // `maxLen === 0` means feeds only (or nothing) — a zero-width image is not
  // a receipt. The reference returns a degenerate 0-wide RasterImage here;
  // this port returns null so callers have one "nothing to show" answer.
  if (rows.length === 0 || maxLen === 0) return null;

  const stride = maxLen;
  const bits = new Uint8Array(stride * rows.length);
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    if (row) bits.set(row, y * stride);
  }

  return { widthPx: maxLen * 8, heightPx: rows.length, bits };
}
