"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt } from "@/lib/receiptSummary";
import { ClipApp, ClipLockScreen, IslandLockGlyph, StatusBar, WalkAppScreen } from "./appui";
import { demoReceiptBytes } from "./demoReceipt";
import { receiptMoment } from "./appui/Clip";
import { demoContent } from "./content";
import { AppMedia } from "../shared/AppMedia";
import { hasAppMedia } from "../shared/appMediaIndex";
import ip from "./iphone.module.css";

/** How long the App Clip card shows between the tap (step 1 -> 2) and the
 *  rendered receipt. Long enough to read "Tap to View Your Receipt". */
const WALK_CARD_MS = 1100;
/** How long step 3 shows the Receipts tab before the app moves to Coupons,
 *  where the coupon the same tap brought sits (W3: coupons are live). */
const WALK_COUPONS_MS = 2200;

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
 * Screens: the lock screen / App Clip card from `./appui/Clip.tsx`; the
 * clip's receipt (`ClipApp`) and the app's tabs (`WalkAppScreen`) are drawn
 * by components/app-kit, the PapeXV2/App Clip source kit (W3, 2026-09-24).
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
  const moment = useMemo(() => receiptMoment(summary.dateline), [summary]);
  const prefersReduced = useReducedMotion();

  /* Step 1 opens on the SAME idle lock screen as the hero — no Live
     Activity and no App Clip card (Nico, 2026-09-24). The card is what the tap
     produces, so it plays on the way from step 1 to step 2: HowItWorks only
     hands us `step` (it bows the phone first, then sets step 1), so WalkPhone
     notices the 0 -> 1 change itself and holds the lock screen with the card
     risen for WALK_CARD_MS before showing the receipt. Reduced motion skips
     the beat and cuts straight to the receipt, like the hero does. */
  const [cardBeat, setCardBeat] = useState(false);
  const prevStep = useRef(step);
  const beatTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const from = prevStep.current;
    prevStep.current = step;
    window.clearTimeout(beatTimer.current);
    if (from === 0 && step === 1 && !prefersReduced) {
      setCardBeat(true);
      beatTimer.current = window.setTimeout(() => setCardBeat(false), WALK_CARD_MS);
    } else {
      setCardBeat(false);
    }
  }, [step, prefersReduced]);
  useEffect(() => () => window.clearTimeout(beatTimer.current), []);

  const lockOn = step === 0 || cardBeat;

  /* Step 3: the Receipts tab first, then (once, a beat later) the Coupons
     tab. Leaving the step resets it; reduced motion stays on Receipts. */
  const [couponsOn, setCouponsOn] = useState(false);
  useEffect(() => {
    setCouponsOn(false);
    if (step !== 2 || prefersReduced) return;
    const t = window.setTimeout(() => setCouponsOn(true), WALK_COUPONS_MS);
    return () => window.clearTimeout(t);
  }, [step, prefersReduced]);

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
    <PhoneChrome mediaSlot={slot} islandLock={lockOn}>
      {/* --- 0: ready to tap — the idle lock screen, as in the hero; the
             App Clip card rises only during the 0 -> 1 beat ------------- */}
      <div className={cn(ip.scene, lockOn && ip.sceneOn)} aria-label={tapCopy.headline}>
        <ClipLockScreen card={cardBeat} moment={moment} />
      </div>

      {/* --- 1: the receipt lands, rendered by the App Clip --------------- *
       * No tab bar: the clip is not the app, it has no tabs. Mounted on the
       * step so iOS's launch banner plays each time the clip opens. */}
      <div className={cn(ip.scene, ip.sceneClip, step === 1 && !cardBeat && ip.sceneOn)}>
        {step === 1 ? (
          <ClipApp
            summary={summary}
            banner
            saveLabel={demoContent.saveLabel}
            savedLabel={demoContent.savedLabel}
            originalLabel={demoContent.sectionTitles.original}
          />
        ) : null}
      </div>

      {/* --- 2: saved into the app — Receipts, then Coupons ---------------- */}
      <div className={cn(ip.scene, step === 2 && ip.sceneOn)}>
        <WalkAppScreen summary={summary} coupons={couponsOn} time={moment.time} />
      </div>
    </PhoneChrome>
  );
}
