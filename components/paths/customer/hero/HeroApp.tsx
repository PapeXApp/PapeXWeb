"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";
import { Fab, ReceiptRow, StatusBar, TabBar } from "../appui";
import type { ListRow } from "../appui";
import s from "../appui/appui.module.css";
import { PhoneChrome } from "../WalkPhone";
import { heroCopy, heroNewRow, heroOlderRows, heroSlip } from "./heroCopy";
import h from "./hero.module.css";

/**
 * The /customers hero visual (Web 2.1 P4, 2026-09-28): the PapeX app on an
 * iPhone. A paper receipt is scanned beside the phone, flies in and is filed
 * at the top of the Receipts list, then three privacy chips land around it.
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
 * Replay: once the stage has fully left the screen and comes back, the
 * animated layers remount (React key) so the scene plays again. The phone
 * itself does not re-rise. Skipped under reduced motion.
 *
 * The phone is PhoneChrome (the one iPhone on the page) and the screen is
 * built from the appui kit: its status bar, rows, FAB and tab bar, and its
 * own Receipts-tab classes for the header and search field (see
 * docs/design/app-reference.md, "Receipts").
 */
export function HeroApp() {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useSafeReducedMotion();
  const [run, setRun] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (reduced || !stage || typeof IntersectionObserver === "undefined") return;
    let gone = false;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (!entry.isIntersecting) gone = true;
        else if (gone) {
          gone = false;
          setRun((n) => n + 1);
        }
      },
      { threshold: 0 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, [reduced]);

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
          <span className={h.chipLabel}>{chip.label}</span>
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
  if (kind === "card") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" rx="2.4" />
        <path d="M3 10h18" />
        <path d="M4 20 20 4" />
      </svg>
    );
  }
  if (kind === "name") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8.6" r="3.4" />
        <path d="M5.4 19.4a6.6 6.6 0 0 1 13.2 0" />
        <path d="M4 20 20 4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7" />
      <path d="M6.5 7l.9 11.6c.1 1 .9 1.9 2 1.9h5.2c1.1 0 1.9-.9 2-1.9L17.5 7" />
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
