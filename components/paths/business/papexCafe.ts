import { demoReceipts, demoStore, demoStores, type KitReceipt, type KitStore } from "@/components/app-kit"
import { demoReceiptBytes } from "../customer/demoReceipt"

/**
 * The ONE invented store every /business demo uses: "PapeX Cafe" (Nico
 * 2026-09-29; a web search found no real store by that name).
 *
 * The shared demo data (customer/demoReceipt.ts, app-kit/sampleData.ts) still
 * names the same shop "Tidewick Cafe" because /customers deliberately shows
 * it among several shopper stores, and those files are not ours to edit. So
 * the business side re-labels a COPY here and never touches the originals:
 * the receipt bytes are re-headed, and the store/receipts are cloned with a
 * new name and a "P" logo. Brand colours are kept.
 *
 * Display rules: title case "PapeX Cafe" (capital X), ticket header
 * "PAPEX CAFE", logo initial "P".
 */

export const CAFE_NAME = "PapeX Cafe"
const CAFE_HEADER = "PAPEX CAFE"

/** The /customers demo ticket with its header swapped to PAPEX CAFE. Same
 *  ESC/POS stream otherwise, so it still decodes through lib/escpos.ts. */
export function papexCafeReceiptBytes(): Uint8Array {
  const src = demoReceiptBytes()
  const text = Array.from(src, (b) => String.fromCharCode(b)).join("")
  // The header swap is same-length; the card line is the paper-receipt form
  // "Card ************4242" (still inside the 32-column ticket). No real card brand on
  // a demo receipt (Nico, 2026-09-29: "make sure those are not real receipts").
  const out = text.replace("TIDEWICK CAFE", CAFE_HEADER).replace("VISA  ****4729", "Card ************4242")
  return Uint8Array.from(out, (c) => c.charCodeAt(0) & 0xff)
}

/** The kit's monogram logo (a letter on a brand-colour disc), as an SVG data URI. */
function monogram(letter: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${bg}"/><text x="40" y="53" font-family="Georgia,serif" font-size="40" font-weight="700" text-anchor="middle" fill="#FFFFFF">${letter}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SHARED = demoStores[0]

/** The shared shop, renamed. Same id (the shared coupon points at it) and colours. */
export const cafeStore: KitStore = {
  ...SHARED,
  name: CAFE_NAME,
  logoUrl: monogram("P", SHARED.brandColor ?? "#6B3E26"),
  loyalty: SHARED.loyalty ? { ...SHARED.loyalty, programName: "PapeX Rewards" } : undefined,
}

/** demoStore(), with the shared shop swapped for its PapeX Cafe copy. */
export const cafeStoreFor = (id: string): KitStore => (id === cafeStore.id ? cafeStore : demoStore(id))

/** One demo receipt, re-labelled when it is the shared shop's. */
export const cafeReceipt = (r: KitReceipt): KitReceipt =>
  r.merchantName === SHARED.name ? { ...r, merchantName: CAFE_NAME, logoUrl: cafeStore.logoUrl ?? null } : r

/** The kit's demo receipts with the shared shop's re-labelled. */
export const cafeDemoReceipts: KitReceipt[] = demoReceipts.map(cafeReceipt)
