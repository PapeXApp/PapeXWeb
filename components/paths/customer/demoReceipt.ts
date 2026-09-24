// The hero demo's INPUT bytes only — a genuine ESC/POS ticket for the fictional
// "Nook Cafe" (renamed from the prototype's "Bluebird Coffee" on 2026-09-22 —
// that name wrapped to two lines in the phone mockups), otherwise byte-for-byte
// the same stream the design prototype scripted
// (design-prototype/source/PapeX Home.dc.html → demoReceiptBytes()). Decoding is
// never re-implemented here: NfcPhone.tsx feeds this straight into this repo's
// own lib/escpos.ts (`parseEscPos`) and lib/receiptSummary.ts (`summarizeReceipt`),
// same as the App Clip's real receipt path.
export function demoReceiptBytes(): Uint8Array {
  const out: number[] = [];
  const txt = (s: string) => {
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xff);
  };
  const line = (s: string) => {
    txt(s);
    out.push(0x0a);
  };

  out.push(0x1b, 0x40); // ESC @    initialise
  out.push(0x1b, 0x61, 0x01); // ESC a 1  centre
  out.push(0x1b, 0x21, 0x30); // ESC ! 48 double height + double width
  line("NOOK CAFE");
  out.push(0x1b, 0x21, 0x00); // ESC ! 0  back to normal
  line("412 Walnut St");
  line("Syracuse, NY 13202");
  line("(315) 555-0142");
  out.push(0x0a);
  out.push(0x1b, 0x61, 0x00); // ESC a 0  left
  line("Order #1042   Jun 8, 2026  10:24 AM");
  line("Server: Maya");
  line("--------------------------------");
  line("1  Cortado                  4.25");
  line("1  Oat milk add-on          0.75");
  line("1  Almond croissant         4.50");
  line("1  Sparkling water          2.00");
  line("--------------------------------");
  line("Subtotal                   11.50");
  line("Tax (8%)                    0.92");
  out.push(0x1b, 0x45, 0x01); // ESC E 1  bold on
  line("TOTAL                      12.42");
  out.push(0x1b, 0x45, 0x00); // ESC E 0  bold off
  out.push(0x0a);
  line("VISA  ****4729   APPROVED");
  out.push(0x0a);
  out.push(0x1b, 0x61, 0x01); // ESC a 1  centre
  line("Thanks for stopping in!");
  line("nookcafe.com");
  out.push(0x1d, 0x56, 0x00); // GS V 0   cut

  return new Uint8Array(out);
}
