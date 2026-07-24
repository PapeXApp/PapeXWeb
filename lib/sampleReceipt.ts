// lib/sampleReceipt.ts
//
// Placeholder receipt shown when the RDH web viewer has no real receipt to
// display (no `sid` query param, an invalid one, or a 404 from the backend).
// Direct port of `Receipt.sample` at
// Papex_AppClip/Sources/ESCPOSParser/Receipt.swift (~lines 106-139) so the
// web fallback and the App Clip show byte-identical sample content.
//
// Expressed directly as already-decoded `ReceiptLine[]` (skipping a
// round-trip through fabricated ESC/POS bytes) and run through the same
// `summarizeReceipt` heuristics as a real parsed receipt, so this exercises
// the exact rendering path production receipts use.

import { defaultStyle, type ReceiptLine, type Style } from "./escpos";

const bigBold: Style = { ...defaultStyle(), bold: true, doubleHeight: true, doubleWidth: true };
const bold: Style = { ...defaultStyle(), bold: true };
const plain: Style = defaultStyle();

function line(text: string, align: ReceiptLine["align"] = "left", style: Style = plain): ReceiptLine {
  return { text, align, style };
}

export const sampleReceiptLines: ReceiptLine[] = [
  line("BLUEBIRD COFFEE", "center", bigBold),
  line("412 Walnut St", "center", plain),
  line("Syracuse, NY 13202", "center", plain),
  line("(315) 555-0142", "center", plain),
  line(""),
  line("Order #1042   Jun 8, 2026  10:24 AM"),
  line("Server: Maya"),
  line("--------------------------------"),
  line("1  Cortado                  4.25"),
  line("1  Oat milk add-on          0.75"),
  line("1  Almond croissant         4.50"),
  line("1  Sparkling water          2.00"),
  line("--------------------------------"),
  line("Subtotal                   11.50"),
  line("Tax (8%)                    0.92"),
  line("TOTAL                      12.42", "left", bold),
  line(""),
  line("VISA  ****4729   APPROVED"),
  line(""),
  line("Thanks for stopping in!", "center", plain),
  line("bluebird.coffee", "center", plain),
];
