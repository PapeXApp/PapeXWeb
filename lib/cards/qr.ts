// lib/cards/qr.ts
//
// QR codes for offer redemption (`symbology: "qr"`, cards v1.1): the module
// matrix only. app/r/cards/QrCode.tsx draws it as SVG rects on the server;
// no client JS, no markup built from the value.
//
// THE ENCODER is `uqr` (MIT, zero dependencies, pinned exactly in
// package.json), a TypeScript port of Project Nayuki's QR Code generator.
// Chosen over `qrcode` (pulls in yargs + pngjs) and `qrcode-generator` (its
// 2.x tarball ships no LICENSE file and a stray experiment/ tree). Verified
// against Apple, which is what the App Clip draws with:
//   - with the mask forced to the one CoreImage picks, the matrix is
//     bit-identical to CIQRCodeGenerator's for the test payloads (lib/cards/qr.test.ts
//     holds three of them as goldens);
//   - every output tried (9 payloads x L/M/Q/H, 1..80 chars) decodes back
//     to its payload with CoreImage's own QR detector (CIDetectorTypeQRCode).
// The two can differ in which of the 8 masks they pick (a penalty-score
// tie-break); any mask is a valid code, and every reader handles all eight.
//
// Error correction M, CIQRCodeGenerator's default, so the web and the clip
// draw codes of the same density. The contract caps the value at 80
// printable ASCII characters, which is version 5 (37 x 37) at worst.

import { encode } from "uqr";

/** Contract: `^[\x20-\x7E]{1,80}$` (resolved-cards.schema.json, qr). */
const QR_VALUE_RE = /^[\x20-\x7E]{1,80}$/;

export interface QrModules {
  /** Modules per side, without a quiet zone. */
  size: number;
  /** `modules[y][x]`: true = dark. */
  modules: boolean[][];
  /** Which of the 8 masks was applied (for tests). */
  mask: number;
}

/**
 * Encode `value` at error correction M. Throws on a value outside the
 * contract, which inside CardList's guard drops the whole card, the same way
 * a bad EAN check digit does.
 */
export function encodeQr(value: string, opts: { mask?: number } = {}): QrModules {
  if (typeof value !== "string" || !QR_VALUE_RE.test(value)) throw new RangeError("qr: value outside the contract");
  const r = encode(value, { ecc: "M", border: 0, ...(opts.mask != null ? { maskPattern: opts.mask } : {}) });
  if (r.size !== r.data.length || r.data.some((row) => row.length !== r.size)) throw new RangeError("qr: malformed matrix");
  return { size: r.size, modules: r.data.map((row) => row.map(Boolean)), mask: r.maskPattern };
}

/**
 * Dark modules as horizontal runs, `[x, y, width]`: what the SVG draws as
 * rects (one per run keeps a version-4 code to a few hundred elements).
 */
export function qrRuns(qr: QrModules): [number, number, number][] {
  const runs: [number, number, number][] = [];
  qr.modules.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x += 1;
      runs.push([start, y, x - start]);
    }
  });
  return runs;
}
