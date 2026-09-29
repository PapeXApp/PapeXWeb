/**
 * The shape of a drawn receipt row (appui ReceiptRow, used by the hero), plus
 * the invented person and group every "shared" mockup names. (The old sample
 * row lists — LIST_ROWS, SEARCH_ROWS, ADD_ROWS, STORE_TILES — and
 * DETAIL_RECEIPT went unrendered once the app kit drew the screens, and were
 * deleted in P5.)
 *
 * Every field maps onto something PapeXV2's `components/ui/ReceiptRow.tsx`
 * actually renders — see docs/design/app-reference.md ("Receipt row"):
 *   - `date` + `category` are the meta line (`r.dateLabel • r.category`),
 *     `formatReceiptDate` = "Sep 22" (services/receiptDisplay.ts:104);
 *   - `source` is the provenance line built by `buildReceiptOriginSummary`
 *     (services/receiptOrigin.ts): "Tapped by you" for an RDH tap, "Scanned by
 *     you • <group>", "Email by you", "Shared by <name> in <group>";
 *   - `glyph` + `tone` are the 28pt origin ring (`getReceiptSourceIconName`):
 *     RDH/scan -> scan, email -> mail, shared-in -> people, shared-out -> share;
 *     the ring is blue only for a receipt YOU shared out.
 *
 * Logo colours are invented brand-ish hues behind a monogram — never a real
 * merchant mark (Nico's rule for the site).
 *
 * INVENTED PEOPLE AND GROUPS TOO (Web 2.1): no real person, group or merchant
 * appears in a mockup. The one sharer is "Jordan Reyes" and the one group is
 * "Housemates", used consistently across the screens.
 */

/** The invented person every "shared" mockup names. */
export const DEMO_PERSON = "Jordan Reyes";
/** The invented shared group every mockup names. */
export const DEMO_GROUP = "Housemates";

export type OriginGlyph = "scan" | "mail" | "people" | "share";

/** own = grey ring + white glyph; sharedOut = #7FC4EC ring + glyph;
 *  sharedIn = grey ring, "Shared by" prefix in #7FC4EC (ReceiptRow.tsx). */
export type OriginTone = "own" | "sharedOut" | "sharedIn";

export interface ListRow {
  /** Stable React key (merchants repeat in a search result). */
  id: string;
  merchant: string;
  initial: string;
  amount: string;
  /** Section header above the row: "Today", "Yesterday" or "September 22, 2026". */
  group: string;
  /** The row's own short date, e.g. "Sep 22". */
  date: string;
  category?: string;
  /** Provenance line. When `sharedBy` is set the line starts "Shared by". */
  source: string;
  sharedBy?: boolean;
  glyph: OriginGlyph;
  tone: OriginTone;
  logoBg: string;
  unreviewed?: boolean;
}
