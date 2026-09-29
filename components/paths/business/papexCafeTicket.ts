import { demoReceiptBytes } from "../customer/demoReceipt"

/**
 * The PapeX Cafe ticket bytes (pure: no React, no app-kit), so the swaps below
 * can be unit-tested (lib/papexCafeTicket.test.ts). papexCafe.ts re-exports it.
 *
 * It re-labels a COPY of the /customers demo ticket (customer/demoReceipt.ts,
 * "Tidewick Cafe") and never touches the original. The card swap is
 * same-length, so the card line stays exactly 32 columns (the header is a
 * centred double-width line, so its length is free). Each swap MUST match:
 * a `.replace()` whose pattern has drifted from the
 * source text is a silent no-op (it once was — the source moved to
 * "Card ************4729" while this still looked for "VISA  ****4729").
 */

/** Header swap: "TIDEWICK CAFE" -> "PAPEX CAFE". */
export const TICKET_HEADER_FROM = "TIDEWICK CAFE"
export const TICKET_HEADER_TO = "PAPEX CAFE"
/** Card swap: the paper-receipt form, 12 stars + last 4, never a brand
 *  (Nico, 2026-09-29). The PapeX Cafe demo card ends in 4242 everywhere. */
export const TICKET_CARD_FROM = "Card ************4729"
export const TICKET_CARD_TO = "Card ************4242"

/** Replace exactly one occurrence; a missing pattern throws outside
 *  production (dev + tests) and is logged in production. */
export function replaceOnce(text: string, from: string, to: string): string {
  const at = text.indexOf(from)
  if (at === -1) {
    const msg = `papexCafeTicket: "${from}" is no longer in the demo ticket — update the swap to match customer/demoReceipt.ts`
    if (process.env.NODE_ENV !== "production") throw new Error(msg)
    console.error(msg)
    return text
  }
  return text.slice(0, at) + to + text.slice(at + from.length)
}

/** The /customers demo ticket with its header swapped to PAPEX CAFE and its
 *  card to Card ************4242. Same ESC/POS stream otherwise, so it still
 *  decodes through lib/escpos.ts. */
export function papexCafeReceiptBytes(): Uint8Array {
  const src = demoReceiptBytes()
  const text = Array.from(src, (b) => String.fromCharCode(b)).join("")
  const out = replaceOnce(
    replaceOnce(text, TICKET_HEADER_FROM, TICKET_HEADER_TO),
    TICKET_CARD_FROM,
    TICKET_CARD_TO,
  )
  return Uint8Array.from(out, (c) => c.charCodeAt(0) & 0xff)
}
