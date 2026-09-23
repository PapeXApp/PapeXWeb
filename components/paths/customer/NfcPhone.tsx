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
import { AppMedia } from "../shared/AppMedia";
import styles from "./customer.module.css";

type DemoState = "idle" | "bowing" | "reading" | "done";

/** How long the phone stays bowed onto the reader before the clip launches (see .demoTilt). */
const DEMO_BOW_MS = 460;
/** How long "Reading your receipt" holds — matches the clip's own progress bar. */
const DEMO_READ_MS = 700;
/** How long the "Save to PapeX" button holds its "Saved" confirmation. */
const SAVED_MS = 1800;

/**
 * The hero's live receipt demo — the biggest build in the customer path, and
 * now the App Clip's real story rather than an invented "tap to receive" card:
 *
 *   idle    the phone is LOCKED, with the App Clip card sliding up from the
 *           bottom edge ("PapeX / Tap to View Your Receipt" + a View pill)
 *   bowing  the phone bows onto the isometric RDH reader (RdhDevice)
 *   reading "Reading your receipt" with an orange progress bar
 *   done    the rendered clip receipt, with "Save to PapeX"
 *
 * "Real" means the bytes in demoReceipt.ts go straight through THIS REPO'S
 * OWN `lib/escpos.ts` (`parseEscPos`) and `lib/receiptSummary.ts`
 * (`summarizeReceipt`) — computed once via useMemo, never re-implemented or
 * ported from the design prototype's standalone decoder script.
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

  function tap() {
    if (demo === "done") {
      reset();
      return;
    }
    if (demo !== "idle") return;
    if (prefersReduced) {
      setDemo("done");
      return;
    }
    setDemo("bowing");
    window.clearTimeout(bowTimer.current);
    bowTimer.current = window.setTimeout(() => {
      setDemo("reading");
      window.clearTimeout(readTimer.current);
      readTimer.current = window.setTimeout(() => setDemo("done"), DEMO_READ_MS);
    }, DEMO_BOW_MS);
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

  // The hint copy has one line per visible beat; "reading" borrows the tap's.
  const hint = demoContent.hint[demo === "reading" ? "bowing" : demo];

  return (
    <div className={styles.demoStage}>
      <div
        role="button"
        tabIndex={0}
        aria-label={demoContent.phoneLabel}
        aria-pressed={demo !== "idle"}
        onClick={tap}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          tap();
        }}
        className={cn(
          styles.demoPhone,
          demo === "bowing" && styles.demoPhoneBowing,
          demo === "done" && styles.demoPhoneDone,
        )}
      >
        <div className={styles.demoTilt}>
          <div className={styles.demoShell}>
            <div aria-hidden="true" className={styles.demoNotch} />
            <div className={styles.demoScreen}>
              {/* A real capture of the tap (app-media slot "hero-tap") takes over
                  the whole screen when one exists; until then this renders the
                  live-decoded demo below, unchanged. */}
              <AppMedia
                slot="hero-tap"
                fallback={
                  <>
                    {/* 1. locked phone + the App Clip card */}
                    <div className={cn(styles.acLayer, demo !== "done" && demo !== "reading" && styles.acLayerOn)}>
                      <ClipLockScreen />
                    </div>

                    {/* 2. the clip launching */}
                    <div className={cn(styles.acLayer, demo === "reading" && styles.acLayerOn)}>
                      <ClipReading />
                    </div>

                    {/* 3. the receipt. Taps inside it belong to the receipt —
                        opening "Original receipt" must not also fire the
                        phone's replay. Stopping propagation here is what lets
                        the two tap targets coexist: receipt UI in here, replay
                        anywhere else on the phone (or the "Reset" link). */}
                    <div
                      className={cn(styles.acLayer, demo === "done" && styles.acLayerOn)}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <ClipReceiptScreen summary={summary} saved={saved} onSave={save} />
                    </div>
                  </>
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className={styles.demoRdh}>
        <RdhDevice pulsing={demo === "bowing"} />
      </div>

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
