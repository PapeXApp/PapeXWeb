"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useReducedMotion } from "motion/react";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt } from "@/lib/receiptSummary";
import { cn } from "@/lib/utils";
import { ClipLockScreen, ClipReading } from "./appui";
import { demoContent } from "./content";
import { demoReceiptBytes } from "./demoReceipt";
import { ClipReceiptScreen } from "./ReceiptCard";
import { RdhDevice } from "./RdhDevice";
import { PhoneChrome } from "./WalkPhone";
import styles from "./customer.module.css";

/**
 * The five beats of the tap. The card beat is new on 2026-09-22: before it,
 * the App Clip card sat on the lock screen at rest, which is not what a real
 * iPhone does and which spent the whole payoff before anyone touched anything.
 */
type DemoState = "idle" | "bowing" | "card" | "reading" | "done";

/** How long the phone stays bowed onto the reader before the card arrives (see .demoTilt). */
const DEMO_BOW_MS = 640;
/** How long "Reading your receipt" holds — matches the clip's own progress bar. */
const DEMO_READ_MS = 700;
/** How long the "Save to PapeX" button holds its "Saved" confirmation. */
const SAVED_MS = 1800;

/**
 * The hero's live receipt demo — the biggest build in the customer path, and
 * the App Clip's real story beat for beat:
 *
 *   idle    the phone is LOCKED and empty. No App Clip card: iOS shows one
 *           only after an NFC tap, so the card is the reward, not the set.
 *   bowing  the visitor tapped the READER (the device is the button); the
 *           phone bows onto it and the reader's LED pulses.
 *   card    the phone is back up and iOS has slid the App Clip card in from
 *           the bottom edge — "PapeX / Tap to View Your Receipt" with a blue
 *           View pill that glows on a loop until it is clicked.
 *   reading "Reading your receipt" with an orange progress bar.
 *   done    the rendered clip receipt, with "Save to PapeX".
 *
 * "Real" means the bytes in demoReceipt.ts go straight through THIS REPO'S
 * OWN `lib/escpos.ts` (`parseEscPos`) and `lib/receiptSummary.ts`
 * (`summarizeReceipt`) — computed once via useMemo, never re-implemented or
 * ported from the design prototype's standalone decoder script.
 *
 * The device itself is <PhoneChrome>, the same component the walkthrough and
 * the Features shots render, so there is exactly one iPhone on this page.
 */
export function NfcPhone() {
  const [demo, setDemo] = useState<DemoState>("idle");
  const [saved, setSaved] = useState(false);
  const prefersReduced = useReducedMotion();
  const bowTimer = useRef<number | undefined>(undefined);
  const readTimer = useRef<number | undefined>(undefined);
  const savedTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(bowTimer.current);
      window.clearTimeout(readTimer.current);
      window.clearTimeout(savedTimer.current);
    },
    [],
  );

  const summary = useMemo(() => {
    const receipt = parseEscPos(demoReceiptBytes());
    return summarizeReceipt(receipt.lines);
  }, []);

  /** Beat 1 — the reader was tapped (pointer, Enter or Space). */
  function tapDevice() {
    if (demo !== "idle") return;
    if (prefersReduced) {
      // No bow, and the card is simply there: reduced motion gets the state,
      // not the choreography.
      setDemo("card");
      return;
    }
    setDemo("bowing");
    window.clearTimeout(bowTimer.current);
    bowTimer.current = window.setTimeout(() => setDemo("card"), DEMO_BOW_MS);
  }

  /** Beat 2 — the blue View pill on the App Clip card was clicked. */
  function openClip() {
    if (demo !== "card") return;
    setDemo("reading");
    window.clearTimeout(readTimer.current);
    readTimer.current = window.setTimeout(() => setDemo("done"), DEMO_READ_MS);
  }

  /** The phone stays tappable as a convenience: it just does whatever the
   *  current beat's real control would do. The reader is still the thing the
   *  copy points at. */
  function tapPhone() {
    if (demo === "idle") tapDevice();
    else if (demo === "card") openClip();
    else if (demo === "done") reset();
  }

  function reset() {
    window.clearTimeout(bowTimer.current);
    window.clearTimeout(readTimer.current);
    setDemo("idle");
  }

  /** The demo's own "Save to PapeX" — it has nowhere real to save to (no
   *  account, no app), so a brief confirmation is the honest affordance:
   *  it reacts, without pretending to actually save anything. Stops
   *  propagation so it never also toggles the phone's replay. */
  function save(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    window.clearTimeout(savedTimer.current);
    setSaved(true);
    savedTimer.current = window.setTimeout(() => setSaved(false), SAVED_MS);
  }

  const locked = demo === "idle" || demo === "bowing" || demo === "card";
  // The hint copy has one line per visible beat; "reading" borrows the tap's.
  const hint = demoContent.hint[demo === "reading" ? "bowing" : demo];

  return (
    <div className={styles.demoStage}>
      <div
        role="button"
        tabIndex={0}
        aria-label={demoContent.phoneLabel}
        aria-pressed={demo !== "idle"}
        onClick={tapPhone}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          tapPhone();
        }}
        className={cn(styles.demoPhone, demo === "bowing" && styles.demoPhoneBowing)}
      >
        <div className={styles.demoTilt}>
          <PhoneChrome islandLock={locked}>
            {/* 1. the locked phone. The App Clip card only exists from the
                   "card" beat on — mounting it is what plays iOS's
                   slide-up-from-the-bottom. */}
            <div className={cn(styles.acLayer, locked && styles.acLayerOn)}>
              <ClipLockScreen
                card={demo === "card"}
                pulse={!prefersReduced}
                onView={openClip}
              />
            </div>

            {/* 2. the clip launching */}
            <div className={cn(styles.acLayer, demo === "reading" && styles.acLayerOn)}>
              <ClipReading />
            </div>

            {/* 3. the receipt. Taps inside it belong to the receipt —
                   opening "Original receipt" must not also fire the phone's
                   replay. Stopping propagation here is what lets the two tap
                   targets coexist: receipt UI in here, replay anywhere else
                   on the phone (or the "Reset" link). */}
            <div
              className={cn(styles.acLayer, demo === "done" && styles.acLayerOn)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <ClipReceiptScreen summary={summary} saved={saved} onSave={save} />
            </div>
          </PhoneChrome>
        </div>
      </div>

      {/* THE tap target. The reader is what the hero asks you to tap, so it is
          a real <button>: pointer, Enter and Space all start the sequence, and
          it drops out of the tab order once it has been used. */}
      <button
        type="button"
        className={styles.demoRdh}
        onClick={tapDevice}
        disabled={demo !== "idle"}
        aria-label={demoContent.deviceLabel}
      >
        <RdhDevice pulsing={demo === "bowing"} />
      </button>

      <div className={styles.demoHintRow}>
        <span aria-live="polite">{hint}</span>
        <button
          type="button"
          onClick={reset}
          disabled={demo !== "done"}
          className={styles.demoResetLink}
        >
          {demoContent.resetLabel}
        </button>
      </div>
    </div>
  );
}
