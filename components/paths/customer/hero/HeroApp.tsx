"use client";

import { cn } from "@/lib/utils";
import { useAutoPlay } from "@/components/motion/useAutoPlay";
import { Fab, ReceiptRow, StatusBar, TabBar } from "../appui";
import type { ListRow } from "../appui";
import s from "../appui/appui.module.css";
import { PhoneChrome } from "../WalkPhone";
import { heroCopy, heroNewRow, heroOlderRows, heroSlip } from "./heroCopy";
import h from "./hero.module.css";

/**
 * The /customers hero visual (Web 2.1 P4, 2026-09-28): the PapeX app on an
 * iPhone. A paper receipt is scanned beside the phone, flies in and is filed
 * at the top of the Receipts list, then three chips land around it.
 *
 * Beats (seconds from first paint; hero.module.css owns the numbers):
 *   0.10-0.80  the phone rises in (Receipts tab, 1 unreviewed)
 *   0.85-1.25  the paper slip appears to the phone's left, "Card ************4242"
 *   1.30-2.00  the scan frame locks on and a scan line sweeps down it
 *   2.05-2.60  the slip flies into the phone, shrinking into the top row
 *   2.25-2.80  the older rows slide down; "Today" + Tidewick Cafe land at the
 *              top with an orange flash; the count goes 1 -> 2 unreviewed
 *   3.00-3.95  the chips pop in, 0.3s apart
 *
 * STILL FRAME = END STATE. Every element's own (un-animated) style is the
 * finished picture; the keyframes only add the way there, with fill-mode
 * `both`. They are attached only under
 *   @media (scripting: enabled) and (prefers-reduced-motion: no-preference)
 * so no-JS and reduced motion get the finished frame with no motion, and the
 * server HTML is already the final layout (no hydration jump). Transform,
 * opacity and clip-path only; nothing loops.
 *
 * Trigger: useAutoPlay (components/motion) - the shared "auto animation"
 * primitive. The hero starts on mount; once the stage has fully left the
 * screen and comes back, the animated layers remount (React key = run) so
 * the scene plays again. The phone itself does not re-rise. Skipped under
 * reduced motion.
 *
 * The phone is PhoneChrome (the one iPhone on the page) and the screen is
 * built from the appui kit: its status bar, rows, FAB and tab bar, and its
 * own Receipts-tab classes for the header and search field (see
 * docs/design/app-reference.md, "Receipts").
 */
export function HeroApp() {
  const { ref: stageRef, run, reduced } = useAutoPlay<HTMLDivElement>({ start: "mount" });

  return (
    <div
      ref={stageRef}
      className={h.stage}
      data-still={reduced ? "" : undefined}
      role="img"
      aria-label={heroCopy.visualLabel}
    >
      <div className={h.phone} aria-hidden="true">
        <PhoneChrome>
          <HeroReceiptsScreen key={run} />
        </PhoneChrome>
        <Overlays key={run} />
      </div>
    </div>
  );
}

/** The paper slip and the chips: siblings of the phone, positioned in its
 *  box so every distance is a fraction of the phone's width. */
function Overlays() {
  return (
    <>
      <div className={h.slip}>
        <div className={h.slipPaper}>
          <div className={h.slipMerchant}>{heroSlip.merchant}</div>
          <div className={h.slipMeta}>{heroSlip.meta}</div>
          <div className={h.slipRule} />
          {heroSlip.items.map((item) => (
            <div key={item.name} className={h.slipLine}>
              <span>{item.name}</span>
              <span>{item.price}</span>
            </div>
          ))}
          <div className={h.slipRule} />
          <div className={h.slipLine}>
            <span>{heroSlip.tax.label}</span>
            <span>{heroSlip.tax.price}</span>
          </div>
          <div className={cn(h.slipLine, h.slipTotal)}>
            <span>{heroSlip.total.label}</span>
            <span>{heroSlip.total.price}</span>
          </div>
          <div className={h.slipCard}>{heroSlip.card}</div>
          <div className={h.scanLine} />
        </div>
        <span className={cn(h.corner, h.cornerTL)} />
        <span className={cn(h.corner, h.cornerTR)} />
        <span className={cn(h.corner, h.cornerBL)} />
        <span className={cn(h.corner, h.cornerBR)} />
      </div>

      {heroCopy.chips.map((chip, i) => (
        <div key={chip.key} className={cn(h.chip, h[`chip${i}`])}>
          <span className={h.chipIcon}>
            <ChipGlyph kind={chip.key} />
          </span>
          <span className={h.chipLabel}>
            {"breakAfter" in chip && chip.label.startsWith(chip.breakAfter) ? (
              <>
                {chip.breakAfter}
                <br />
                {chip.label.slice(chip.breakAfter.length).trim()}
              </>
            ) : (
              chip.label
            )}
          </span>
        </div>
      ))}
    </>
  );
}

function ChipGlyph({ kind }: { kind: (typeof heroCopy.chips)[number]["key"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: h.chipSvg,
  };
  // Round 2 (p-01..p-03): one glyph per chip, same stroke set as before.
  if (kind === "back") {
    // A receipt with a "go back" arrow on it: the way back to a purchase.
    return (
      <svg {...common}>
        <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" />
        <path d="M14.6 14.6v-1.4a2.6 2.6 0 0 0-2.6-2.6H9" />
        <path d="M10.8 8.6 8.8 10.6l2 2" />
      </svg>
    );
  }
  if (kind === "share") {
    // The share mark (box + up arrow), as in the app's share sheet.
    return (
      <svg {...common}>
        <path d="M12 3.6v10.2" />
        <path d="M8.4 7.2 12 3.6l3.6 3.6" />
        <path d="M8.4 10.4H7a2 2 0 0 0-2 2v6.1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.1a2 2 0 0 0-2-2h-1.4" />
      </svg>
    );
  }
  // "ready": a check in a circle.
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.2 12.3 2.6 2.6 5-5.3" />
    </svg>
  );
}

function HeroReceiptsScreen() {
  return (
    <div className={s.screen}>
      <div className={s.ground} aria-hidden="true" />
      <StatusBar />

      <div className={s.listScroll}>
        {/* The receipt that arrives: filed at the top, under "Today". */}
        <div className={cn(s.listGroup, h.newGroup)}>
          <div className={s.groupLabel}>{heroNewRow.group}</div>
          <div className={h.newRow}>
            <ReceiptRow row={heroNewRow} />
            <span className={h.rowFlash} />
          </div>
        </div>
        {/* What was already there; it makes room by sliding down. */}
        <div className={h.older}>
          {groupRows(heroOlderRows).map((g) => (
            <div key={g.group} className={s.listGroup}>
              <div className={s.groupLabel}>{g.group}</div>
              {g.rows.map((row) => (
                <ReceiptRow key={row.id} row={row} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={s.headerRow}>
        <span className={s.headerSide}>
          <span className={s.selectPill}>Select</span>
        </span>
        <div className={s.headerPill}>
          <span className={s.headerTitle}>Receipts</span>
          <span className={s.headerSub}>
            <span className={cn(s.headerCount, h.count)}>
              <span className={h.countOld}>1</span>
              <span className={h.countNew}>2</span>
            </span>{" "}
            unreviewed
          </span>
        </div>
        <span className={cn(s.headerSide, s.headerSideEnd)}>
          <span className={s.circleBtn}>
            <svg viewBox="0 0 24 24" className={s.circleGlyph} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 7.2h16M4 12h16M4 16.8h16" />
              <circle cx="9" cy="7.2" r="2" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="8" cy="16.8" r="2" fill="currentColor" stroke="none" />
            </svg>
          </span>
        </span>
      </div>

      <div className={s.searchRow}>
        <div className={s.search}>
          <svg viewBox="0 0 24 24" className={s.searchIcon} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="10.6" cy="10.6" r="6.4" />
            <path d="m15.4 15.4 4.2 4.2" />
          </svg>
          <span className={s.searchText}>Search receipts...</span>
        </div>
      </div>

      <Fab />
      <TabBar active="receipts" />
    </div>
  );
}

function groupRows(rows: ListRow[]) {
  const groups: { group: string; rows: ListRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.group === row.group) last.rows.push(row);
    else groups.push({ group: row.group, rows: [row] });
  }
  return groups;
}
