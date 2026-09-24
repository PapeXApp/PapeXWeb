"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt } from "@/lib/receiptSummary";
import { ClipLockScreen, IslandLockGlyph, ReceiptsScreen, StatusBar } from "./appui";
import { demoReceiptBytes } from "./demoReceipt";
import { ClipReceiptScreen } from "./ReceiptCard";
import { AppMedia } from "../shared/AppMedia";
import { hasAppMedia } from "../shared/appMediaIndex";
import styles from "./customer.module.css";

/**
 * The "How it works" device: a real iPhone running the real PapeX flow.
 *
 * Rebuilt 2026-09-22 against app-media/reference/. All the screen furniture
 * (status bar, tab bar, rows, glass) now comes from `./appui`, which the hero
 * phone and the two Features shots share — before this each phone drew its
 * own version and they had already drifted apart.
 *
 * The device itself is still measured against the real thing: iPhone 15/16
 * proportions and concentric radii, a Dynamic Island, a real iOS status bar,
 * and the home indicator. See .wpFrame in customer.module.css.
 *
 * Presentational only: the parent owns `step` and the gestures.
 */

/**
 * The device — frame, screen, Dynamic Island, status bar, home indicator —
 * with the screen left for a caller to fill. Extracted so the "Once it's
 * yours" shots (FeatureScreens.tsx) render the SAME phone as the walkthrough
 * instead of a second, slightly-different one.
 *
 * `statusBar` is opt-out: screens from ./appui draw their own (they have to,
 * because the hero phone has no .wpFrame around it).
 */
export function PhoneChrome({
  children,
  mediaSlot,
  statusBar = false,
  islandLock = false,
  screenClassName,
}: {
  children: React.ReactNode;
  /** app-media slot whose real capture, if imported, replaces the drawn screen. */
  mediaSlot?: string;
  statusBar?: boolean;
  /** iOS's lock glyph inside the island — true only while the phone is locked. */
  islandLock?: boolean;
  screenClassName?: string;
}) {
  const drawn = (
    <>
      {/* The glyph is a CHILD of the island: every screen layer below makes its
          own stacking context, so a glyph drawn from the lock screen would be
          painted under the island no matter how high its z-index. */}
      <div className={styles.wpIsland}>{islandLock ? <IslandLockGlyph /> : null}</div>
      {statusBar ? <StatusBar /> : null}
      {children}
      <div className={styles.wpHomeBar} aria-hidden="true" />
      <div className={styles.wpGlare} aria-hidden="true" />
    </>
  );
  return (
    <div className={styles.wpFrame}>
      {/* titanium band > BLACK bezel ring > screen. The black ring is what
          makes this read as an iPhone rather than a grey slab. */}
      <div className={styles.wpBezel}>
        <div className={cn(styles.wpScreen, screenClassName)}>
          {mediaSlot ? <AppMedia slot={mediaSlot} fallback={drawn} /> : drawn}
        </div>
      </div>
    </div>
  );
}

export function WalkPhone({
  step,
  tapCopy,
}: {
  step: number;
  tapCopy: { headline: string; subline: string; caption: string };
}) {
  /* Same decode path as the hero: real ESC/POS bytes through this repo's own
     lib/escpos.ts + lib/receiptSummary.ts, so step 2 shows the receipt a real
     tap produces rather than a second, invented one. */
  const summary = useMemo(() => summarizeReceipt(parseEscPos(demoReceiptBytes()).lines), []);

  /* One `walk` video, if it exists, plays across all three steps; otherwise
     each step looks for its own capture and falls back to the drawn scenes. */
  const slot = hasAppMedia("walk")
    ? "walk"
    : step === 0
      ? "walk-ready"
      : step === 1
        ? "walk-receipt"
        : "walk-list";
  const drawn = (
    <>
      <div className={styles.wpIsland}>{step === 0 ? <IslandLockGlyph /> : null}</div>

      {/* --- 0: ready to tap — the locked phone with the App Clip card ---- */}
      <div className={cn(styles.wpScene, step === 0 && styles.wpSceneOn)} aria-label={tapCopy.headline}>
        <ClipLockScreen />
      </div>

      {/* --- 1: the receipt lands, rendered by the App Clip --------------- *
       * No tab bar: the clip is not the app, it has no tabs. An earlier
       * version drew one anyway and its translucent capsule glowed as a
       * faded oval through the empty space below the card. */}
      <div className={cn(styles.wpScene, styles.wpSceneClip, step === 1 && styles.wpSceneOn)}>
        <ClipReceiptScreen summary={summary} />
      </div>

      {/* --- 2: filed into the app's own Receipts list -------------------- */}
      <div className={cn(styles.wpScene, step === 2 && styles.wpSceneOn)}>
        <ReceiptsScreen />
      </div>

      <div className={styles.wpHomeBar} aria-hidden="true" />
      <div className={styles.wpGlare} aria-hidden="true" />
    </>
  );

  return (
    <div className={styles.wpFrame}>
      <div className={styles.wpBezel}>
        <div className={styles.wpScreen}>
          <AppMedia slot={slot} fallback={drawn} />
        </div>
      </div>
    </div>
  );
}
