"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt } from "@/lib/receiptSummary";
import { cn } from "@/lib/utils";
import { demoContent } from "./content";
import { demoReceiptBytes } from "./demoReceipt";
import { DemoReceiptView } from "./DemoReceiptView";
import { RdhDevice } from "./RdhDevice";
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
export function NfcPhone() {
  const [demo, setDemo] = useState<DemoState>("idle");
  const prefersReduced = useReducedMotion();
  const bowTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(bowTimer.current), []);

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
              <div className={styles.acLive}>
                <div className={styles.acBar}>
                  <span className={styles.acWordmark}>papex</span>
                  <span aria-hidden="true" className={styles.acDot} />
                  <span className={styles.acBarLabel}>{demoContent.barLabel}</span>
                </div>
                <div className={styles.acScroll}>
                  <DemoReceiptView summary={summary} />
                </div>
                <div className={styles.acFoot}>
                  <button type="button" className={styles.acBtn}>
                    {demoContent.saveLabel}
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
