import { cn } from "@/lib/utils";
import { Chevron, type TabKey } from "./Chrome";
import type { ListRow, OriginGlyph } from "./data";
import s from "./appui.module.css";

/*
 * Rebuilt 2026-09-23 from PapeXV2's CODE, not from captures — see
 * docs/design/app-reference.md, which cites the source file for every number
 * used here. Structure and geometry follow the app; the web keeps its own
 * rendering of the glass (backdrop-filter + a masked corner-lit ring).
 *
 * Positions are absolute iPhone points on a 393 x 852 screen (`--u` = 1pt):
 * header bubbles start at y = 57 (`headerBubbleTop(59)`), the FAB sits 16pt
 * from the right edge and 89pt from the bottom (34 inset + 49 bar + 6 gap).
 * A phone that is cropped shows exactly this layout, cut — nothing is moved
 * to meet a crop line.
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Circular merchant logo. List rows: 40pt with a 1.5pt ORANGE ring in both
 * modes (ReceiptRow.tsx `logoWrap`), faded to .65 while unreviewed, with the
 * 10pt orange dot (white 1.5pt ring) at its bottom-right. Detail: 48pt on a
 * white canvas with a 2pt orange ring (receiptDetail.tsx `storeIcon`).
 */
export function MerchantLogo({
  initial,
  bg,
  detail = false,
  unreviewed = false,
}: {
  initial: string;
  bg: string;
  detail?: boolean;
  unreviewed?: boolean;
}) {
  return (
    <span className={cn(s.logoWrap, detail && s.logoWrapDetail)} aria-hidden="true">
      <span className={cn(s.logo, unreviewed && s.logoFaded)} style={detail ? undefined : { background: bg }}>
        {detail ? <span className={s.logoMono} style={{ background: bg }}>{initial}</span> : initial}
      </span>
      {unreviewed ? <span className={s.logoDot} /> : null}
    </span>
  );
}

/** The 14pt glyph inside the 28pt origin ring (AppIcon names in the app). */
function OriginGlyphIcon({ glyph }: { glyph: OriginGlyph }) {
  return (
    <svg viewBox="0 0 24 24" className={s.originGlyph} aria-hidden="true">
      {glyph === "share" && (
        <>
          <path {...stroke} d="M12 3.6v11" />
          <path {...stroke} d="m8.4 7.2 3.6-3.6 3.6 3.6" />
          <path {...stroke} d="M6 12.4v6.6a1.4 1.4 0 0 0 1.4 1.4h9.2a1.4 1.4 0 0 0 1.4-1.4v-6.6" />
        </>
      )}
      {glyph === "mail" && (
        <>
          <rect {...stroke} x="3.4" y="6" width="17.2" height="12" rx="2.4" />
          <path {...stroke} d="m4.4 7.6 7.6 5.4 7.6-5.4" />
        </>
      )}
      {glyph === "people" && (
        <>
          <circle {...stroke} cx="9.6" cy="9.2" r="2.8" />
          <path {...stroke} d="M4.4 19a5.2 5.2 0 0 1 10.4 0" />
          <path {...stroke} d="M16 7.2a2.6 2.6 0 0 1 0 5M17.6 18.6h2.4" />
        </>
      )}
      {glyph === "scan" && (
        <>
          <path {...stroke} d="M4 8.4V6a2 2 0 0 1 2-2h2.4M15.6 4H18a2 2 0 0 1 2 2v2.4M20 15.6V18a2 2 0 0 1-2 2h-2.4M8.4 20H6a2 2 0 0 1-2-2v-2.4" />
          <path {...stroke} d="M7.6 12h8.8" />
        </>
      )}
    </svg>
  );
}

/**
 * One receipt card, laid out as ReceiptRow.tsx lays it out:
 *   [logo 40] [merchant 16 / "Sep 22 • Dining" 13 / provenance 12] [amount 16 / ring 28 + ‹]
 * The rim is ALWAYS the top-left arc (`rim="topLeft"`) — white on a reviewed
 * receipt, orange on an unreviewed one; only the colour changes.
 */
export function ReceiptRow({ row }: { row: ListRow }) {
  return (
    <div className={cn(s.row, row.unreviewed && s.rowNew)}>
      <MerchantLogo initial={row.initial} bg={row.logoBg} unreviewed={row.unreviewed} />
      <span className={s.rowText}>
        <span className={s.merchant}>{row.merchant}</span>
        <span className={s.rowMeta}>
          {row.date}
          {row.category ? ` • ${row.category}` : ""}
        </span>
        <span className={s.rowSource}>
          {row.sharedBy ? <span className={s.rowSourceBlue}>Shared by</span> : null}
          {row.source}
        </span>
      </span>
      <span className={s.rowRight}>
        <span className={s.amount}>{row.amount}</span>
        <span className={s.originRow}>
          <span className={cn(s.originRing, row.tone === "sharedOut" && s.originRingShared)}>
            <OriginGlyphIcon glyph={row.glyph} />
          </span>
          {/* The expand-items chevron points LEFT at rest (ReceiptRow.tsx
              `chevronMirror`), which is Chrome's back-facing chevron. */}
          <span className={s.expandBtn}>
            <Chevron back />
          </span>
        </span>
      </span>
    </div>
  );
}

/* The Receipts tab and the receipt detail screen that used to live here
   (ReceiptsScreen / ReceiptDetailScreen) were never rendered once the app
   kit took over (components/app-kit) and were deleted in P5. */

export type { TabKey };
