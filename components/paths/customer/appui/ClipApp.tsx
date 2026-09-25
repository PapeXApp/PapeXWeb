"use client";

import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AppKitRoot, ClipReceipt, type ClipReceiptData } from "@/components/app-kit";
import { kitStyles } from "@/components/app-kit/primitives";
import type { ReceiptLine } from "@/lib/escpos";
import {
  detectPaymentMethod,
  extractLastFour,
  PAYMENT_METHOD_STYLES,
  type ReceiptSummary,
} from "@/lib/receiptSummary";
import { cn } from "@/lib/utils";
import { StatusBar } from "./Chrome";
import { ClipTopBar, receiptMoment } from "./Clip";
import x from "./clipApp.module.css";

/**
 * The App Clip's rendered receipt — W3 (2026-09-24), built on the app kit's
 * `ClipReceipt` (components/app-kit, a port of Papex_AppClip
 * ReceiptView.swift) instead of the hand-drawn customer screen.
 *
 * The receipt is still the REAL decode: the caller passes
 * `summarizeReceipt(parseEscPos(bytes).lines)` from this repo's lib/, and
 * `toClipData` only reshapes it for the kit (payment = network label + last
 * four, as the app words it).
 *
 * The kit draws the clip as one fixed 393x852 frame with non-interactive
 * chrome, so this file composes around it (the gaps are listed in the W3
 * report):
 *   - scrolling: the kit's content column is put back into flow inside a
 *     scroller (clipApp.module.css `.flow`), with the Swift `Chrome.top` /
 *     `Chrome.bottom` insets, so the receipt travels under the floating bars
 *     exactly as ReceiptView does;
 *   - the floating TopBar (back · PapeX lockup · ⋯) and the FooterCTA
 *     ("Save to PapeX" + share, subtext) are redrawn here from the same
 *     numbers so their buttons can be real: ⋯ opens the clip's own menu
 *     ("View original receipt" opens OriginalReceiptSheet with the verbatim
 *     decoded lines), and Save reacts;
 *   - `banner` lays iOS's App Clip launch banner over the top for the first
 *     beats after launch, then lets it slide away (once; reduced motion shows
 *     the clip's own top bar only).
 */

/** ReceiptSummary (lib/receiptSummary) -> the kit's ClipReceiptData. */
export function toClipData(summary: ReceiptSummary): ClipReceiptData {
  const network = summary.paymentLine ? detectPaymentMethod(summary.paymentLine) : null;
  const lastFour = summary.paymentLine ? extractLastFour(summary.paymentLine) : null;
  const label = network ? PAYMENT_METHOD_STYLES[network].label : null;
  const payment = label && lastFour ? `${label} •••• ${lastFour}` : label ?? (lastFour ? `•••• ${lastFour}` : summary.paymentLine);
  const subtotal = summary.subtotal ?? summary.items.reduce((sum, item) => sum + item.amount, 0);
  return {
    merchantName: summary.merchantName ?? "Receipt",
    addressLines: summary.addressLines,
    dateline: summary.dateline,
    items: summary.items.map((item) => ({ label: item.name, quantity: item.qty, amount: item.amount })),
    subtotal,
    tax: summary.tax,
    total: summary.total ?? subtotal + (summary.tax ?? 0),
    payment: payment ?? undefined,
  };
}

/** SwiftUI VerbatimReceipt: 13pt mono (18 double / 15 single, fontB -1), bold, alignment. */
function VerbatimLine({ line }: { line: ReceiptLine }) {
  const st = line.style;
  let size = 13;
  if (st.doubleHeight && st.doubleWidth) size = 18;
  else if (st.doubleHeight || st.doubleWidth) size = 15;
  if (st.fontB) size = Math.max(10, size - 1);
  return (
    <div
      className={x.vLine}
      style={{
        fontSize: `calc(${size} * var(--u))`,
        fontWeight: st.bold ? 700 : 400,
        textDecoration: st.underline ? "underline" : undefined,
        textAlign: line.align === "center" ? "center" : line.align === "right" ? "right" : "left",
      }}
    >
      {line.text.length ? line.text : " "}
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className={x.glyph} aria-hidden="true">
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Ellipsis() {
  return (
    <svg viewBox="0 0 24 24" className={x.glyph} aria-hidden="true">
      {[5, 12, 19].map((cx) => (
        <circle key={cx} cx={cx} cy={12} r={1.8} fill="currentColor" />
      ))}
    </svg>
  );
}
function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={x.shareGlyph} aria-hidden="true">
      <path d="M12 3v11M8 7l4-4 4 4M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MenuGlyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className={x.menuGlyph} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* SF Symbols in the Swift menu: doc.plaintext, exclamationmark.bubble, info.circle. */
const DOC = "M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20ZM14 3.5V8h4M9.5 12h5M9.5 15h5M9.5 18h3";
const BUBBLE = "M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-8l-4 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5ZM12 8.5v3.5M12 14.4v.1";
const INFO = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5.5M12 7.6v.1";

export function ClipApp({
  summary,
  interactive = false,
  banner = false,
  saved = false,
  onSave,
  saveLabel,
  savedLabel,
  originalLabel,
}: {
  summary: ReceiptSummary;
  /** Real buttons (hero). The walkthrough draws the same screen inert. */
  interactive?: boolean;
  /** Lay iOS's App Clip launch banner over the top, then let it slide away. */
  banner?: boolean;
  saved?: boolean;
  onSave?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  saveLabel: string;
  savedLabel: string;
  /** Title of the verbatim sheet ("Original receipt"). */
  originalLabel: string;
}) {
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState(false);
  const data = toClipData(summary);

  const bubble = cn(kitStyles.liquid, x.bubble);
  return (
    <AppKitRoot mode="dark" width="var(--wp-w)" className={x.root}>
      <div data-app-kit-clip="" className={x.clip}>
        <div className={cn(x.flow, !interactive && x.flowStatic)}>
          <ClipReceipt data={data} statusBar={false} footer={false} style={{ height: "auto", minHeight: "100%" }} />
        </div>

        {/* Floating TopBar (Swift TopBar): 44pt back circle, PapeX lockup
            capsule, 44pt ⋯ circle; padding h sm (16), top xs (8). */}
        <div className={x.topBar}>
          <span className={cn(bubble, x.circle)} aria-hidden="true">
            <Chevron />
          </span>
          <span className={cn(bubble, x.lockup)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 22pt synced lockup inside a --u-scaled mockup */}
            <img src="/app/kit/clip/papex-logo.png" alt="PapeX" className={x.lockupImg} draggable={false} />
          </span>
          {interactive ? (
            <button
              type="button"
              className={cn(bubble, x.circle, x.btn)}
              aria-label="More"
              aria-expanded={menu}
              onClick={() => setMenu((open) => !open)}
            >
              <Ellipsis />
            </button>
          ) : (
            <span className={cn(bubble, x.circle)} aria-hidden="true">
              <Ellipsis />
            </span>
          )}
        </div>

        {/* The ⋯ menu (Swift: View original receipt / Report a problem /
            About PapeX), drawn as iOS's pull-down menu. */}
        {interactive && menu ? (
          <>
            <button type="button" className={x.scrim} aria-label="Close menu" onClick={() => setMenu(false)} />
            <div className={x.menu} role="menu">
              <button
                type="button"
                role="menuitem"
                className={x.menuItem}
                onClick={() => {
                  setMenu(false);
                  setSheet(true);
                }}
              >
                <span>View original receipt</span>
                <MenuGlyph d={DOC} />
              </button>
              <button type="button" role="menuitem" className={x.menuItem} onClick={() => setMenu(false)}>
                <span>Report a problem</span>
                <MenuGlyph d={BUBBLE} />
              </button>
              <button type="button" role="menuitem" className={x.menuItem} onClick={() => setMenu(false)}>
                <span>About PapeX</span>
                <MenuGlyph d={INFO} />
              </button>
            </div>
          </>
        ) : null}

        {/* FooterCTA: bubble(r 34) padding 14 — Save to PapeX (52pt capsule,
            F5851C -> orange) + 52pt share circle, subtext 12 muted. */}
        <div className={x.footer}>
          <div className={cn(bubble, x.footBubble)}>
            <div className={x.footRow}>
              {interactive && onSave ? (
                <button type="button" className={cn(x.save, x.btn, saved && x.saveDone)} onClick={onSave} aria-live="polite">
                  {saved ? savedLabel : saveLabel}
                </button>
              ) : (
                <span className={x.save}>{saveLabel}</span>
              )}
              <span className={x.share} aria-hidden="true">
                <ShareGlyph />
              </span>
            </div>
            <div className={x.footNote}>Get the app to save and organize every receipt</div>
          </div>
        </div>

        {/* OriginalReceiptSheet: "Original receipt" + Done, then the verbatim
            decoded lines in a glass card. */}
        {interactive ? (
          <div className={cn(x.sheet, sheet && x.sheetOn)} aria-hidden={!sheet}>
            <div className={x.sheetHead}>
              <span className={x.sheetTitle}>{originalLabel}</span>
              <button type="button" className={cn(x.done, x.btn)} onClick={() => setSheet(false)} tabIndex={sheet ? 0 : -1}>
                Done
              </button>
            </div>
            <div className={x.sheetScroll}>
              <div className={x.vCard}>
                {summary.bodyLines.map((line, i) => (
                  <VerbatimLine key={i} line={line} />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {banner ? <ClipTopBar className={x.bannerAway} /> : null}
        <StatusBar time={receiptMoment(summary.dateline).time} />
      </div>
    </AppKitRoot>
  );
}

