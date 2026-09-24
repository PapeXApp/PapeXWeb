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
import ip from "./iphone.module.css";

/**
 * The iPhone every phone on /customers is drawn in, and the "How it works"
 * walkthrough that runs inside it.
 *
 * 2.1 (2026-09-23): the device moved to iphone.module.css and was rebuilt as
 * an iPhone 16/17 Pro after Nico said the 2.0 phone read as Android — body
 * proportions, a thin graphite titanium band, the black bezel, Apple's side
 * buttons, the Dynamic Island at its real size and the home indicator. See
 * the header of iphone.module.css for the numbers.
 *
 * Screens come from `./appui` (the app kit, owned separately) and the lock
 * screen / App Clip beats from `./appui/Clip.tsx`.
 */

/**
 * The device — frame, side buttons, bezel, screen, Dynamic Island, optional
 * status bar, home indicator, glass — with the screen left for a caller to
 * fill. The hero, the Features shots and the walkthrough all render THIS, so
 * there is exactly one iPhone on the page.
 *
 * `statusBar` is opt-in: screens from ./appui draw their own.
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
      <div className={ip.island}>{islandLock ? <IslandLockGlyph /> : null}</div>
      {statusBar ? <StatusBar /> : null}
      {children}
      <div className={ip.homeBar} aria-hidden="true" />
      <div className={ip.glare} aria-hidden="true" />
    </>
  );
  return (
    <div className={ip.frame}>
      {/* Left: Action button, volume up, volume down. Right: side button and
          the flush Camera Control. Outside the silhouette, like the metal. */}
      <span className={cn(ip.btn, ip.btnL, ip.btnAction)} aria-hidden="true" />
      <span className={cn(ip.btn, ip.btnL, ip.btnVolUp)} aria-hidden="true" />
      <span className={cn(ip.btn, ip.btnL, ip.btnVolDown)} aria-hidden="true" />
      <span className={cn(ip.btn, ip.btnR, ip.btnSide)} aria-hidden="true" />
      <span className={cn(ip.btn, ip.btnR, ip.btnCamera)} aria-hidden="true" />
      {/* titanium band > black bezel ring > screen */}
      <div className={ip.bezel}>
        <div className={cn(ip.screen, screenClassName)}>
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

  return (
    <PhoneChrome mediaSlot={slot} islandLock={step === 0}>
      {/* --- 0: ready to tap — the locked phone with the App Clip card ---- */}
      <div className={cn(ip.scene, step === 0 && ip.sceneOn)} aria-label={tapCopy.headline}>
        <ClipLockScreen />
      </div>

      {/* --- 1: the receipt lands, rendered by the App Clip --------------- *
       * No tab bar: the clip is not the app, it has no tabs. */}
      <div className={cn(ip.scene, ip.sceneClip, step === 1 && ip.sceneOn)}>
        <ClipReceiptScreen summary={summary} />
      </div>

      {/* --- 2: filed into the app's own Receipts list -------------------- */}
      <div className={cn(ip.scene, step === 2 && ip.sceneOn)}>
        <ReceiptsScreen />
      </div>
    </PhoneChrome>
  );
}
