// papex-receipt.js
//
// Self-contained vanilla-JS bundle of the PapeX RDH receipt pipeline.
//
// This file is a mechanical type-strip of two TypeScript sources, concatenated
// in dependency order and with the `export` keyword removed. Nothing else was
// changed — function bodies are statement-for-statement identical so a
// reviewer can diff against the originals and see only type removal:
//
//   PapeXWeb/lib/escpos.ts          -> "PART 1" below
//   PapeXWeb/lib/receiptSummary.ts  -> "PART 2" below
//
//
// Wrapped in an IIFE deliberately: this file declares ~30 top-level names
// (DATE_RE, isDivider, extractItems, ParserContext, ...). At browser script
// scope a `const` redeclaration from any other script on the page is a hard
// SyntaxError that kills both files. The wrapper makes that impossible.
//
(function () {
'use strict';
// receiptSummary.ts's sole import (`import type { ReceiptLine } from
// "./escpos"`) was type-only and vanishes at runtime, so no shim is needed.
//
// Public surface is re-exposed at the bottom as `PapeXReceipt`, for both
// CommonJS (`module.exports`) and browser (`window.PapeXReceipt`).

// ===========================================================================
// PART 1 — lib/escpos.ts
// ===========================================================================

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

function defaultStyle() {
  return {
    bold: false,
    underline: false,
    doubleHeight: false,
    doubleWidth: false,
    underlineThickness: 0,
    fontB: false,
  };
}

// ---------------------------------------------------------------------------
// Codepages — CP437 / CP858 high-byte (0x80-0xFF) -> Unicode code point maps.
// ASCII-identical below 0x80. Byte-for-byte match with Codepages.swift /
// receipt-print-hq/escpos-tools, per docs/rdh_orchestrator.md decision #4.
// ---------------------------------------------------------------------------

const CP437_HIGH = [
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

const CP858_HIGH = [
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

function decodeByte(byte, page) {
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
  bytes;
  index = 0;

  currentText = [];
  currentAlign = "left";
  currentStyle = defaultStyle();
  codepage = "cp437";

  lines = [];

  constructor(bytes) {
    this.bytes = bytes;
  }

  run() {
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
  handleDle() {
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

  handleEsc() {
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
      // ESC * m nL nH d1..dk — bit-image graphics.
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
        const take = Math.min(5 + dataLen, this.bytes.length - this.index);
        this.index += take;
        break;
      }
      // Unknown ESC command — skip the prefix only (2 bytes).
      default:
        this.index += 2;
    }
  }

  // ---- GS dispatch ----------------------------------------------------------

  handleGs() {
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
      // GS ( k pL pH cn fn ... — extended barcode (QR)
      case 0x28:
        this.handleGsParen();
        break;
      // GS v 0 m xL xH yL yH d1...dk — raster bit image. 8 header bytes:
      // 0x1D 0x76 0x30, then m, xL, xH, yL, yH (index+3..index+7).
      case 0x76: {
        if (this.index + 7 >= this.bytes.length || this.bytes[this.index + 2] !== 0x30) {
          this.index += 2;
          return;
        }
        const xL = this.bytes[this.index + 4];
        const xH = this.bytes[this.index + 5];
        const yL = this.bytes[this.index + 6];
        const yH = this.bytes[this.index + 7];
        const dataLen = (xL + xH * 256) * (yL + yH * 256);
        const take = Math.min(8 + dataLen, this.bytes.length - this.index);
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

  handleFs() {
    if (this.index + 1 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const cmd = this.bytes[this.index + 1];
    switch (cmd) {
      // FS p n m — print downloaded NV bit image (2 params)
      case 0x70:
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
  handleBarcode() {
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
   * GS ( k pL pH cn fn [params...] — QR code commands etc.
   * Total length = 5 (header) + (pL + pH*256) of body.
   */
  handleGsParen() {
    if (this.index + 4 >= this.bytes.length) {
      this.index = this.bytes.length;
      return;
    }
    const pL = this.bytes[this.index + 3];
    const pH = this.bytes[this.index + 4];
    const payload = pL + pH * 256;
    const take = Math.min(5 + payload, this.bytes.length - this.index);
    this.index += take;
  }

  // ---- Param helpers --------------------------------------------------------

  /**
   * Read the byte at `index + offset`, returning null if the read would
   * overrun. On overrun, index is forwarded to EOF so the caller cannot
   * leave index un-advanced — otherwise a stream truncated mid-command
   * (e.g. `ESC E` with no parameter) would re-dispatch forever.
   */
  readByte(offset) {
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
  skipParams(prefix, count) {
    this.index = Math.min(this.index + prefix + count, this.bytes.length);
  }

  // ---- Line emission --------------------------------------------------------

  /**
   * Decode `currentText` through the active codepage and emit a
   * ReceiptLine — always, even when the buffer is empty. Use for real
   * line-feed commands (LF/CR) where a blank line is meaningful content.
   */
  flushLine() {
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
  finalizePending() {
    if (this.currentText.length > 0) {
      this.flushLine();
    }
  }
}

/**
 * Parse an ESC/POS byte stream into a Receipt. Never throws on malformed
 * input — unknown commands are skipped with best-effort length consumption,
 * and decode failures emit the Unicode replacement character. The contract
 * is "render something, never crash."
 */
function parseEscPos(bytes) {
  const ctx = new ParserContext(bytes);
  ctx.run();
  return { header: [], lines: ctx.lines, footer: [] };
}

// ---------------------------------------------------------------------------
// Encoder — the inverse of the parser above, used only to synthesize a
// plausible raw byte stream for mock-mode receipts (lib/merchantMock.ts).
// Real receipts always come from the RDH device as actual ESC/POS bytes;
// this exists purely so `/merchant/tx/[sid]`'s "parse the raw bytes" code
// path (mirroring app/r) also has something to parse when
// NEXT_PUBLIC_MERCHANT_MOCK=1 and there's no backend to fetch bytes from.
// Only emits the handful of commands the parser above actually interprets
// (ESC @ / ESC a / ESC E / GS !) — enough to round-trip text + alignment +
// bold + double-height/width through parseEscPos, not a general-purpose
// ESC/POS encoder. ASCII only, matching the fixture vocabulary in
// merchantMock.ts.
// ---------------------------------------------------------------------------

function alignCode(align) {
  return align === "center" ? 1 : align === "right" ? 2 : 0;
}

function encodeEscPos(lines) {
  const out = [0x1b, 0x40]; // ESC @ — initialize
  let curAlign = "left";
  let curBold = false;
  let curDoubleWidth = false;
  let curDoubleHeight = false;

  for (const l of lines) {
    if (l.align !== curAlign) {
      out.push(0x1b, 0x61, alignCode(l.align)); // ESC a n
      curAlign = l.align;
    }
    if (l.style.doubleWidth !== curDoubleWidth || l.style.doubleHeight !== curDoubleHeight) {
      const n = ((l.style.doubleWidth ? 1 : 0) << 4) | (l.style.doubleHeight ? 1 : 0);
      out.push(0x1d, 0x21, n); // GS ! n
      curDoubleWidth = l.style.doubleWidth;
      curDoubleHeight = l.style.doubleHeight;
    }
    if (l.style.bold !== curBold) {
      out.push(0x1b, 0x45, l.style.bold ? 1 : 0); // ESC E n
      curBold = l.style.bold;
    }
    for (const ch of l.text) {
      const code = ch.codePointAt(0) ?? 0x3f;
      out.push(code < 0x80 ? code : 0x3f); // non-ASCII -> '?', fixtures are ASCII-only
    }
    out.push(0x0a); // LF
  }

  return new Uint8Array(out);
}

// ---------------------------------------------------------------------------
// Best-effort merchant-name guess for the page header. Mirrors (loosely) the
// App Clip's `firstHeaderLine` heuristic: pick the first non-empty, non-rule
// centered line under a modest length as a candidate business name. Purely
// cosmetic — the verbatim receipt body remains the source of truth.
// ---------------------------------------------------------------------------

function guessMerchantName(lines) {
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

// ===========================================================================
// PART 2 — lib/receiptSummary.ts
// ===========================================================================

// lib/receiptSummary.ts
//
// Best-effort structuring of a parsed `Receipt` (flat ESC/POS text lines,
// see lib/escpos.ts) into the fields the RDH web viewer's "designed" cards
// show: merchant, address, date, line items, totals, and payment method.
//
// This is a line-for-line port of the Swift heuristics at
// Papex_AppClip/Sources/AppClip/ReceiptSummary.swift, kept close to parity
// on purpose (see docs/rdh_orchestrator.md decision #4 — shared JSON
// intermediate schema / parity between clients). ESC/POS is freeform text,
// so every field here is optional, and the caller must degrade gracefully:
// when nothing structures, `hasStructure` is false and the page should fall
// back to the verbatim "Original receipt" monospace body (which
// `bodyLines` always preserves).
//
// The payment-method chip styling (detectPaymentMethod / extractLastFour /
// PAYMENT_METHOD_STYLES) is a separate port from
// PapeXV2/app/receiptDetail.tsx (~lines 50-101) — that file structures
// already-structured API data (a `paymentMethod` string field), whereas
// here we first have to *find* that string inside the flat line stream via
// `extractPayment` below, then run it through the same brand-detection
// table so the rendered chip is pixel-identical to the app.

/** True when enough structure was extracted to show designed cards instead of only the raw body. */
function hasStructure(summary) {
  return summary.merchantName != null || summary.total != null || summary.items.length > 0;
}

// ---------------------------------------------------------------------------
// Regex patterns — ported verbatim from ReceiptSummary.swift's `Patterns` enum.
// ---------------------------------------------------------------------------

/** Amount at end of line, optional $ and thousands separators, exactly 2 decimals. */
const TRAILING_MONEY_RE = /\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\s*$/;

/** A date somewhere in the line: "Jun 8, 2026", "06/08/2026", or "2026-06-08". */
const DATE_RE =
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}/i;

function isDivider(t) {
  const stripped = t.replace(/\s+/g, "");
  if (stripped.length < 3) return false;
  return /^[-=_*]+$/.test(stripped);
}

function looksLikeTotal(t) {
  const l = t.toLowerCase();
  return (
    l.includes("subtotal") ||
    l.includes("sub total") ||
    l.includes("total") ||
    l.includes("tax") ||
    l.includes("vat") ||
    l.includes("gst") ||
    l.includes("amount due") ||
    l.includes("balance") ||
    l.includes("change") ||
    l.includes("tip") ||
    l.includes("gratuity") ||
    l.includes("cash")
  );
}

const PAYMENT_BRAND_HINTS = [
  "visa",
  "mastercard",
  "master card",
  "amex",
  "american express",
  "discover",
  "debit",
  "credit",
  "apple pay",
  "google pay",
  "paypal",
  "venmo",
  "approved",
  "card ****",
  "xxxx",
  "****",
];

function looksLikePayment(t) {
  const l = t.toLowerCase();
  return PAYMENT_BRAND_HINTS.some((brand) => l.includes(brand));
}

function looksLikeOrderLine(t) {
  const l = t.toLowerCase();
  return (
    l.includes("order") ||
    l.includes("server") ||
    l.includes("table") ||
    l.includes("cashier") ||
    l.includes("receipt #") ||
    l.includes("invoice")
  );
}

/** A trailing monetary amount, e.g. "...  12.42" or "$1,234.50" -> number. */
function trailingAmount(t) {
  const match = t.match(TRAILING_MONEY_RE);
  if (!match) return undefined;
  const raw = match[0].replace(/\$/g, "").replace(/,/g, "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Everything before the trailing amount, trimmed; undefined if nothing remains. */
function leadingLabel(t) {
  const match = t.match(TRAILING_MONEY_RE);
  if (!match || match.index == null) return undefined;
  const label = t.slice(0, match.index).trim();
  return label.length === 0 ? undefined : label;
}

function endsWithAmount(t) {
  return trailingAmount(t) !== undefined;
}

// ---------------------------------------------------------------------------
// Merchant / address / date
// ---------------------------------------------------------------------------

function extractMerchant(lines) {
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].text.trim();
    if (!t) continue;
    if (isDivider(t)) continue;
    // Conventionally the merchant prints first, centered and/or large.
    // Accept the first non-empty, non-divider line that looks like a name
    // (has letters, isn't a total/price line).
    if (/[A-Za-z]/.test(t) && !looksLikeTotal(t) && !endsWithAmount(t)) {
      return { name: t, index: i };
    }
  }
  return {};
}

function extractAddress(lines, merchantIndex) {
  if (merchantIndex == null) return [];
  const out = [];
  let i = merchantIndex + 1;
  while (i < lines.length && out.length < 3) {
    const line = lines[i];
    const t = line.text.trim();
    i += 1;
    if (!t) break; // blank line ends the header block
    if (isDivider(t)) break;
    // Address/contact lines are centered, short, and not money rows.
    const centeredish = line.align === "center" || t.length <= 34;
    if (centeredish && !endsWithAmount(t) && !looksLikeTotal(t) && !looksLikeOrderLine(t)) {
      out.push(t);
    } else {
      break;
    }
  }
  return out;
}

function extractDateline(lines) {
  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;
    if (DATE_RE.test(t)) return t;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Totals — subtotal/tax/tip/discount/total via keyword + trailing-amount scan.
// The Swift version also had a "prefer parser-provided totals" fast path fed
// by ReceiptTotals off the sample receipt; the TS parser (lib/escpos.ts)
// doesn't carry a `totals` side-channel, so this always scans lines — which
// also correctly recovers the sample receipt's totals from its text.
// ---------------------------------------------------------------------------

function extractTotals(lines) {
  let subtotal;
  let tax;
  let tip;
  let discount;
  let total;

  for (const line of lines) {
    const t = line.text.trim();
    const amount = trailingAmount(t);
    if (amount === undefined) continue;
    const lower = t.toLowerCase();
    if (lower.includes("subtotal") || lower.includes("sub total")) {
      subtotal = amount;
    } else if (lower.includes("tax") || lower.includes("vat") || lower.includes("gst")) {
      tax = amount;
    } else if (lower.includes("tip") || lower.includes("gratuity")) {
      tip = amount;
    } else if (lower.includes("discount") || lower.includes("rebate")) {
      discount = amount;
    } else if (lower.includes("total") || lower.includes("amount due") || lower.includes("balance due")) {
      total = amount; // last wins -> grand total beats interim totals
    }
  }
  return { subtotal, tax, tip, discount, total };
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

/** "1  Cortado" -> { qty: 1, name: "Cortado" }. No leading integer -> qty 1, name = label. */
function splitQtyAndName(label) {
  const match = label.match(/^(\d+)\s+(.+)$/);
  if (match) {
    const qty = Number(match[1]);
    if (Number.isFinite(qty) && qty > 0) {
      return { qty, name: match[2].trim() };
    }
  }
  return { qty: 1, name: label };
}

function extractItems(lines) {
  const out = [];
  for (const line of lines) {
    const t = line.text.trim();
    if (!t || isDivider(t)) continue;
    if (looksLikeTotal(t) || looksLikePayment(t)) continue;
    const amount = trailingAmount(t);
    if (amount === undefined) continue;
    const label = leadingLabel(t);
    if (!label || !/[A-Za-z]/.test(label)) continue;
    const { qty, name } = splitQtyAndName(label);
    out.push({ label, name, qty, amount });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

function extractPaymentLine(lines) {
  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;
    if (looksLikePayment(t)) return t;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Summarize entry point
// ---------------------------------------------------------------------------

function summarizeReceipt(lines) {
  const merchant = extractMerchant(lines);
  const dateline = extractDateline(lines);
  // A bare date line (e.g. right under the merchant, no blank-line separator)
  // can also satisfy extractAddress's "short/centered, not money/total" test.
  // Once it's been consumed as the formatted dateline, drop it from
  // addressLines so it isn't rendered twice.
  const addressLines = extractAddress(lines, merchant.index).filter((t) => t !== dateline);
  const totals = extractTotals(lines);
  const items = extractItems(lines);
  const paymentLine = extractPaymentLine(lines);

  return {
    merchantName: merchant.name,
    addressLines,
    dateline,
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    tip: totals.tip,
    discount: totals.discount,
    total: totals.total,
    paymentLine,
    bodyLines: lines,
  };
}

// ---------------------------------------------------------------------------
// Payment-method chip detection — ported from
// PapeXV2/app/receiptDetail.tsx detectPaymentMethod/extractLastFour/
// PAYMENT_METHOD_STYLES (~lines 50-101), operating on `paymentLine` above
// instead of an API-provided `paymentMethod` field.
// ---------------------------------------------------------------------------

function detectPaymentMethod(paymentMethod) {
  if (!paymentMethod) return null;
  const lower = paymentMethod.toLowerCase();
  if (lower.includes("apple pay")) return "apple_pay";
  if (lower.includes("google pay") || lower.includes("gpay")) return "google_pay";
  if (lower.includes("paypal")) return "paypal";
  if (lower.includes("venmo")) return "venmo";
  if (lower.includes("cash app") || lower.includes("cashapp")) return "cash_app";
  if (lower.includes("ebt") || lower.includes("food stamp")) return "ebt";
  if (lower.includes("check") || lower.includes("cheque")) return "check";
  if (lower === "cash" || lower.includes(" cash ")) return "cash";
  if (lower.includes("visa")) return "visa";
  if (lower.includes("mastercard") || lower.includes("master card")) return "mastercard";
  if (lower.includes("amex") || lower.includes("american express")) return "amex";
  if (lower.includes("discover")) return "discover";
  if (lower.includes("diners club") || lower.includes("diners")) return "diners_club";
  if (lower.includes("jcb")) return "jcb";
  if (lower.includes("unionpay") || lower.includes("china unionpay")) return "unionpay";
  if (lower.includes("maestro")) return "maestro";
  return null;
}

const PAYMENT_METHOD_STYLES = {
  visa: { bg: "#1A1F71", label: "VISA", textColor: "#FFFFFF" },
  mastercard: { bg: "#EB001B", label: "MASTERCARD", textColor: "#FFFFFF" },
  amex: { bg: "#007BC1", label: "AMEX", textColor: "#FFFFFF" },
  discover: { bg: "#F9A021", label: "DISCOVER", textColor: "#FFFFFF" },
  diners_club: { bg: "#0069AA", label: "DINERS", textColor: "#FFFFFF" },
  jcb: { bg: "#0F4C81", label: "JCB", textColor: "#FFFFFF" },
  unionpay: { bg: "#D22630", label: "UNIONPAY", textColor: "#FFFFFF" },
  maestro: { bg: "#0099DF", label: "MAESTRO", textColor: "#FFFFFF" },
  apple_pay: { bg: "#000000", label: "APPLE PAY", textColor: "#FFFFFF" },
  google_pay: { bg: "#4285F4", label: "G PAY", textColor: "#FFFFFF" },
  paypal: { bg: "#003087", label: "PAYPAL", textColor: "#FFFFFF" },
  venmo: { bg: "#008CFF", label: "VENMO", textColor: "#FFFFFF" },
  cash_app: { bg: "#00D632", label: "CASH APP", textColor: "#FFFFFF" },
  cash: { bg: "#22C55E", label: "CASH", textColor: "#FFFFFF" },
  ebt: { bg: "#4CAF50", label: "EBT", textColor: "#FFFFFF" },
  check: { bg: "#6B7280", label: "CHECK", textColor: "#FFFFFF" },
};

function extractLastFour(paymentMethod) {
  if (!paymentMethod) return null;
  const match =
    paymentMethod.match(/ending\s+in\s+(\d{4})/i) ||
    paymentMethod.match(/\*{3,}(\d{4})/) ||
    paymentMethod.match(/(\d{4})$/);
  return match ? match[1] : null;
}

// ===========================================================================
// Module footer — CommonJS + browser global.
// ===========================================================================

const PapeXReceipt = { parseEscPos, encodeEscPos, guessMerchantName, defaultStyle, summarizeReceipt, hasStructure, trailingAmount, leadingLabel, detectPaymentMethod, extractLastFour, PAYMENT_METHOD_STYLES };
if (typeof module !== 'undefined' && module.exports) module.exports = PapeXReceipt;
if (typeof window !== 'undefined') window.PapeXReceipt = PapeXReceipt;

})();
