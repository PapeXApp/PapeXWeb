"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useReducedMotion } from "motion/react";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt } from "@/lib/receiptSummary";
import { cn } from "@/lib/utils";
import { demoContent } from "./content";
import { demoReceiptBytes } from "./demoReceipt";
import { DemoReceiptView } from "./DemoReceiptView";
import { RdhDevice } from "./RdhDevice";
import { AppMedia } from "../shared/AppMedia";
import styles from "./customer.module.css";

type DemoState = "idle" | "bowing" | "done";

/** How long the phone stays bowed onto the reader before the receipt lands (see customer.module.css .demoTilt). */
const DEMO_BOW_MS = 460;

/**
 * The hero's live receipt demo — the biggest build in the customer path.
 * Tapping the phone bows it onto an isometric RDH device (RdhDevice) and a
 * REAL receipt decodes and renders in App-Clip-styled UI (DemoReceiptView).
 *
 * "Real" means the bytes in demoReceipt.ts go straight through THIS REPO'S
 * OWN `lib/escpos.ts` (`parseEscPos`) and `lib/receiptSummary.ts`
 * (`summarizeReceipt`) — computed once via useMemo, never re-implemented or
 * ported from the design prototype's standalone decoder script.
 */
/** How long the "Save to PapeX" button holds its "Saved" confirmation. */
const SAVED_MS = 1800;

export function NfcPhone() {
  const [demo, setDemo] = useState<DemoState>("idle");
  const [saved, setSaved] = useState(false);
  const prefersReduced = useReducedMotion();
  const bowTimer = useRef<number | undefined>(undefined);
  const savedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(bowTimer.current), []);
  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const summary = useMemo(() => {
    const receipt = parseEscPos(demoReceiptBytes());
    return summarizeReceipt(receipt.lines);
  }, []);

  function tap() {
    if (demo === "done") {
      setDemo("idle");
      return;
    }
    if (demo !== "idle") return;
    if (prefersReduced) {
      setDemo("done");
      return;
    }
    setDemo("bowing");
    window.clearTimeout(bowTimer.current);
    bowTimer.current = window.setTimeout(() => setDemo("done"), DEMO_BOW_MS);
  }

  function reset() {
    if (demo !== "done") return;
    window.clearTimeout(bowTimer.current);
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
                  {/* Taps inside the live receipt belong to the receipt — opening
                      "Original receipt" must not also fire the phone's toggle and
                      reset the demo. Stopping propagation here is what lets the two
                      tap targets coexist: receipt UI in here, replay anywhere else
                      on the phone (or the "Tap again" link below it). */}
                  <div
                    className={styles.acLive}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <div className={styles.acBar}>
                      <span className={styles.acWordmark}>papex</span>
                      <span aria-hidden="true" className={styles.acDot} />
                      <span className={styles.acBarLabel}>{demoContent.barLabel}</span>
                    </div>
                    <div className={styles.acScroll}>
                      <DemoReceiptView summary={summary} />
                    </div>
                    <div className={styles.acFoot}>
                      <button
                        type="button"
                        className={cn(styles.acBtn, saved && styles.acBtnSaved)}
                        onClick={save}
                        aria-live="polite"
                      >
                        {saved ? demoContent.savedLabel : demoContent.saveLabel}
                      </button>
                    </div>
                  </div>
                  <div className={styles.acIdle}>
                    <div aria-hidden="true" className={styles.acIdleRing}>
                      <span />
                      <span />
                      <b className={styles.acIdleRingDot} />
                    </div>
                    <div className={styles.acIdleT}>{demoContent.idleTitle}</div>
                    <div className={styles.acIdleS}>{demoContent.idleSubtitle}</div>
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
        <span aria-live="polite">{demoContent.hint[demo]}</span>
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
