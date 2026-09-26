"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt } from "@/lib/receiptSummary";
import { cn } from "@/lib/utils";
import { ClipLockScreen } from "./appui";
import { receiptMoment } from "./appui/Clip";
import { heroContent } from "./content";
import { demoReceiptBytes } from "./demoReceipt";
import { RdhDevice } from "./RdhDevice";
import { PhoneChrome } from "./WalkPhone";
import styles from "./customer.module.css";
import ip from "./iphone.module.css";

/**
 * The hero's visual (Web 2.1 P3-C4, Nico 2026-09-25: "just the phone tapping
 * back and forth with a pause"; P3-C5: make it an obvious back-and-forth).
 * A locked iPhone waits up and to the left of the PapeX device, swings in and
 * taps its foot onto the device's top face, the device answers (NFC rings,
 * glow, status light), the phone swings back out, pauses ~1.5s, and it all
 * goes round again: one 4.2s cycle, ~25% of the phone's height of travel,
 * set in customer.module.css (`.tapPhone` / `.tapRing` / `.tapGlow`,
 * keyframes heroTap*; the device is dropped by `--tap-drop` to make room).
 * The WHOLE clip flow — card, "Reading your receipt", the receipt
 * — is told once, by §02 How it works, so the hero no longer plays it and has
 * nothing to click. It is a picture: one `role="img"` with a label, the
 * phone and the device inside it hidden from assistive tech.
 *
 * MOTION is CSS only (transform + opacity), every animated piece on the same
 * duration so they stay in step. The keyframes are always attached but held
 * `paused`; `data-run` on the stage lets them play, and it is set only while
 * the stage is on screen (IntersectionObserver) AND the tab is visible AND
 * motion is allowed. Pausing freezes every piece on the same frame, so a
 * resume picks up in step.
 *
 * STILL FRAME. Server render, no-JS and prefers-reduced-motion all show
 * frame 0 — the phone resting on the device, leaning in — which is also where
 * each cycle starts and ends, so the first run never jumps. Reduced motion
 * additionally drops the animations in CSS and holds one faint ring on the
 * device, so the still picture still says "this goes on that".
 *
 * The lock screen's date + clock still come from the decoded demo receipt
 * (this repo's own lib/escpos.ts + lib/receiptSummary.ts), so the hero's
 * phone shows the same moment as §02's.
 */
export function NfcPhone() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  const moment = useMemo(
    () => receiptMoment(summarizeReceipt(parseEscPos(demoReceiptBytes()).lines).dateline),
    [],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    const update = () => setRun(onScreen && !document.hidden && !motion.matches);
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    io.observe(stage);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className={styles.demoStage}
      role="img"
      aria-label={heroContent.visualLabel}
      data-run={run ? "" : undefined}
    >
      <div className={styles.tapPhone} aria-hidden="true">
        <PhoneChrome islandLock>
          <ClipLockScreen card={false} moment={moment} />
        </PhoneChrome>
      </div>

      {/* The device. `ip.rdh` / `ip.rdhGlow` / `ip.rdhRing` give the halo and
          the ring their shape and seat on the box's top face (iphone.module.css);
          the hero's own classes only time them to the tap. */}
      <div className={cn(styles.demoRdh, ip.rdh)} aria-hidden="true">
        <span className={cn(ip.rdhGlow, styles.tapGlow)} />
        <RdhDevice />
        <span className={cn(ip.rdhRing, styles.tapRing)} />
        <span className={cn(ip.rdhRing, styles.tapRing, styles.tapRing2)} />
      </div>
    </div>
  );
}
