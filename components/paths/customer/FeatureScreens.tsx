import { cn } from "@/lib/utils";
import { ReceiptDetailScreen, ReceiptsScreen, StatusBar, TabBar } from "./appui";
import { ADD_ROWS, SEARCH_QUERY, SEARCH_ROWS, STORE_TILES, type StoreTileData } from "./appui/data";
import s from "./appui/appui.module.css";
import { PhoneChrome } from "./WalkPhone";
import { featuresContent, type FeatureKey } from "./content";
import styles from "./customer.module.css";

/**
 * The four Features app shots (Web 2.1): Find, Add, Share, Deals.
 *
 * Every screen is DRAWN from PapeXV2's own layout and tokens — never a
 * screenshot — per docs/design/app-reference.md, with the source file cited
 * wherever a number or a state comes from the app. All merchants, people,
 * groups and offers are invented, and every shot carries a small "Demo data"
 * caption (copy gate rule 11).
 */

/**
 * Wraps a screen in the device and crops it against ONE edge of the cell.
 *
 * THE CROP IS HONEST (2026-09-23, Nico: "no inconsistencies, like a FAB in the
 * middle of the screen"). The screen inside is laid out exactly as the app
 * lays it out — FAB 89pt above the device's bottom edge, tab bar flush to
 * it — and the cell simply cuts the device off. Nothing is lifted to "ride"
 * the crop line.
 *
 * `crop="bottom"` (default) shows the top of the device, cut at the cell's
 * bottom edge. `crop="top"` shows the BOTTOM of the device, cut at the cell's
 * top edge — used only by the Add shot, because what it shows (the open FAB
 * and its three chips) lives at the bottom of the screen.
 */
function Shot({
  children,
  slot,
  crop = "bottom",
}: {
  children: React.ReactNode;
  /** app-media slot whose real capture, if imported, replaces the drawn screen. */
  slot?: string;
  crop?: "bottom" | "top";
}) {
  return (
    // "dark" is the pointer-glow variant for a card on navy: the Features
    // section is on the NAVY ground, and .featShot takes its navy bed there
    // (customer.module.css).
    <div
      className={cn(styles.featShot, crop === "top" && styles.featShotCropTop)}
      data-lit="dark"
      style={{ aspectRatio: "4 / 3" }}
    >
      <div className={styles.featShotPhone}>
        <PhoneChrome mediaSlot={slot}>{children}</PhoneChrome>
      </div>
      <span className={styles.featDemo}>{featuresContent.demoLabel}</span>
    </div>
  );
}

/**
 * FIND — the Receipts tab after a search for "blue": the query sits in the
 * field with its clear button, the keyboard is down, and the list holds only
 * receipts that match (search FILTERS, app-reference.md §1.7). Each row's
 * meta line carries its auto-assigned category ("Sep 22 • Dining").
 */
function FindShot() {
  return (
    <Shot slot="receipts-search">
      <ReceiptsScreen query={SEARCH_QUERY} rows={SEARCH_ROWS} />
    </Shot>
  );
}

/**
 * ADD — the Receipts tab with the FAB OPEN (FloatingFAB.tsx): the + has turned
 * into an × (the same glyph rotated -135°) and the three 44pt orange chips sit
 * to its LEFT — Capture (camera), Library (images), Manual (edit) — 6pt from
 * the FAB, 8pt apart, centred on its middle. The list's newest rows came in by
 * scan ("Scanned by you") and by forwarded email ("Email by you").
 *
 * The open FAB is drawn OVER the tab's own closed FAB, at the identical spot
 * and size, so the list screen stays the one shared ReceiptsScreen.
 */
function AddShot() {
  return (
    <Shot crop="top">
      <ReceiptsScreen rows={ADD_ROWS} />
      <span className={styles.fabOpen} aria-hidden="true" />
      <span className={styles.fabChips} aria-hidden="true">
        <span className={styles.fabChip}>
          <svg viewBox="0 0 24 24" className={styles.fabChipGlyph}>
            <path
              fill="currentColor"
              d="M9.2 4.4h5.6l1.4 2.2h2.4A2.4 2.4 0 0 1 21 9v8.6a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 17.6V9a2.4 2.4 0 0 1 2.4-2.4h2.4z"
            />
            <circle cx="12" cy="13" r="3.6" fill="#EB7100" />
          </svg>
        </span>
        <span className={styles.fabChip}>
          <svg viewBox="0 0 24 24" className={styles.fabChipGlyph}>
            <rect x="6.4" y="3.6" width="14.2" height="12.6" rx="2.2" fill="currentColor" opacity="0.55" />
            <rect x="3.4" y="7.6" width="14.2" height="12.6" rx="2.2" fill="currentColor" />
            <path d="m5.4 18 3.6-4.2 2.6 2.6 1.8-1.8 2.4 3.4z" fill="#EB7100" />
          </svg>
        </span>
        <span className={styles.fabChip}>
          <svg
            viewBox="0 0 24 24"
            className={styles.fabChipGlyph}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20h4.2L19.4 8.8a2.2 2.2 0 0 0-3.1-3.1L5 16.8z" />
            <path d="m14.6 7.4 3.1 3.1" />
          </svg>
        </span>
      </span>
    </Shot>
  );
}

/**
 * SHARE — a receipt's DETAIL screen (receiptDetail.tsx, a root-stack push, so
 * no tab bar and no FAB) with BOTH ways to share filled in: the Shared Group
 * card reads "Shared with <group>" (blue rim, filled orange people glyph) and
 * the Receipt Sharing card reads "Shared with <name>" — person to person.
 * The store card's blue "Shared" tag is there because that list is not empty
 * (app-reference.md §1.8). Data: appui/data.ts DETAIL_RECEIPT.
 */
function ShareShot() {
  return (
    <Shot>
      {/* Scrolled 112pt so the Receipt Sharing card clears the crop; the
          store card rides up under the pinned header, as it does in the app. */}
      <ReceiptDetailScreen scrollY={112} />
    </Shot>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.searchIcon} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="10.6" cy="10.6" r="6.4" />
      <path d="m15.4 15.4 4.2 4.2" />
    </svg>
  );
}

function HeartGlyph({ filled = false, className }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 20.2S3.6 15.1 3.6 9.3A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.4 2.3c0 5.8-8.4 10.9-8.4 10.9z"
        fill={filled ? "#EB7100" : "none"}
        stroke={filled ? "#EB7100" : "currentColor"}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One store tile, laid out as components/coupons/StoreTile.tsx lays it out
 *  (see STORE_TILES in appui/data.ts for the anatomy). */
function StoreTileCard({ tile }: { tile: StoreTileData }) {
  return (
    <div className={styles.stTile}>
      <div className={styles.stCover} style={{ background: tile.cover }}>
        <span className={styles.stEyebrow}>{tile.category}</span>
      </div>
      <div className={styles.stBody}>
        <span className={styles.stName}>{tile.name}</span>
        <span className={styles.stMeta}>
          {tile.offer ? <span className={styles.stOffer}>{tile.offer}</span> : null}
          {tile.expiry ? <span className={styles.stSub}>{tile.expiry}</span> : null}
          {!tile.offer && tile.openDetail ? (
            <span className={styles.stSub}>
              <span className={styles.stOpen}>Open</span> · {tile.openDetail}
            </span>
          ) : null}
        </span>
        <span className={cn(styles.stFooter, tile.coupons === 0 && styles.stFooterNone)}>
          <svg viewBox="0 0 24 24" className={styles.stTag} aria-hidden="true">
            <path d="M11.4 3.4H20v8.6l-8.8 8.8-8.6-8.6z" fill="currentColor" />
            <circle cx="16.2" cy="7.6" r="1.4" fill="#00121D" />
          </svg>
          {tile.coupons === 0 ? "No coupons yet" : `${tile.coupons} ${tile.coupons === 1 ? "coupon" : "coupons"}`}
        </span>
      </div>
      <span className={styles.stMark}>
        <span className={styles.stMarkInner} style={{ background: tile.mark }}>
          {tile.initial}
        </span>
      </span>
      <span className={styles.stHeart}>
        <HeartGlyph filled={tile.favorite} className={styles.stHeartGlyph} />
      </span>
    </div>
  );
}

/**
 * DEALS — the Stores tab (app/(tabs)/stores.tsx): pinned title row [Select]
 * [Stores] [heart], the pinned "Search" field, then the 2-column store grid
 * (16pt edges, 12pt gutter). Each tile is a store's page in the app, shows the
 * shopper's own coupons for it, and carries a favorite heart. The Stores tab
 * has NO FAB (app-reference.md §1.2). The tab bar is drawn and cropped.
 */
function DealsShot() {
  return (
    <Shot>
      <div className={cn(s.screen, s.titleOneLine)}>
        <div className={s.ground} aria-hidden="true" />
        <StatusBar />

        <div className={styles.stGrid}>
          {STORE_TILES.map((tile) => (
            <StoreTileCard key={tile.id} tile={tile} />
          ))}
        </div>

        <div className={s.headerRow}>
          <span className={s.headerSide}>
            <span className={s.selectPill} aria-hidden="true">
              Select
            </span>
          </span>
          <div className={s.headerPill}>
            <span className={s.headerTitle}>Stores</span>
          </div>
          <span className={cn(s.headerSide, s.headerSideEnd)}>
            <span className={s.circleBtn} aria-hidden="true">
              <HeartGlyph className={s.circleGlyph} />
            </span>
          </span>
        </div>

        <div className={s.searchRow}>
          <div className={s.search}>
            <SearchGlyph />
            <span className={s.searchText}>Search</span>
          </div>
        </div>

        <TabBar active="stores" />
      </div>
    </Shot>
  );
}

/** The app shot for each Features row. */
export function FeatureShot({ feature }: { feature: FeatureKey }) {
  switch (feature) {
    case "find":
      return <FindShot />;
    case "add":
      return <AddShot />;
    case "share":
      return <ShareShot />;
    case "deals":
      return <DealsShot />;
  }
}
