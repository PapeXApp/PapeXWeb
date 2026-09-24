// lib/cards/barcode.ts
//
// Barcode encoders for the offer card's `redemption: { type: "barcode" }`:
// Code 128 (subset B), EAN-13 and UPC-A. Pure functions from a value to a row
// of modules; app/r/cards/Barcode.tsx draws the row as SVG rectangles. No
// dependency, no canvas, no HTML string: the bars are data, and the renderer
// never builds markup out of the value.
//
// WHY THESE THREE, AND NOT QR OR PDF417 (YET)
//   These three are small, fully specified by public tables, and checkable:
//   Code 128 by its checksum and by Apple's own CICode128BarcodeGenerator
//   (see lib/cards/cards.test.ts), EAN-13/UPC-A by their check digit. QR and
//   PDF417 need Reed-Solomon error correction and, for QR, mask selection;
//   shipping an unverified 2D encoder behind a coupon is worse than shipping
//   none. Adding a symbology later is an additive change to the format, and
//   an older client drops the card rather than drawing a wrong code.
//
// The native clip (P3) draws Code 128 with CoreImage and needs its own small
// EAN/UPC encoder, since CoreImage has none. The module rows below are the
// reference it should match.

import type { BarcodeSymbology } from "./types";

/** A barcode as a row of modules: `true` is a bar, `false` is a space. Quiet zones included. */
export interface BarcodeModules {
  modules: boolean[];
}

// ---- Code 128 -----------------------------------------------------------------------
//
// Symbol values 0-106 as bar/space widths (bar first). Every symbol is 11
// modules wide except STOP (13, including its final 2-module bar).

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;

export const CODE128_START_B = 104;
export const CODE128_STOP = 106;
/** The spec's minimum quiet zone, in modules, on each side. */
const CODE128_QUIET = 10;

/** Exposed for the table-invariant tests. */
export function code128Pattern(value: number): string {
  return CODE128_PATTERNS[value];
}

function pushWidths(out: boolean[], widths: string) {
  for (let i = 0; i < widths.length; i++) {
    const bar = i % 2 === 0;
    for (let w = 0; w < Number(widths[i]); w++) out.push(bar);
  }
}

function pushSpace(out: boolean[], n: number) {
  for (let i = 0; i < n; i++) out.push(false);
}

/** The Code 128 symbol values for `value` in subset B: start, data, checksum, stop. */
export function code128Values(value: string): number[] {
  const data: number[] = [];
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? -1;
    if (code < 0x20 || code > 0x7e) throw new RangeError("Code 128 subset B covers printable ASCII only");
    data.push(code - 0x20);
  }
  if (data.length === 0) throw new RangeError("empty Code 128 value");
  const checksum = data.reduce((sum, v, i) => sum + v * (i + 1), CODE128_START_B) % 103;
  return [CODE128_START_B, ...data, checksum, CODE128_STOP];
}

export function encodeCode128(value: string): BarcodeModules {
  const modules: boolean[] = [];
  pushSpace(modules, CODE128_QUIET);
  for (const v of code128Values(value)) pushWidths(modules, CODE128_PATTERNS[v]);
  pushSpace(modules, CODE128_QUIET);
  return { modules };
}

// ---- EAN-13 / UPC-A ---------------------------------------------------------------------

const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
/** R is the complement of L. */
const EAN_R = EAN_L.map((p) => [...p].map((b) => (b === "1" ? "0" : "1")).join(""));
/** G is R reversed. */
const EAN_G = EAN_R.map((p) => [...p].reverse().join(""));
/** Which of L/G encodes each left-half digit, keyed by the first (implied) digit. */
const EAN_PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
const EAN_QUIET_LEFT = 11;
const EAN_QUIET_RIGHT = 7;

/** GS1 mod-10 check digit for the digits before it. */
export function gs1CheckDigit(digits: string): number {
  let sum = 0;
  // Weights run 3,1,3,1… from the RIGHTMOST data digit, whatever the length.
  for (let i = 0; i < digits.length; i++) {
    const d = Number(digits[digits.length - 1 - i]);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(value: string): boolean {
  return /^[0-9]{13}$/.test(value) && gs1CheckDigit(value.slice(0, 12)) === Number(value[12]);
}

export function isValidUpcA(value: string): boolean {
  return /^[0-9]{12}$/.test(value) && gs1CheckDigit(value.slice(0, 11)) === Number(value[11]);
}

function pushBits(out: boolean[], bits: string) {
  for (const b of bits) out.push(b === "1");
}

export function encodeEan13(value: string): BarcodeModules {
  if (!isValidEan13(value)) throw new RangeError("not a valid EAN-13");
  const modules: boolean[] = [];
  pushSpace(modules, EAN_QUIET_LEFT);
  pushBits(modules, "101");
  const parity = EAN_PARITY[Number(value[0])];
  for (let i = 1; i <= 6; i++) {
    const d = Number(value[i]);
    pushBits(modules, parity[i - 1] === "L" ? EAN_L[d] : EAN_G[d]);
  }
  pushBits(modules, "01010");
  for (let i = 7; i <= 12; i++) pushBits(modules, EAN_R[Number(value[i])]);
  pushBits(modules, "101");
  pushSpace(modules, EAN_QUIET_RIGHT);
  return { modules };
}

/** UPC-A is EAN-13 with an implied leading 0: identical bars. */
export function encodeUpcA(value: string): BarcodeModules {
  if (!isValidUpcA(value)) throw new RangeError("not a valid UPC-A");
  return encodeEan13(`0${value}`);
}

/**
 * `qr` (v1.1) has no web encoder yet, so it throws: inside CardList's guard
 * that drops the card whole, never a voucher with a hole. The web therefore
 * does not advertise `barcode.qr` in its caps (types.ts CAPS_1_7_0), and the
 * server never sends it a QR offer.
 */
export function encodeBarcode(symbology: BarcodeSymbology, value: string): BarcodeModules {
  switch (symbology) {
    case "qr":
      throw new RangeError("qr: no web encoder yet");
    case "code128":
      return encodeCode128(value);
    case "ean13":
      return encodeEan13(value);
    case "upca":
      return encodeUpcA(value);
  }
}

/** Runs of bars as [start, width] pairs, in modules: what the SVG draws as rects. */
export function barRuns(modules: boolean[]): [number, number][] {
  const runs: [number, number][] = [];
  let i = 0;
  while (i < modules.length) {
    if (!modules[i]) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < modules.length && modules[i]) i += 1;
    runs.push([start, i - start]);
  }
  return runs;
}
