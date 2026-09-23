import type { MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";
import type { ReceiptSummary } from "@/lib/receiptSummary";
import { ClipTopBar, StatusBar } from "./appui";
import { demoContent } from "./content";
import { DemoReceiptView } from "./DemoReceiptView";
import styles from "./customer.module.css";

/**
 * The App Clip's rendered-receipt SCREEN: the pinned
 * "Powered by PapeX · App Store ›" bar, the decoded receipt
 * (DemoReceiptView), and the "Save to PapeX" action with its caption.
 *
 * This file used to export `ReceiptCard`, a white paper-receipt card with a
 * dashed rule and a "TAPPED" chip — an approximation of a design the app has
 * never shipped. Rebuilt 2026-09-22 against app-media/reference/clip-*.png so
 * the hero and the "How it works" walk render the SAME screen a real tap
 * produces, instead of two different inventions.
 *
 * Presentational: the caller owns the save/replay state and the timing.
 */
export function ClipReceiptScreen({
  summary,
  saved,
  onSave,
  className,
}: {
  summary: ReceiptSummary;
  saved?: boolean;
  /** Omit to render the screen without a working button (the walkthrough). */
  onSave?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <>
      {/* The clip is a full-screen app: it carries iOS's status bar. */}
      <StatusBar time="7:12" />
      <ClipTopBar />
      <div className={cn(styles.acScroll, className)}>
        <DemoReceiptView summary={summary} />
      </div>
      <div className={styles.acFoot}>
        <button
          type="button"
          className={cn(styles.acBtn, saved && styles.acBtnSaved)}
          onClick={onSave}
          disabled={!onSave}
          aria-live="polite"
        >
          {saved ? demoContent.savedLabel : demoContent.saveLabel}
        </button>
        <div className={styles.acFootNote}>Get the app to save and organize every receipt</div>
      </div>
    </>
  );
}
