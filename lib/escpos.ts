// lib/escpos.ts
//
// TypeScript ESC/POS text extractor for the RDH web fallback (`/r` page).
//
// This is a direct port of the Swift parser at
// Papex_AppClip/Sources/ESCPOSParser/ESCPOSParser.swift, kept as close to
// line-for-line parity as TypeScript allows so the two clients stay in sync
// per docs/rdh_orchestrator.md decision #4 ("shared JSON intermediate
// schema"). Same philosophy: skip-unknown-never-throw. This parser must
// never throw on malformed input — the contract is "render something."
//
// v1 pragmatic scope (per docs/RDH_WEB_FALLBACK_PLAN.md Phase 2/3): no totals
// extraction, no item/merchant structuring heuristics beyond a light
// "guess a header line" helper used by the page for a nicer title. Everything
// else renders as verbatim styled monospace lines, same as the App Clip's own
// "original receipt" fallback card.
//
// Operates on Uint8Array only — no Node-only APIs — so it can run in either
// a Next.js server component (used here) or a browser bundle unmodified.
//
// --- Logo / raster image support -------------------------------------------
//
// Real ESC/POS receipts commonly print a merchant logo as the very first
// thing on the tape, as an inline raster bitmap (see docs/... bench proof:
// a 576x120-dot `GS v 0` raster, byte-for-byte verified against the
// backend). This parser used to treat that bitmap purely as bytes to skip
// past — correctly, in that it never corrupted the text that followed, but
// the logo itself was thrown away. It's now decoded into a PNG `data:` URI
// (see lib/png.ts) and returned as `Receipt.logo`.
//
// Commands covered, and why:
//   - `GS v 0`   — the bench-verified, real-world case. Full decode.
//   - `ESC *`    — column-format bit image, explicitly asked for. Decoded
//                  per-invocation (one 8- or 24-dot-tall band). NOT
//                  stitched across multiple ESC * calls into one taller
//                  composite image — that needs cursor/line-position
//                  tracking this flat text/line parser doesn't do, and
//                  nothing in the corpus exercises it. First successfully
//                  decoded band wins, same as GS v 0.
//   - `GS ( L` / `GS 8 L` <Function 112> ("store raster in print buffer")
//                — decoded too: the wire format is well-documented
//                  (Epson's "Graphics" command set; cross-checked against
//                  python-escpos's implementation) and self-contained in
//                  one command, same as GS v 0. No corpus fixture exercises
//                  it, so this path is verified only by a synthetic test,
//                  not a real capture.
//   - `GS ( L` <Function 67/68> ("define NV graphics") — NOT decoded. The
//                  bitmap bytes ARE present in-stream, but this command's
//                  job is provisioning the printer's flash for later
//                  `<Function 69>` prints, not printing the current job —
//                  more likely to appear in a setup utility than a live
//                  purchase receipt. No corpus evidence either way, so this
//                  is left as a safe skip (already resync-safe via the
//                  generic GS ( length-prefixed skip) rather than guessed
//                  at under time pressure.
//   - `GS 8 L` in general — only resync-safety is added (correct 4-byte
//                  length field so a receipt using this form doesn't
//                  desync the rest of the parse into garbage text, the
//                  same failure class as the historical GS v 0 off-by-one
//                  bug). Not decoded into an image.
//
// NV (non-volatile / printer-stored) logo references — `FS p` (print NV
// bit image) and `GS ( L` <Function 69> (print NV graphics) — reference an
// image baked into the printer's own flash memory by key code. Those bytes
// are simply not in this stream and the image is unrecoverable from a
// capture. These are detected and set `Receipt.nvLogoReferenced = true` so
// the caller can tell "no logo" apart from "logo exists but isn't ours to
// render" — nothing is rendered for them (no placeholder, no broken image).
//
// Image-only receipts: a receipt whose only content is a logo (no text at
// all) is deliberately NOT treated as printable content — `Receipt.logo`
// lives outside `Receipt.lines`, so `lib/receiptState.ts`'s
// `hasVisibleContent` (which only inspects text) is completely unaffected
// by this feature and still resolves such a stream to NOT_AVAILABLE. See
// app/r/page.tsx / lib/receiptState.ts for the full rationale — a logo
// with no readable text isn't something this app treats as "a receipt".

import { encodeMonoPngDataUri } from "./png";

export type Alignment = "left" | "center" | "right";

export interface Style {
  bold: boolean;
  underline: boolean;
  doubleHeight: boolean;
  doubleWidth: boolean;
  /** Underline thickness: 0 = off, 1 = 1-dot, 2 = 2-dot. ESC - n. */
  underlineThickness: number;
  /** ESC M n — 0 = Font A (default), 1 = Font B. */
  fontB: boolean;
}

export function defaultStyle(): Style {
  return {
    bold: false,
    underline: false,
    doubleHeight: false,
    doubleWidth: false,
    underlineThickness: 0,
    fontB: false,
  };
}

export interface ReceiptLine {
  text: string;
  align: Alignment;
  style: Style;
}

/** A decoded inline raster/bit-image logo, rendered to a PNG `data:` URI. */
export interface DecodedLogo {
  widthPx: number;
  heightPx: number;
  dataUri: string;
  source: "GS v 0" | "ESC *" | "GS ( L";
}

export interface Receipt {
  header: ReceiptLine[];
  lines: ReceiptLine[];
  footer: ReceiptLine[];
  /** First successfully decoded inline logo found, in stream order, if any. */
  logo?: DecodedLogo;
  /**
   * True when the stream referenced a printer-stored (NV) logo — `FS p` or
   * `GS ( L` <Function 69> — whose bitmap bytes are not in this capture and
   * therefore cannot be rendered. Independent of `logo`: a stream can set
   * this, have a decoded `logo`, both, or neither.
   */
  nvLogoReferenced: boolean;
}

// Mirrors app/r/ui.tsx's `T.text` token — docs/PAPEX_DESIGN_KIT_FOR_WEB.md
// §1's dark-theme `white-90` (rgba(255,255,255,0.90)), flattened against the
// card's fixed navy background (#00121D) into an opaque hex, since the PNG
// encoder's palette entry has no alpha channel to spare (index 1 is already
// forced fully opaque — see lib/png.ts's PLTE/tRNS). The receipt viewer's
// glass cards are always a dark navy surface regardless of page theme (see
// app/r/glass.module.css's `.card`), so a near-white foreground reads as a
// deliberate light logo mark rather than an inverted/broken image. Kept as
// a local literal rather than importing from app/r/ui.tsx: this file must
// stay usable outside the Next.js app (see the portability note above), and
// there is no shared lib/theme module today.
const LOGO_FOREGROUND = "#E6E7E8";

type Codepage = "cp437" | "cp858" | "fallback";

// ---------------------------------------------------------------------------
// Codepages — CP437 / CP858 high-byte (0x80-0xFF) -> Unicode code point maps.
// ASCII-identical below 0x80. Byte-for-byte match with Codepages.swift /
// receipt-print-hq/escpos-tools, per docs/rdh_orchestrator.md decision #4.
// ---------------------------------------------------------------------------

const CP437_HIGH: number[] = [
  // 0x80 - 0x8F
  0x00c7, 0x00fc, 0x00e9, 0x00e2, 0x00e4, 0x00e0, 0x00e5, 0x00e7, 0x00ea,
  0x00eb, 0x00e8, 0x00ef, 0x00ee, 0x00ec, 0x00c4, 0x00c5,
  // 0x90 - 0x9F
  0x00c9, 0x00e6, 0x00c6, 0x00f4, 0x00f6, 0x00f2, 0x00fb, 0x00f9, 0x00ff,
  0x00d6, 0x00dc, 0x00a2, 0x00a3, 0x00a5, 0x20a7, 0x0192,
  // 0xA0 - 0xAF
  0x00e1, 0x00ed, 0x00f3, 0x00fa, 0x00f1, 0x00d1, 0x00aa, 0x00ba, 0x00bf,
  0x2310, 0x00ac, 0x00bd, 0x00bc, 0x00a1, 0x00ab, 0x00bb,
  // 0xB0 - 0xBF
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556, 0x2555,
  0x2563, 0x2551, 0x2557, 0x255d, 0x255c, 0x255b, 0x2510,
  // 0xC0 - 0xCF
  0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x255e, 0x255f, 0x255a,
  0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x2567,
  // 0xD0 - 0xDF
  0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256b, 0x256a,
  0x2518, 0x250c, 0x2588, 0x2584, 0x258c, 0x2590, 0x2580,
  // 0xE0 - 0xEF
  0x03b1, 0x00df, 0x0393, 0x03c0, 0x03a3, 0x03c3, 0x00b5, 0x03c4, 0x03a6,
  0x0398, 0x03a9, 0x03b4, 0x221e, 0x03c6, 0x03b5, 0x2229,
  // 0xF0 - 0xFF
  0x2261, 0x00b1, 0x2265, 0x2264, 0x2320, 0x2321, 0x00f7, 0x2248, 0x00b0,
  0x2219, 0x00b7, 0x221a, 0x207f, 0x00b2, 0x25a0, 0x00a0,
];

const CP858_HIGH: number[] = [
  // 0x80 - 0x8F
  0x00c7, 0x00fc, 0x00e9, 0x00e2, 0x00e4, 0x00e0, 0x00e5, 0x00e7, 0x00ea,
  0x00eb, 0x00e8, 0x00ef, 0x00ee, 0x00ec, 0x00c4, 0x00c5,
  // 0x90 - 0x9F
  0x00c9, 0x00e6, 0x00c6, 0x00f4, 0x00f6, 0x00f2, 0x00fb, 0x00f9, 0x00ff,
  0x00d6, 0x00dc, 0x00f8, 0x00a3, 0x00d8, 0x00d7, 0x0192,
  // 0xA0 - 0xAF
  0x00e1, 0x00ed, 0x00f3, 0x00fa, 0x00f1, 0x00d1, 0x00aa, 0x00ba, 0x00bf,
  0x00ae, 0x00ac, 0x00bd, 0x00bc, 0x00a1, 0x00ab, 0x00bb,
  // 0xB0 - 0xBF
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x00c1, 0x00c2, 0x00c0, 0x00a9,
  0x2563, 0x2551, 0x2557, 0x255d, 0x00a2, 0x00a5, 0x2510,
  // 0xC0 - 0xCF
  0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x00e3, 0x00c3, 0x255a,
  0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x00a4,
  // 0xD0 - 0xDF; 0xD5 = euro sign (this is what makes it CP858 vs CP850)
  0x00f0, 0x00d0, 0x00ca, 0x00cb, 0x00c8, 0x20ac, 0x00cd, 0x00ce, 0x00cf,
  0x2518, 0x250c, 0x2588, 0x2584, 0x00a6, 0x00cc, 0x2580,
  // 0xE0 - 0xEF
  0x00d3, 0x00df, 0x00d4, 0x00d2, 0x00f5, 0x00d5, 0x00b5, 0x00fe, 0x00de,
  0x00da, 0x00db, 0x00d9, 0x00fd, 0x00dd, 0x00af, 0x00b4,
  // 0xF0 - 0xFF
  0x00ad, 0x00b1, 0x2017, 0x00be, 0x00b6, 0x00a7, 0x00f7, 0x00b8, 0x00b0,
  0x00a8, 0x00b7, 0x00b9, 0x00b3, 0x00b2, 0x25a0, 0x00a0,
];

function decodeByte(byte: number, page: Codepage): string {
  if (byte < 0x20) return "�";
  if (byte < 0x80) return String.fromCharCode(byte);
  const table = page === "cp858" ? CP858_HIGH : CP437_HIGH;
  const idx = byte - 0x80;
  if (idx >= table.length) return "�";
  return String.fromCodePoint(table[idx]);
}

// ---------------------------------------------------------------------------
// Parser context — mirrors the Swift `ParserContext` struct. JS has no
// mutating-struct semantics so this is a small class closing over `index`.
// ---------------------------------------------------------------------------

class ParserContext {
  bytes: Uint8Array;
  index = 0;

  currentText: number[] = [];
  currentAlign: Alignment = "left";
  currentStyle: Style = defaultStyle();
  codepage: Codepage = "cp437";

  lines: ReceiptLine[] = [];

  logo?: DecodedLogo;
  nvLogoReferenced = false;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  run(): void {
    const bytes = this.bytes;
    while (this.index < bytes.length) {
      const b = bytes[this.index];
      switch (b) {
        // LF — line feed, finalize current line
        case 0x0a:
          this.index += 1;
          this.flushLine();
          break;
        // CR — treat as soft line break only when not followed by LF (avoid
        // double-breaking CRLF).
        case 0x0d:
          this.index += 1;
          if (this.index < bytes.length && bytes[this.index] === 0x0a) {
            continue;
          }
          this.flushLine();
          break;
        // HT — horizontal tab. Emit a literal tab char.
        case 0x09:
          this.currentText.push(0x09);
          this.index += 1;
          break;
        // FF — form feed. Some legacy printers use this as cut.
        case 0x0c:
          this.index += 1;
          this.finalizePending();
          break;
        // ESC commands
        case 0x1b:
          this.handleEsc();
          break;
        // GS commands
        case 0x1d:
          this.handleGs();
          break;
        // FS commands (codepage select on some vendors; mostly skip)
        case 0x1c:
          this.handleFs();
          break;
        // DLE — peripheral status.
        case 0x10:
          this.handleDle();
          break;
        default:
          // Other control bytes 0x00-0x1F not handled above: silently skip.
          if (
            (b >= 0x00 && b <= 0x08) ||
            b === 0x0b ||
            b === 0x0e ||
            b === 0x0f ||
            (b >= 0x11 && b <= 0x13) ||
            b === 0x15 ||
            (b >= 0x16 && b <= 0x1a) ||
            b === 0x1e ||
            b === 0x1f
          ) {
            this.index += 1;
          } else {
            // Printable byte — accumulate into the current line.
            this.currentText.push(b);
            this.index += 1;
          }
      }
    }
    // Flush trailing partial line, if any.
    this.finalizePending();
  }

  // ---- DLE dispatch --------------------------------------------------------

  /**
   * DLE EOT (0x04) n   -> 1 more byte
   * DLE ENQ (0x05) n   -> 1 more byte
   * DLE DC4 (0x14) ... -> up to 3 more bytes
   * Anything else: just consume the DLE.
   */
  handleDle(): void {
    this.index += 1;
    if (this.index >= this.bytes.length) return;
    const sub = this.bytes[this.index];
    this.index += 1;
    switch (sub) {
      case 0x04:
      case 0x05:
        if (this.index < this.bytes.length) this.index += 1;
        break;
      case 0x14: {
        const take = Math.min(3, this.bytes.length - this.index);
        this.index += take;
        break;
      }
      default:
        break;
    }
  }

  // ---- ESC dispatch ---------------------------------------------------------

  handleEsc(): void {
    // index points at 0x1B
    if (this.index + 1 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const cmd = this.bytes[this.index + 1];
    switch (cmd) {
      // ESC @ — initialize printer. Reset style + alignment + codepage.
      case 0x40:
        this.index += 2;
        this.finalizePending();
        this.currentAlign = "left";
        this.currentStyle = defaultStyle();
        this.codepage = "cp437";
        break;
      // ESC d n — feed n lines
      case 0x64: {
        const n = this.readByte(2);
        if (n === null) return;
        this.index += 3;
        this.finalizePending();
        for (let i = 0; i < n; i++) {
          this.lines.push({ text: "", align: this.currentAlign, style: this.currentStyle });
        }
        break;
      }
      // ESC J n — feed n dots (treat as 1 blank line if n > 0)
      case 0x4a: {
        const n = this.readByte(2);
        if (n === null) return;
        this.index += 3;
        this.finalizePending();
        if (n > 0) {
          this.lines.push({ text: "", align: this.currentAlign, style: this.currentStyle });
        }
        break;
      }
      // ESC K n — feed n dots in reverse; skip 1 param
      case 0x4b:
        this.skipParams(2, 1);
        break;
      // ESC a n — justify. Some firmware sends ASCII '0'/'1'/'2' instead of
      // raw 0/1/2 — handle both.
      case 0x61: {
        const raw = this.readByte(2);
        if (raw === null) return;
        this.index += 3;
        const norm = raw >= 0x30 ? raw - 0x30 : raw;
        if (norm === 1) this.currentAlign = "center";
        else if (norm === 2) this.currentAlign = "right";
        else this.currentAlign = "left";
        break;
      }
      // ESC ! n — combined print mode (bitfield)
      case 0x21: {
        const n = this.readByte(2);
        if (n === null) return;
        this.index += 3;
        this.currentStyle = {
          ...this.currentStyle,
          fontB: (n & 0x01) !== 0,
          bold: (n & 0x08) !== 0,
          doubleHeight: (n & 0x10) !== 0,
          doubleWidth: (n & 0x20) !== 0,
          underline: (n & 0x80) !== 0,
          underlineThickness: (n & 0x80) !== 0 ? 1 : 0,
        };
        break;
      }
      // ESC E n — bold on/off
      case 0x45: {
        const n = this.readByte(2);
        if (n === null) return;
        this.index += 3;
        this.currentStyle = { ...this.currentStyle, bold: (n & 0x01) !== 0 };
        break;
      }
      // ESC G n — double-strike (treat as bold)
      case 0x47: {
        const n = this.readByte(2);
        if (n === null) return;
        this.index += 3;
        this.currentStyle = { ...this.currentStyle, bold: (n & 0x01) !== 0 };
        break;
      }
      // ESC - n — underline. 0=off, 1=1-dot, 2=2-dot.
      case 0x2d: {
        const raw = this.readByte(2);
        if (raw === null) return;
        this.index += 3;
        const norm = raw >= 0x30 ? raw - 0x30 : raw;
        this.currentStyle = {
          ...this.currentStyle,
          underlineThickness: norm,
          underline: norm !== 0,
        };
        break;
      }
      // ESC M n — font select. 0 = Font A, 1 = Font B.
      case 0x4d: {
        const raw = this.readByte(2);
        if (raw === null) return;
        this.index += 3;
        const norm = raw >= 0x30 ? raw - 0x30 : raw;
        this.currentStyle = { ...this.currentStyle, fontB: norm === 1 };
        break;
      }
      // ESC t n — codepage select. Epson n=0 -> CP437, n=19 -> CP858.
      case 0x74: {
        const n = this.readByte(2);
        if (n === null) return;
        this.index += 3;
        if (n === 0) this.codepage = "cp437";
        else if (n === 19) this.codepage = "cp858";
        else this.codepage = "fallback";
        break;
      }
      // ESC R n — international charset select. Skip param to stay synced.
      case 0x52:
        this.skipParams(2, 1);
        break;
      // ESC 2 — set default line spacing (no params)
      case 0x32:
        this.index += 2;
        break;
      // ESC 3 n — set line spacing to n dots (1 param)
      case 0x33:
        this.skipParams(2, 1);
        break;
      // ESC = n — peripheral select (1 param)
      case 0x3d:
        this.skipParams(2, 1);
        break;
      // ESC c <fn> n — panel button / sensor commands (3-byte prefix + 1 param)
      case 0x63:
        this.skipParams(3, 1);
        break;
      // ESC * m nL nH d1..dk — column-format bit-image graphics. m=0/1 is
      // 8 dots tall (1 byte/column), m=32/33 is 24 dots tall (3 bytes/
      // column, MSB-first, byte1=rows0-7/byte2=rows8-15/byte3=rows16-23).
      // Decoded per-invocation only — see the module doc comment for why
      // this deliberately does not stitch multiple ESC * bands together
      // into one taller composite logo.
      case 0x2a: {
        if (this.index + 4 >= this.bytes.length) {
          this.index = this.bytes.length;
          return;
        }
        const m = this.bytes[this.index + 2];
        const nL = this.bytes[this.index + 3];
        const nH = this.bytes[this.index + 4];
        const width = nL + nH * 256;
        const bytesPerColumn = m === 32 || m === 33 ? 3 : 1;
        const dataLen = width * bytesPerColumn;
        const dataStart = this.index + 5;
        const take = Math.min(5 + dataLen, this.bytes.length - this.index);
        if (
          !this.logo &&
          width > 0 &&
          (m === 0 || m === 1 || m === 32 || m === 33) &&
          this.bytes.length - dataStart >= dataLen
        ) {
          try {
            const heightPx = bytesPerColumn === 3 ? 24 : 8;
            const rowPacked = columnsToRowPackedBits(this.bytes, dataStart, width, heightPx, bytesPerColumn);
            const dataUri = encodeMonoPngDataUri({ width, height: heightPx, bits: rowPacked }, LOGO_FOREGROUND);
            if (dataUri) {
              this.logo = { widthPx: width, heightPx, dataUri, source: "ESC *" };
            }
          } catch {
            // Contract: never throw. A decode failure just means no logo.
          }
        }
        this.index += take;
        break;
      }
      // Unknown ESC command — skip the prefix only (2 bytes).
      default:
        this.index += 2;
    }
  }

  // ---- GS dispatch ----------------------------------------------------------

  handleGs(): void {
    // index points at 0x1D
    if (this.index + 1 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const cmd = this.bytes[this.index + 1];
    switch (cmd) {
      // GS ! n — character size (width/height multiplier nibbles)
      case 0x21: {
        const n = this.readByte(2);
        if (n === null) return;
        this.index += 3;
        const widthMult = (n >> 4) & 0x0f;
        const heightMult = n & 0x0f;
        this.currentStyle = {
          ...this.currentStyle,
          doubleWidth: widthMult >= 1,
          doubleHeight: heightMult >= 1,
        };
        break;
      }
      // GS V m [n] — cut paper. m=0,1 -> 3-byte form. m=65,66 -> 4-byte (n).
      case 0x56: {
        if (this.index + 2 >= this.bytes.length) {
          this.index = this.bytes.length;
          return;
        }
        const m = this.bytes[this.index + 2];
        if (m === 65 || m === 66) {
          const take = Math.min(4, this.bytes.length - this.index);
          this.index += take;
        } else {
          this.index += 3;
        }
        this.finalizePending();
        break;
      }
      // GS L nL nH — set left margin in dots (2-byte param)
      case 0x4c:
        this.skipParams(2, 2);
        break;
      // GS W nL nH — set print area width (2-byte param)
      case 0x57:
        this.skipParams(2, 2);
        break;
      // GS k — barcode (Function A or B)
      case 0x6b:
        this.handleBarcode();
        break;
      // GS ( k pL pH cn fn ... — extended barcode (QR), and also the
      // generic "GS ( <type>" resync-safe skip for other subtypes (e.g.
      // "L" raster graphics) — see handleGsParen, which also decodes
      // GS ( L <Function 112> raster-in-print-buffer logos and flags
      // <Function 69> NV-graphics-print references.
      case 0x28:
        this.handleGsParen();
        break;
      // GS 8 L — 4-byte-length variant of GS ( L, for graphics payloads
      // too large for GS ( L's 2-byte length field. Resync-safety only;
      // see the module doc comment for why this isn't decoded.
      case 0x38:
        this.handleGs8L();
        break;
      // GS v 0 m xL xH yL yH d1...dk — raster bit image. 8 header bytes:
      // 0x1D 0x76 0x30, then m, xL, xH, yL, yH (index+3..index+7). Bench-
      // verified real-world format (576x120-dot raster, 8,640 bytes,
      // byte-for-byte checked against the backend) — the primary logo path.
      case 0x76: {
        if (this.index + 2 >= this.bytes.length || this.bytes[this.index + 2] !== 0x30) {
          // Not the recognized GS v 0 form — skip prefix only.
          this.index += 2;
          return;
        }
        if (this.index + 7 >= this.bytes.length) {
          // Truncated mid-header (fewer than 8 bytes available) — no reliable
          // byte to resync on, so consume to EOF rather than risk re-parsing
          // whatever partial header bytes remain as text (matches Swift).
          this.index = this.bytes.length;
          return;
        }
        const xL = this.bytes[this.index + 4];
        const xH = this.bytes[this.index + 5];
        const yL = this.bytes[this.index + 6];
        const yH = this.bytes[this.index + 7];
        const widthBytes = xL + xH * 256;
        const heightRows = yL + yH * 256;
        const dataLen = widthBytes * heightRows;
        const dataStart = this.index + 8;
        const take = Math.min(8 + dataLen, this.bytes.length - this.index);
        // Only decode when the FULL declared bitmap is actually present —
        // a truncated raster (declared_len > available bytes) must not
        // throw or hang, and must not render a corrupted partial image.
        // The surrounding skip logic already clamps `take` to what's
        // available regardless, so parsing stays safe either way.
        if (!this.logo && widthBytes > 0 && heightRows > 0 && this.bytes.length - dataStart >= dataLen) {
          try {
            const bits = this.bytes.subarray(dataStart, dataStart + dataLen);
            const dataUri = encodeMonoPngDataUri(
              { width: widthBytes * 8, height: heightRows, bits },
              LOGO_FOREGROUND,
            );
            if (dataUri) {
              this.logo = { widthPx: widthBytes * 8, heightPx: heightRows, dataUri, source: "GS v 0" };
            }
          } catch {
            // Contract: never throw. A decode failure just means no logo.
          }
        }
        this.index += take;
        break;
      }
      // GS B n — reverse video (1 param, not modeled)
      case 0x42:
        this.skipParams(2, 1);
        break;
      // GS H n — HRI position (1 param)
      case 0x48:
        this.skipParams(2, 1);
        break;
      // GS f n — HRI font select (1 param)
      case 0x66:
        this.skipParams(2, 1);
        break;
      // GS h n — barcode height (1 param)
      case 0x68:
        this.skipParams(2, 1);
        break;
      // GS w n — barcode width (1 param)
      case 0x77:
        this.skipParams(2, 1);
        break;
      // GS r n — request status (1 param)
      case 0x72:
        this.skipParams(2, 1);
        break;
      // GS I n — printer info (1 param)
      case 0x49:
        this.skipParams(2, 1);
        break;
      // GS a n — automatic status back (1 param)
      case 0x61:
        this.skipParams(2, 1);
        break;
      // Unknown GS command — best-effort skip 2 bytes.
      default:
        this.index += 2;
    }
  }

  // ---- FS dispatch ----------------------------------------------------------

  handleFs(): void {
    if (this.index + 1 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const cmd = this.bytes[this.index + 1];
    switch (cmd) {
      // FS p n m — print downloaded NV bit image (2 params). References a
      // logo stored in the printer's own flash by index — the bitmap bytes
      // are not in this stream and cannot be recovered from a capture.
      case 0x70:
        this.nvLogoReferenced = true;
        this.skipParams(2, 2);
        break;
      // FS ! n — kanji print mode (1 param)
      case 0x21:
        this.skipParams(2, 1);
        break;
      // FS &, FS . — set/cancel kanji mode (no params)
      case 0x26:
      case 0x2e:
        this.index += 2;
        break;
      // FS C n — kanji codepage (1 param)
      case 0x43:
        this.skipParams(2, 1);
        break;
      // FS - n — kanji underline (1 param)
      case 0x2d:
        this.skipParams(2, 1);
        break;
      default:
        this.index += 2;
    }
  }

  // ---- Barcode helpers --------------------------------------------------------

  /**
   * GS k forms:
   *   Function A: GS k m d1...dk NUL  — m in [0..6], data null-terminated
   *   Function B: GS k m n d1...dn    — m in [65..73], n = explicit length
   */
  handleBarcode(): void {
    if (this.index + 2 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const m = this.bytes[this.index + 2];
    if (m >= 65) {
      // Function B — explicit length n at index+3
      if (this.index + 3 >= this.bytes.length) {
        this.index = this.bytes.length;
        return;
      }
      const n = this.bytes[this.index + 3];
      const take = Math.min(4 + n, this.bytes.length - this.index);
      this.index += take;
    } else {
      // Function A — null-terminated; scan forward.
      let scan = this.index + 3;
      while (scan < this.bytes.length && this.bytes[scan] !== 0x00) {
        scan += 1;
      }
      // Include the NUL itself if present.
      scan = Math.min(scan + 1, this.bytes.length);
      this.index = scan;
    }
  }

  /**
   * GS ( <type> pL pH m fn [params...] — the generic "extended" GS (
   * command family: QR codes (type 'k'), raster graphics (type 'L'), and
   * others. Total length = 5 (header incl. type byte) + (pL + pH*256) of
   * body (m + fn + params). Safely skipped for every subtype by construction
   * — decoding below is an optional bonus layered on top for type 'L'.
   *
   * Type 'L' (raster graphics, aka "GS ( L") functions relevant here:
   *   <Function 112> ('p') — store raster graphics data in the print
   *     buffer. Self-contained inline bitmap: `m` + `fn` + an 8-byte
   *     sub-header (tone, x-zoom, y-zoom, colors, widthL, widthH, heightL,
   *     heightH — width/height in PIXELS here, unlike GS v 0's byte-width)
   *     + row-packed 1bpp bitmap data. Decoded the same way as GS v 0.
   *     Cross-checked against python-escpos's `_image_send_graphics_data`/
   *     `image()` implementation; no corpus fixture exercises this path
   *     (verified only by a synthetic test), unlike GS v 0.
   *   <Function 69> ('E') — print NV graphics data by key code. No bitmap
   *     bytes in-stream at all — same "unrecoverable" case as `FS p`.
   *   <Function 67/68> ('C'/'D') — define/store NV graphics. Bitmap bytes
   *     ARE present, but this command provisions the printer's flash for a
   *     later <Function 69> print rather than printing the current job —
   *     deliberately left un-decoded (see module doc comment).
   */
  handleGsParen(): void {
    if (this.index + 4 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const type = this.bytes[this.index + 2];
    const pL = this.bytes[this.index + 3];
    const pH = this.bytes[this.index + 4];
    const payload = pL + pH * 256;
    const take = Math.min(5 + payload, this.bytes.length - this.index);

    if (type === 0x4c /* 'L' */ && this.index + 6 < this.bytes.length) {
      const fn = this.bytes[this.index + 6];
      if (fn === 0x45 /* 'E' = Function 69: print NV graphics */) {
        this.nvLogoReferenced = true;
      } else if (fn === 0x70 /* 'p' = Function 112: store raster in print buffer */ && !this.logo) {
        this.tryDecodeGsParenLRaster();
      }
    }

    this.index += take;
  }

  /**
   * Decode a `GS ( L` <Function 112> raster payload starting at
   * `this.index` (still pointing at 0x1D — this is a read-only lookahead,
   * called from handleGsParen before it advances `this.index`). Sets
   * `this.logo` on success; does nothing on any malformed/truncated input.
   */
  tryDecodeGsParenLRaster(): void {
    // Sub-header starts right after "1D 28 4C pL pH m fn" (7 bytes).
    const subStart = this.index + 7;
    if (this.bytes.length - subStart < 8) return;
    const widthPx = this.bytes[subStart + 4] + this.bytes[subStart + 5] * 256;
    const heightPx = this.bytes[subStart + 6] + this.bytes[subStart + 7] * 256;
    if (widthPx <= 0 || heightPx <= 0) return;
    const rowBytes = Math.ceil(widthPx / 8);
    const bmpStart = subStart + 8;
    const bmpLen = rowBytes * heightPx;
    if (this.bytes.length - bmpStart < bmpLen) return; // truncated — no logo, no throw
    try {
      const bits = this.bytes.subarray(bmpStart, bmpStart + bmpLen);
      const dataUri = encodeMonoPngDataUri({ width: widthPx, height: heightPx, bits }, LOGO_FOREGROUND);
      if (dataUri) {
        this.logo = { widthPx, heightPx, dataUri, source: "GS ( L" };
      }
    } catch {
      // Contract: never throw. A decode failure just means no logo.
    }
  }

  /**
   * GS 8 L pL pH pH2 pH3 m fn [data...] — the 4-byte-length variant of
   * GS ( L, for graphics payloads too large for a 2-byte length field.
   * Deliberately NOT decoded into an image (see module doc comment) — this
   * only computes the correct skip length so the parser resyncs safely
   * afterward instead of reinterpreting payload bytes as text, the same
   * failure class as the historical GS v 0 off-by-one bug.
   */
  handleGs8L(): void {
    if (this.index + 2 >= this.bytes.length || this.bytes[this.index + 2] !== 0x4c /* 'L' */) {
      // Not the recognized "GS 8 L" form — best-effort skip.
      this.index += 2;
      return;
    }
    if (this.index + 6 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const p1 = this.bytes[this.index + 3];
    const p2 = this.bytes[this.index + 4];
    const p3 = this.bytes[this.index + 5];
    const p4 = this.bytes[this.index + 6];
    const payload = p1 + p2 * 256 + p3 * 65536 + p4 * 16777216;
    const take = Math.min(7 + payload, this.bytes.length - this.index);
    this.index += take;
  }

  // ---- Param helpers --------------------------------------------------------

  /**
   * Read the byte at `index + offset`, returning null if the read would
   * overrun. On overrun, index is forwarded to EOF so the caller cannot
   * leave index un-advanced — otherwise a stream truncated mid-command
   * (e.g. `ESC E` with no parameter) would re-dispatch forever.
   */
  readByte(offset: number): number | null {
    const pos = this.index + offset;
    if (pos >= this.bytes.length) {
      this.index = this.bytes.length;
      return null;
    }
    return this.bytes[pos];
  }

  /**
   * Skip a fixed-length command with no semantic effect on output. `prefix`
   * is the number of bytes before the first parameter (typically 2: the
   * 0x1B/0x1D + cmd byte; 3 for ESC c <fn> commands).
   */
  skipParams(prefix: number, count: number): void {
    this.index = Math.min(this.index + prefix + count, this.bytes.length);
  }

  // ---- Line emission --------------------------------------------------------

  /**
   * Decode `currentText` through the active codepage and emit a
   * ReceiptLine — always, even when the buffer is empty. Use for real
   * line-feed commands (LF/CR) where a blank line is meaningful content.
   */
  flushLine(): void {
    let s = "";
    for (const b of this.currentText) {
      s += decodeByte(b, this.codepage);
    }
    this.currentText = [];
    this.lines.push({ text: s, align: this.currentAlign, style: this.currentStyle });
  }

  /**
   * Finalize any *pending* text into a line, but do NOT invent a blank line
   * when nothing is buffered. Use for commands that end a line as a side
   * effect rather than an explicit feed — init (ESC @), cut (GS V), form
   * feed, etc.
   */
  finalizePending(): void {
    if (this.currentText.length > 0) {
      this.flushLine();
    }
  }
}

/**
 * Transpose ESC * "column format" bit-image data (each byte-group is one
 * vertical column, MSB-first top-to-bottom) into row-major, MSB-first
 * packed bits — the layout `encodeMonoPngDataUri` (and GS v 0's native
 * wire format) expects. `bytesPerColumn` is 1 for 8-dot density (m=0/1) or
 * 3 for 24-dot density (m=32/33).
 */
function columnsToRowPackedBits(
  bytes: Uint8Array,
  offset: number,
  widthCols: number,
  heightRows: number,
  bytesPerColumn: number,
): Uint8Array {
  const rowBytes = Math.ceil(widthCols / 8);
  const out = new Uint8Array(rowBytes * heightRows);
  for (let c = 0; c < widthCols; c++) {
    for (let r = 0; r < heightRows; r++) {
      const srcByte = bytes[offset + c * bytesPerColumn + Math.floor(r / 8)];
      const bit = (srcByte >> (7 - (r % 8))) & 1;
      if (bit) {
        out[r * rowBytes + Math.floor(c / 8)] |= 1 << (7 - (c % 8));
      }
    }
  }
  return out;
}

/**
 * Parse an ESC/POS byte stream into a Receipt. Never throws on malformed
 * input — unknown commands are skipped with best-effort length consumption,
 * and decode failures emit the Unicode replacement character. The contract
 * is "render something, never crash." Logo decoding follows the same
 * contract — see the module doc comment.
 */
export function parseEscPos(bytes: Uint8Array): Receipt {
  const ctx = new ParserContext(bytes);
  ctx.run();
  return {
    header: [],
    lines: ctx.lines,
    footer: [],
    logo: ctx.logo,
    nvLogoReferenced: ctx.nvLogoReferenced,
  };
}

// ---------------------------------------------------------------------------
// Best-effort merchant-name guess for the page header. Mirrors (loosely) the
// App Clip's `firstHeaderLine` heuristic: pick the first non-empty, non-rule
// centered line under a modest length as a candidate business name. Purely
// cosmetic — the verbatim receipt body remains the source of truth.
// ---------------------------------------------------------------------------

export function guessMerchantName(lines: ReceiptLine[]): string | undefined {
  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;
    if (line.align !== "center") continue;
    if (text.length > 40) continue;
    // Skip separator/rule lines (---, ===, ***, etc.)
    if (/^[-=*_~. ]+$/.test(text)) continue;
    return text;
  }
  return undefined;
}
