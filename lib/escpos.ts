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

export interface Receipt {
  header: ReceiptLine[];
  lines: ReceiptLine[];
  footer: ReceiptLine[];
}

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
      // GS ( k pL pH cn fn ... — extended barcode (QR)
      case 0x28:
        this.handleGsParen();
        break;
      // GS v 0 m xL xH yL yH d1...dk — raster bit image
      case 0x76: {
        if (this.index + 6 >= this.bytes.length || this.bytes[this.index + 2] !== 0x30) {
          this.index += 2;
          return;
        }
        const xL = this.bytes[this.index + 3];
        const xH = this.bytes[this.index + 4];
        const yL = this.bytes[this.index + 5];
        const yH = this.bytes[this.index + 6];
        const dataLen = (xL + xH * 256) * (yL + yH * 256);
        const take = Math.min(7 + dataLen, this.bytes.length - this.index);
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
   * GS ( k pL pH cn fn [params...] — QR code commands etc.
   * Total length = 5 (header) + (pL + pH*256) of body.
   */
  handleGsParen(): void {
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
 * Parse an ESC/POS byte stream into a Receipt. Never throws on malformed
 * input — unknown commands are skipped with best-effort length consumption,
 * and decode failures emit the Unicode replacement character. The contract
 * is "render something, never crash."
 */
export function parseEscPos(bytes: Uint8Array): Receipt {
  const ctx = new ParserContext(bytes);
  ctx.run();
  return { header: [], lines: ctx.lines, footer: [] };
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
