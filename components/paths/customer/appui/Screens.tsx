import { cn } from "@/lib/utils";
import { Chevron, Fab, StatusBar, TabBar, type TabKey } from "./Chrome";
import { DETAIL_RECEIPT, LIST_ROWS, type ListRow, type OriginGlyph } from "./data";
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.searchIcon} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="10.6" cy="10.6" r="6.4" />
      <path d="m15.4 15.4 4.2 4.2" />
    </svg>
  );
}

/** `close-circle` (filled) — the field's clear button, shown once it has text. */
function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.searchIcon} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="#00121d" strokeWidth={1.9} strokeLinecap="round" />
    </svg>
  );
}

/** The organize/category circle's `filter` glyph (24pt in a 44pt circle). */
function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.circleGlyph} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 7.2h16M4 12h16M4 16.8h16" />
      <circle cx="9" cy="7.2" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16.8" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * The Receipts tab (app/(tabs)/receipts.tsx), top to bottom:
 *   1. pinned title row  [ Select ]  [ Receipts / N unreviewed ]  [ organize ○ ]
 *   2. pinned search field, full width, 12pt under the title row
 *   3. the list, 16pt under the search field, grouped by date
 *   4. the orange FAB, bottom-right above the tab bar (FloatingFAB.tsx)
 *   5. the system tab bar, Receipts selected
 *
 * `query` renders a SETTLED search: the text is in the field with its clear
 * button, the keyboard is down and the suggestions dropdown closed — the
 * state after a hard swipe (receipts.tsx `isIntenseSwipe` -> Keyboard.dismiss
 * + setSuggestionsDismissed). A blinking caret would need a keyboard on
 * screen, so there is none. Pass matching `rows`: search filters the list.
 *
 * The "N unreviewed" line counts the unreviewed receipts IN THE LIST ON
 * SCREEN — receipts.tsx:3021 filters `sortedReceipts`, i.e. after search —
 * so it is derived from `rows` unless a caller is drawing a longer list than
 * it passes (`unreviewed`). With none, the title bubble is one line.
 *
 * `tabBar={false}` exists only for a screen that is NOT a tab root; the
 * Receipts tab always has its bar, and a cropped phone simply crops it.
 */
export function ReceiptsScreen({
  query,
  rows = LIST_ROWS,
  unreviewed,
  tabBar = true,
}: {
  query?: string;
  rows?: ListRow[];
  unreviewed?: number;
  tabBar?: boolean;
}) {
  const unreviewedCount = unreviewed ?? rows.filter((row) => row.unreviewed).length;
  const groups: { group: string; rows: ListRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.group === row.group) last.rows.push(row);
    else groups.push({ group: row.group, rows: [row] });
  }

  return (
    <div className={cn(s.screen, unreviewedCount === 0 && s.titleOneLine)}>
      <div className={s.ground} aria-hidden="true" />
      <StatusBar />

      <div className={s.listScroll}>
        {groups.map((g) => (
          <div key={g.group} className={s.listGroup}>
            <div className={s.groupLabel}>{g.group}</div>
            {g.rows.map((row) => (
              <ReceiptRow key={row.id} row={row} />
            ))}
          </div>
        ))}
      </div>

      <div className={s.headerRow}>
        <span className={s.headerSide}>
          <span className={s.selectPill} aria-hidden="true">
            Select
          </span>
        </span>
        <div className={s.headerPill}>
          <span className={s.headerTitle}>Receipts</span>
          {unreviewedCount > 0 ? (
            <span className={s.headerSub}>
              <span className={s.headerCount}>{unreviewedCount}</span> unreviewed
            </span>
          ) : null}
        </div>
        <span className={cn(s.headerSide, s.headerSideEnd)}>
          <span className={s.circleBtn} aria-hidden="true">
            <FilterIcon />
          </span>
        </span>
      </div>

      <div className={s.searchRow}>
        <div className={cn(s.search, query && s.searchTyped)}>
          <SearchIcon />
          <span className={s.searchText}>{query ?? "Search receipts..."}</span>
          {query ? <ClearIcon /> : null}
        </div>
      </div>

      <Fab />
      {tabBar ? <TabBar active="receipts" /> : null}
    </div>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.fieldGlyph} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" aria-hidden="true">
      <path d="M11.4 3.4H20v8.6l-8.8 8.8-8.6-8.6z" />
      <circle cx="16.2" cy="7.6" r="1.3" />
    </svg>
  );
}

/** `people` — outline while the receipt is in no group; FILLED and orange
 *  (`colors.primary`) once it is (receiptDetail.tsx sharingTriggerContent). */
function PeopleIcon({ on = false }: { on?: boolean }) {
  if (on) {
    return (
      <svg viewBox="0 0 24 24" className={cn(s.fieldGlyph, s.fieldGlyphOn)} aria-hidden="true">
        <circle cx="9.4" cy="8.6" r="3.4" fill="currentColor" />
        <path d="M3.2 19.6a6.2 6.2 0 0 1 12.4 0z" fill="currentColor" />
        <circle cx="16.6" cy="9.2" r="2.6" fill="currentColor" opacity="0.75" />
        <path d="M16.9 13.6a5.2 5.2 0 0 1 4.3 6h-4a7.6 7.6 0 0 0-1.6-5.7c.4-.2.8-.3 1.3-.3z" fill="currentColor" opacity="0.75" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={s.fieldGlyph} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden="true">
      <circle cx="9.6" cy="9.2" r="2.8" />
      <path d="M4.4 19a5.2 5.2 0 0 1 10.4 0" />
      <path d="M16 7.2a2.6 2.6 0 0 1 0 5M17.6 18.6h2.4" />
    </svg>
  );
}

/** `person` filled — the Receipt Sharing row once someone has access. */
function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className={cn(s.fieldGlyph, s.fieldGlyphOn)} aria-hidden="true">
      <circle cx="12" cy="8.4" r="3.8" fill="currentColor" />
      <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z" fill="currentColor" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.chipGlyph} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.6v11" />
      <path d="m8.4 7.2 3.6-3.6 3.6 3.6" />
      <path d="M6 12.4v6.6a1.4 1.4 0 0 0 1.4 1.4h9.2a1.4 1.4 0 0 0 1.4-1.4v-6.6" />
    </svg>
  );
}

function CardGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.chipGlyph} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2.6" />
      <path d="M3 10h18" />
    </svg>
  );
}

function MoreGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.circleGlyph} aria-hidden="true" fill="currentColor">
      <circle cx="5.5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18.5" cy="12" r="1.7" />
    </svg>
  );
}

/**
 * The receipt DETAIL screen (app/receiptDetail.tsx) — a root-stack push, so
 * it covers the tab bar and the FAB: neither exists here.
 *   header      back circle (left) + ••• system menu (right), no title
 *   store card  blue `standard` rim: logo + name, divider, address, orange
 *               date, "📷 Scanned Receipt" + the blue "Shared" tag
 *   Category    orange heading; no rim while uncategorised; right chevron
 *   Shared Group white heading; no rim while not in a group, blue rim +
 *               "Shared with <group>" once it is (DETAIL_RECEIPT.sharedGroup)
 *   Receipt Sharing  blue rim, "Shared with <name>" + chevron (the tag above
 *               and this summary read the same `sharedWith` list)
 *   Items Purchased  orange heading, blue-rim card
 *   totals      orange `important` rim
 *
 * Sharing a copy OUT is the ••• menu's Export -> iOS share sheet (a PDF).
 * Nothing here is focused — a focused field would need a keyboard.
 *
 * `scrollY` draws the screen SCROLLED by that many points: the content moves
 * up under the pinned header circles and status bar, exactly as the app's
 * ScrollView does; the header itself never moves. A cropped phone uses it to
 * bring a lower card into view instead of moving anything to the crop line.
 */
export function ReceiptDetailScreen({ scrollY = 0 }: { scrollY?: number }) {
  const r = DETAIL_RECEIPT;
  return (
    <div className={s.screen}>
      <div className={s.ground} aria-hidden="true" />
      <StatusBar time="7:08" />

      <div
        className={s.detailScroll}
        style={scrollY ? { transform: `translateY(calc(${-scrollY} * var(--u)))` } : undefined}
      >
        <div className={cn(s.card, s.rimStandard, s.storeCard)}>
          <div className={s.storeHead}>
            <MerchantLogo initial={r.initial} bg={r.logoBg} detail />
            <div className={s.storeName}>{r.merchant}</div>
          </div>
          <div className={s.storeRule} aria-hidden="true" />
          <div className={s.storeAddr}>{r.address}</div>
          <div className={s.storeDate}>{r.date}</div>
          <div className={s.chipRow}>
            <span className={s.sourceLine}>{r.sourceLine}</span>
            <span className={s.chipShared}>
              <ShareGlyph />
              Shared
            </span>
          </div>
        </div>

        <div className={s.detailSection}>
          <div className={cn(s.sectionTitle, s.sectionTitleAcc)}>Category</div>
          <div className={cn(s.card, s.fieldCard)}>
            <TagIcon />
            <span className={s.fieldText}>No category</span>
            <Chevron />
          </div>
        </div>

        <div className={s.detailSection}>
          <div className={s.sectionTitle}>Shared Group</div>
          {r.sharedGroup ? (
            <div className={cn(s.card, s.rimStandard, s.fieldCard)}>
              <PeopleIcon on />
              <span className={cn(s.fieldText, s.fieldTextOn)}>Shared with {r.sharedGroup}</span>
              <Chevron />
            </div>
          ) : (
            <div className={cn(s.card, s.fieldCard)}>
              <PeopleIcon />
              <span className={s.fieldText}>Not shared</span>
              <Chevron />
            </div>
          )}
        </div>

        <div className={s.detailSection}>
          <div className={s.sectionTitle}>Receipt Sharing</div>
          <div className={cn(s.card, s.rimStandard, s.fieldCard)}>
            <PersonIcon />
            <span className={cn(s.fieldText, s.fieldTextOn)}>
              <span className={s.fieldTextMuted}>Shared with </span>
              {r.sharedWith}
            </span>
            <Chevron />
          </div>
        </div>

        <div className={s.detailSection}>
          <div className={cn(s.sectionTitle, s.sectionTitleAcc)}>Items Purchased</div>
          <div className={cn(s.card, s.rimStandard, s.itemsCard)}>
            {r.items.map((item) => (
              <div key={item.name} className={s.itemRow}>
                <span className={s.itemName}>{item.name}</span>
                <span className={s.itemRight}>
                  <span className={s.itemQty}>{item.qty}</span>
                  <span className={s.itemPrice}>{item.price}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={s.detailSection}>
          <div className={cn(s.card, s.rimImportant, s.totalsCard)}>
            <div className={s.totalRow}>
              <span className={s.totalLabel}>Subtotal</span>
              <span className={s.totalValueAcc}>{r.subtotal}</span>
            </div>
            <div className={cn(s.totalRow, s.totalRowFinal)}>
              <span className={s.grandLabel}>Total</span>
              <span className={s.grandValue}>{r.total}</span>
            </div>
            <div className={s.totalRow}>
              <span className={s.totalLabel}>Payment</span>
              <span className={s.payChip}>
                <CardGlyph />
                {r.payment}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={s.navRow}>
        <span className={s.circleBtn} aria-hidden="true">
          <Chevron back />
        </span>
        <span className={s.circleBtn} aria-hidden="true">
          <MoreGlyph />
        </span>
      </div>
    </div>
  );
}

export type { TabKey };
