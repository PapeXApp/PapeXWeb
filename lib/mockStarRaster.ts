// lib/mockStarRaster.ts
//
// MOCK FIXTURE GENERATOR — never used in production.
//
// Builds a synthetic Star Line Mode raster job: a real, decodable 1bpp
// receipt bitmap wrapped in the same `ESC * r` command stream Blaze POS
// emits. lib/merchantMock.ts serves it as the raw bytes for the "ok_raster"
// row, so a developer running NEXT_PUBLIC_MERCHANT_MOCK=1 exercises the
// genuine looksLikeStarRaster -> decodeStarRaster -> PNG path rather than a
// mock-only shortcut.
//
// Why the bitmap carries READABLE TEXT instead of a plausible bar pattern:
// an arrangement of bars proves only that *something* rendered. It cannot
// show you the image came out vertically flipped, mirrored, or squashed to a
// third of its height — that last one being exactly what dropping the
// `ESC * r Y` feeds does, the bug lib/starRaster.ts calls out. Legible text
// fails visibly for all of them, so this draws with a 5x7 bitmap font: the
// cheapest thing that makes a wrong render obviously wrong.
//
// Deterministic — no RNG, no clock. Same bytes on every call.

/** 552 dots = 69 bytes, the width measured on the real pilot captures. */
export const RASTER_WIDTH_DOTS = 552;
const WIDTH_BYTES = RASTER_WIDTH_DOTS / 8; // 69

/**
 * 5x7 glyphs: five column bytes each, bit 0 = top row. Uppercase, digits and
 * the few symbols a receipt needs; anything else falls back to a space.
 */
const FONT: Record<string, number[]> = {
  " ": [0x00, 0x00, 0x00, 0x00, 0x00],
  "-": [0x08, 0x08, 0x08, 0x08, 0x08],
  ".": [0x00, 0x60, 0x60, 0x00, 0x00],
  ",": [0x00, 0x50, 0x30, 0x00, 0x00],
  "/": [0x20, 0x10, 0x08, 0x04, 0x02],
  ":": [0x00, 0x36, 0x36, 0x00, 0x00],
  "$": [0x24, 0x2a, 0x7f, 0x2a, 0x12],
  "#": [0x14, 0x7f, 0x14, 0x7f, 0x14],
  "*": [0x14, 0x08, 0x3e, 0x08, 0x14],
  "%": [0x23, 0x13, 0x08, 0x64, 0x62],
  "0": [0x3e, 0x51, 0x49, 0x45, 0x3e],
  "1": [0x00, 0x42, 0x7f, 0x40, 0x00],
  "2": [0x42, 0x61, 0x51, 0x49, 0x46],
  "3": [0x21, 0x41, 0x45, 0x4b, 0x31],
  "4": [0x18, 0x14, 0x12, 0x7f, 0x10],
  "5": [0x27, 0x45, 0x45, 0x45, 0x39],
  "6": [0x3c, 0x4a, 0x49, 0x49, 0x30],
  "7": [0x01, 0x71, 0x09, 0x05, 0x03],
  "8": [0x36, 0x49, 0x49, 0x49, 0x36],
  "9": [0x06, 0x49, 0x49, 0x29, 0x1e],
  A: [0x7e, 0x11, 0x11, 0x11, 0x7e], B: [0x7f, 0x49, 0x49, 0x49, 0x36],
  C: [0x3e, 0x41, 0x41, 0x41, 0x22], D: [0x7f, 0x41, 0x41, 0x22, 0x1c],
  E: [0x7f, 0x49, 0x49, 0x49, 0x41], F: [0x7f, 0x09, 0x09, 0x01, 0x01],
  G: [0x3e, 0x41, 0x49, 0x49, 0x7a], H: [0x7f, 0x08, 0x08, 0x08, 0x7f],
  I: [0x00, 0x41, 0x7f, 0x41, 0x00], J: [0x20, 0x40, 0x41, 0x3f, 0x01],
  K: [0x7f, 0x08, 0x14, 0x22, 0x41], L: [0x7f, 0x40, 0x40, 0x40, 0x40],
  M: [0x7f, 0x02, 0x04, 0x02, 0x7f], N: [0x7f, 0x04, 0x08, 0x10, 0x7f],
  O: [0x3e, 0x41, 0x41, 0x41, 0x3e], P: [0x7f, 0x09, 0x09, 0x09, 0x06],
  Q: [0x3e, 0x41, 0x51, 0x21, 0x5e], R: [0x7f, 0x09, 0x19, 0x29, 0x46],
  S: [0x46, 0x49, 0x49, 0x49, 0x31], T: [0x01, 0x01, 0x7f, 0x01, 0x01],
  U: [0x3f, 0x40, 0x40, 0x40, 0x3f], V: [0x1f, 0x20, 0x40, 0x20, 0x1f],
  W: [0x3f, 0x40, 0x38, 0x40, 0x3f], X: [0x63, 0x14, 0x08, 0x14, 0x63],
  Y: [0x07, 0x08, 0x70, 0x08, 0x07], Z: [0x61, 0x51, 0x49, 0x45, 0x43],
};

const GLYPH_COLS = 5;
const GLYPH_ROWS = 7;
const MARGIN = 24;

/** Dots `text` occupies at `scale` (one blank column between glyphs). */
function textWidth(text: string, scale: number): number {
  if (text.length === 0) return 0;
  return text.length * (GLYPH_COLS + 1) * scale - scale;
}

/**
 * An append-only canvas of packed 1bpp rows. `y` is always explicit so a
 * line and its right-aligned amount can be drawn into the same band.
 */
class Canvas {
  readonly rows: Uint8Array[] = [];

  get height(): number {
    return this.rows.length;
  }

  /** Grow so row index `y` exists. */
  private ensure(y: number): void {
    while (this.rows.length <= y) this.rows.push(new Uint8Array(WIDTH_BYTES));
  }

  setPixel(x: number, y: number): void {
    if (x < 0 || x >= RASTER_WIDTH_DOTS || y < 0) return;
    this.ensure(y);
    this.rows[y][x >> 3] |= 0x80 >> (x & 7);
  }

  feed(n: number): void {
    this.ensure(this.rows.length + n - 1);
  }

  /** Solid horizontal rule at the bottom, inset by `MARGIN`. */
  rule(thickness: number): void {
    const y0 = this.rows.length;
    for (let y = y0; y < y0 + thickness; y++) {
      for (let x = MARGIN; x < RASTER_WIDTH_DOTS - MARGIN; x++) this.setPixel(x, y);
    }
  }

  /**
   * Draw `text` with its top edge at `y0`. `bold` re-strikes one dot to the
   * right, which is what a thermal head actually does for emphasis.
   */
  text(text: string, x0: number, y0: number, scale: number, bold: boolean): void {
    let x = x0;
    for (const raw of text.toUpperCase()) {
      const glyph = FONT[raw] ?? FONT[" "];
      for (let col = 0; col < GLYPH_COLS; col++) {
        const bits = glyph[col];
        for (let row = 0; row < GLYPH_ROWS; row++) {
          if (!((bits >> row) & 1)) continue;
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              this.setPixel(x + col * scale + dx, y0 + row * scale + dy);
              if (bold) this.setPixel(x + col * scale + dx + 1, y0 + row * scale + dy);
            }
          }
        }
      }
      x += (GLYPH_COLS + 1) * scale;
    }
    this.ensure(y0 + GLYPH_ROWS * scale - 1);
  }
}

type Line =
  | { kind: "gap"; dots: number }
  | { kind: "rule"; thickness: number }
  | { kind: "text"; text: string; amount?: string; center?: boolean; scale?: number; bold?: boolean };

/**
 * The mock receipt's content. Mirrors a dispensary tape (the pilot vertical)
 * so the rendered image is recognisable as the same kind of document the
 * rest of the mock dataset describes.
 */
const LINES: Line[] = [
  { kind: "text", text: "Doobie Nights", center: true, scale: 4, bold: true },
  { kind: "gap", dots: 6 },
  { kind: "text", text: "3300 Santa Rosa Ave", center: true, scale: 2 },
  { kind: "text", text: "Santa Rosa, CA 95407", center: true, scale: 2 },
  { kind: "gap", dots: 10 },
  { kind: "text", text: "Order 4417   Reg 2", center: true, scale: 2 },
  { kind: "gap", dots: 10 },
  { kind: "rule", thickness: 3 },
  { kind: "gap", dots: 10 },
  { kind: "text", text: "Blue Dream 3.5g", amount: "42.00", scale: 2 },
  { kind: "text", text: "Wyld Gummies", amount: "24.00", scale: 2 },
  { kind: "text", text: "Preroll 2pk", amount: "18.00", scale: 2 },
  { kind: "text", text: "Papers", amount: "3.50", scale: 2 },
  { kind: "gap", dots: 10 },
  { kind: "rule", thickness: 2 },
  { kind: "gap", dots: 8 },
  { kind: "text", text: "Subtotal", amount: "87.50", scale: 2 },
  { kind: "text", text: "Excise Tax", amount: "13.13", scale: 2 },
  { kind: "text", text: "Sales Tax", amount: "7.44", scale: 2 },
  { kind: "gap", dots: 6 },
  { kind: "text", text: "TOTAL", amount: "108.07", scale: 3, bold: true },
  { kind: "gap", dots: 10 },
  { kind: "rule", thickness: 3 },
  { kind: "gap", dots: 10 },
  { kind: "text", text: "Aeropay ****4417", center: true, scale: 2 },
  { kind: "text", text: "Approved", center: true, scale: 2 },
  { kind: "gap", dots: 14 },
  { kind: "text", text: "Thank you", center: true, scale: 2 },
  { kind: "text", text: "Tap the reader for a receipt", center: true, scale: 2 },
];

function renderRows(): Uint8Array[] {
  const canvas = new Canvas();
  canvas.feed(16); // leading head advance, as on a real job

  for (const line of LINES) {
    if (line.kind === "gap") {
      canvas.feed(line.dots);
      continue;
    }
    if (line.kind === "rule") {
      canvas.rule(line.thickness);
      continue;
    }
    const scale = line.scale ?? 2;
    const bold = line.bold ?? false;
    const y0 = canvas.height;
    const x = line.center
      ? Math.max(MARGIN, (RASTER_WIDTH_DOTS - textWidth(line.text, scale)) >> 1)
      : MARGIN;
    canvas.text(line.text, x, y0, scale, bold);
    if (line.amount) {
      // Same band as the item name — right-aligned against the margin.
      canvas.text(line.amount, RASTER_WIDTH_DOTS - MARGIN - textWidth(line.amount, scale), y0, scale, bold);
    }
    canvas.feed(4); // inter-line leading
  }

  canvas.feed(48); // trailing feed before the cut
  return canvas.rows;
}

const ESC_R = [0x1b, 0x2a, 0x72];

function feedCmd(n: number): number[] {
  return [...ESC_R, 0x59, ...String(n).split("").map((c) => c.charCodeAt(0)), 0x00];
}

/**
 * Wrap the rendered rows in the Star Line Mode command stream, shaped like
 * the real pilot captures: reset, enter raster mode, page length, margin,
 * then `b` + LE16 byte count + row data per row, then exit.
 *
 * Runs of fully blank rows are emitted as `ESC * r Y n` feeds rather than as
 * rows of zeroes, because that is what a real job does — and it means this
 * fixture genuinely exercises the decoder's feed handling (the part whose
 * absence squashes the image) instead of bypassing it.
 */
export function buildMockStarRasterJob(): Uint8Array {
  const rows = renderRows();
  const out: number[] = [];
  out.push(...ESC_R, 0x42); // reset
  out.push(...ESC_R, 0x41); // enter raster mode
  out.push(...ESC_R, 0x50, 0x30, 0x00); // page length 0 = continuous
  out.push(...ESC_R, 0x45, 0x31, 0x00); // margin

  let pendingFeed = 0;
  for (const row of rows) {
    if (row.every((b) => b === 0)) {
      pendingFeed++;
      continue;
    }
    if (pendingFeed > 0) {
      out.push(...feedCmd(pendingFeed));
      pendingFeed = 0;
    }
    out.push(0x62, row.length & 0xff, (row.length >> 8) & 0xff, ...row);
  }
  if (pendingFeed > 0) out.push(...feedCmd(pendingFeed));

  out.push(...ESC_R, 0x42); // exit
  return new Uint8Array(out);
}
