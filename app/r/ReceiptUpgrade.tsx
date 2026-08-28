"use client";

// app/r/ReceiptUpgrade.tsx
//
// The image-first-then-upgrade island.
//
// THE PROBLEM, PRECISELY. Blaze prints receipts as a bitmap. Turning that into
// a merchant name, line items and a total takes ~46 seconds of OCR (measured
// against prod, twice: 46.3 s and 41.4 s). The customer taps the countertop
// device ~15 seconds after the sale. So at first paint the structured receipt
// does not exist yet — not "usually", ever — and there is nothing this page
// can do server-side to change that. Blocking the render on it would show a
// spinner for half a minute; showing the picture and never revisiting it would
// mean the extracted receipt is only ever visible to someone who thinks to
// reload.
//
// So: render the picture immediately, poll quietly in the background, and swap
// in the structured receipt the moment it lands.
//
// POLLING MANNERS (all of these are requirements, not niceties — this runs on
// a stranger's phone, on their data, right after they paid for something):
//   - 3 s while OCR should be running, 6 s after the first minute.
//   - Hard deadline. OCR lands ~46 s after the upload or it has failed; the
//     window is 120 s from mount, which is ~3x the expected wait even after
//     the ~15 s head start the customer's walk to the door gives it.
//   - Stops on success. Stops on a terminal `failed`. Stops on 404.
//   - Stops while the tab is hidden, and resumes on return if there is still
//     time left. Nobody's battery pays for a page they aren't looking at.
//   - Cannot spin forever: every exit path clears the timer, and the deadline
//     is absolute rather than a countdown that hiding the tab could extend.
//
// It never renders an error. If the poll gives up, the customer is left with
// exactly what shipped today: their receipt, as a picture. That is a fine
// outcome and announcing a failure would only make it feel like less of one.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DecodedRasterPage } from "@/lib/escpos";
import type { ReceiptSummary } from "@/lib/receiptSummary";
import { hasStructure as computeHasStructure } from "@/lib/receiptSummary";
import {
  type ParsedReceiptPayload,
  hasUsableReceipt,
  normalizePayload,
  parsedToSummary,
  shouldKeepPolling,
} from "@/lib/rdhParsed";
import { ReceiptView } from "./ui";
import styles from "./glass.module.css";

/** Poll cadence while OCR should still be in flight. */
const FAST_INTERVAL_MS = 3_000;
/** Cadence after the first minute, when a late answer is less likely. */
const SLOW_INTERVAL_MS = 6_000;
const SLOW_AFTER_MS = 60_000;
/** Absolute ceiling from mount. Past this, OCR is not coming. */
const DEADLINE_MS = 120_000;

export default function ReceiptUpgrade({
  sid,
  fallbackSummary,
  rasterPage,
  initialPayload,
}: {
  sid: string;
  /**
   * What to show until (and unless) structured data arrives — the summary the
   * server already derived from the raw bytes. For a Blaze bitmap that is an
   * empty summary and `rasterPage` carries the whole receipt.
   */
  fallbackSummary: ReceiptSummary;
  rasterPage?: DecodedRasterPage;
  /**
   * The parsed payload as of the server render, when the fetch succeeded.
   * Usually `ok_raster` with no receipt — this page's defining case — but if
   * the customer arrives late (or reloads) it can already be `ok`, in which
   * case the structured receipt renders on the first paint and no poll ever
   * starts.
   */
  initialPayload: ParsedReceiptPayload | null;
}) {
  const [payload, setPayload] = useState<ParsedReceiptPayload | null>(initialPayload);
  // Distinguishes "arrived while you were looking" (animate) from "was already
  // there at first paint" (don't) — animating content that never changed is
  // just noise.
  const [upgradedLive, setUpgradedLive] = useState(false);
  // Drives the "Reading your receipt…" hint. Real state, not a ref, so that
  // running out of time actually removes the hint instead of leaving it
  // pulsing at a customer forever.
  const [polling, setPolling] = useState(() => shouldKeepPolling(initialPayload));

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef(0);
  const stoppedRef = useRef(false);
  const startedAtRef = useRef(0);

  const upgraded = hasUsableReceipt(payload);

  // The poll loop lives in a ref-driven effect rather than an interval so each
  // request schedules the next one only after it settles — a slow response can
  // never stack requests on top of each other.
  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPolling(false);
  }, []);

  useEffect(() => {
    // Already have the receipt (late arrival / reload): nothing to poll for.
    if (!shouldKeepPolling(initialPayload)) return;

    stoppedRef.current = false;
    startedAtRef.current = Date.now();
    deadlineRef.current = startedAtRef.current + DEADLINE_MS;

    let cancelled = false;

    const schedule = () => {
      if (cancelled || stoppedRef.current) return;
      if (Date.now() >= deadlineRef.current) return stop();
      // Hidden tab: don't schedule anything. The visibility listener below
      // restarts the loop if there is still time on the clock.
      if (typeof document !== "undefined" && document.hidden) return;

      const elapsed = Date.now() - startedAtRef.current;
      const delay = elapsed < SLOW_AFTER_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
      timerRef.current = setTimeout(tick, delay);
    };

    const tick = async () => {
      // Clear the fired timer's id FIRST. `onVisibility` uses a non-null
      // timerRef as "a poll is already scheduled, don't start another"; if a
      // fired timeout's id were left behind, that check would read as
      // scheduled forever and the tab could never resume after being hidden.
      timerRef.current = null;

      if (cancelled || stoppedRef.current) return;
      if (Date.now() >= deadlineRef.current) return stop();
      // Hidden between scheduling and firing: skip the request entirely and
      // leave nothing scheduled. The visibility listener owns the restart.
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const res = await fetch(`/api/r/${sid}/parsed`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (res.status === 404) return stop(); // the receipt is gone; polling can't help
        if (res.ok) {
          const next = normalizePayload(await res.json());
          if (next && !cancelled) {
            setPayload(next);
            if (hasUsableReceipt(next)) {
              setUpgradedLive(true);
              return stop();
            }
            if (!shouldKeepPolling(next)) return stop(); // terminal "failed"
          }
        }
        // Any other status (502 from the proxy, a blip) just falls through to
        // the next scheduled attempt — inside the same deadline.
      } catch {
        // Offline / navigation abort. Same treatment: try again, or run out
        // of time. The page is fine either way.
      }

      schedule();
    };

    const onVisibility = () => {
      if (document.hidden || stoppedRef.current || cancelled) return;
      if (Date.now() >= deadlineRef.current) return stop();
      if (timerRef.current) return; // already scheduled
      void tick();
    };

    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [sid, initialPayload, stop]);

  if (upgraded && payload?.receipt) {
    const summary = parsedToSummary(payload.receipt);
    return (
      <div className={upgradedLive ? styles.upgradeIn : undefined}>
        <ReceiptView
          summary={summary}
          hasStructure={computeHasStructure(summary)}
          rasterPage={rasterPage}
        />
      </div>
    );
  }

  // Pre-upgrade: exactly what this page renders today. The hint only appears
  // when there is genuinely an extraction in flight — never on a text receipt,
  // never once the poll has stopped.
  return (
    <ReceiptView
      summary={fallbackSummary}
      hasStructure={computeHasStructure(fallbackSummary)}
      rasterPage={rasterPage}
      extracting={rasterPage != null && polling}
    />
  );
}
