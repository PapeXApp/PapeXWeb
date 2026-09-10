"use client";

import { cn } from "@/lib/utils";
import { receipt, receiptsListContent } from "./content";
import { ReceiptCard } from "./ReceiptCard";
import styles from "./customer.module.css";

/**
 * The "How it works" device: a real iPhone running the real PapeX app.
 *
 * The version this replaces was a rounded rectangle with a notch and invented
 * UI on the screen. Everything here is measured against the actual product:
 * iPhone 15/16 proportions and concentric radii, a Dynamic Island, a working
 * iOS status bar, PapeXV2's own palette and screen furniture (large title,
 * letterspaced section label, 40pt circular row icon, trailing chevron), and
 * the iOS 26 Liquid Glass tab bar — the inset floating capsule that mirrors
 * whatever scrolls beneath it, which is what PapeXV2 ships via NativeTabs.
 * See .wpFrame in customer.module.css for where each number comes from.
 *
 * Presentational only: the parent owns `step` and the gestures.
 */

const TABS = [
  { key: "home", label: "Home" },
  { key: "receipts", label: "Receipts" },
  { key: "coupons", label: "Coupons" },
  { key: "settings", label: "Settings" },
] as const;

/** The app's four tab glyphs, drawn as strokes so they stay sharp at any size. */
function TabGlyph({ tab }: { tab: (typeof TABS)[number]["key"] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className={styles.wpTabGlyph} aria-hidden="true">
      {tab === "home" && <path {...common} d="M3.6 10.4 12 3.8l8.4 6.6V20a1 1 0 0 1-1 1h-4.6v-6H10.2v6H5.6a1 1 0 0 1-1-1z" />}
      {tab === "receipts" && (
        <>
          <path {...common} d="M6 3.2h12v17.6l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.8z" />
          <path {...common} d="M9.2 8.2h5.6M9.2 12h5.6" />
        </>
      )}
      {tab === "coupons" && (
        <>
          <path {...common} d="M3.4 8.6A2 2 0 0 0 5.4 6.6h13.2a2 2 0 0 0 2 2v2a2 2 0 0 0 0 3.8v2a2 2 0 0 0-2 2H5.4a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-3.8z" />
          <path {...common} d="M12 8.8v1.4M12 13.8v1.4" />
        </>
      )}
      {tab === "settings" && (
        <>
          <circle {...common} cx="12" cy="12" r="3.1" />
          <path {...common} d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5l-1.5 1.5M7 17l-1.5 1.5M18.5 18.5 17 17M7 7 5.5 5.5" />
        </>
      )}
    </svg>
  );
}

function StatusBar() {
  return (
    <div className={styles.wpStatus} aria-hidden="true">
      <span>9:41</span>
      <span className={styles.wpStatusRight}>
        <span className={styles.wpBars}>
          <i /><i /><i /><i />
        </span>
        <span className={styles.wpWifi}>
          <i /><i /><i />
        </span>
        <span className={styles.wpBattery}>
          <i />
        </span>
      </span>
    </div>
  );
}

export function TabBar({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className={styles.wpTabBar} aria-hidden="true">
      {TABS.map((tab) => (
        <span key={tab.key} className={cn(styles.wpTab, tab.key === active && styles.wpTabOn)}>
          <TabGlyph tab={tab.key} />
          {tab.label}
        </span>
      ))}
    </div>
  );
}

/**
 * The device itself — frame, screen, Dynamic Island, status bar, home
 * indicator — with the screen left empty for a caller to fill. Extracted so the
 * "Once it's yours" shots (FeatureScreens.tsx) render the SAME phone as the
 * walkthrough instead of a second, slightly-different one.
 */
export function PhoneChrome({
  children,
  tab,
}: {
  children: React.ReactNode;
  tab?: (typeof TABS)[number]["key"];
}) {
  return (
    <div className={styles.wpFrame}>
      <div className={styles.wpScreen}>
        <div className={styles.wpIsland} />
        <StatusBar />
        {children}
        {tab ? <TabBar active={tab} /> : null}
        <div className={styles.wpHomeBar} aria-hidden="true" />
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
  return (
    <div className={styles.wpFrame}>
      <div className={styles.wpScreen}>
        <div className={styles.wpIsland} />
        <StatusBar />

        {/* --- 0: tap to receive ------------------------------------------ */}
        <div className={cn(styles.wpScene, step === 0 && styles.wpSceneOn)}>
          <div className={styles.wpTapWrap}>
            <div className="relative flex items-center justify-center" style={{ width: "34%", aspectRatio: "1" }}>
              <span aria-hidden="true" className={styles.nfcRing} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--orange)" }} />
              <span aria-hidden="true" className={styles.nfcRingOffset} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--orange)" }} />
              <span aria-hidden="true" style={{ width: "34%", aspectRatio: "1", borderRadius: "50%", background: "var(--orange)", boxShadow: "0 0 0 9px rgba(235,113,0,.16)" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "calc(21 * var(--wp-u))", color: "rgba(255,255,255,.92)" }}>
                {tapCopy.headline}
              </div>
              <div style={{ marginTop: "calc(6 * var(--wp-u))", fontSize: "calc(13 * var(--wp-u))", color: "rgba(255,255,255,.6)" }}>
                {tapCopy.subline}
              </div>
            </div>
          </div>
          <TabBar active="home" />
        </div>

        {/* --- 1: the receipt lands --------------------------------------- */}
        <div className={cn(styles.wpScene, step === 1 && styles.wpSceneOn)}>
          <div className={styles.wpBody}>
            <div className={styles.wpTitle}>Receipt</div>
            <ReceiptCard data={receipt} />
            <div style={{ textAlign: "center", fontSize: "calc(12 * var(--wp-u))", color: "rgba(255,255,255,.6)" }}>
              {tapCopy.caption}
            </div>
          </div>
          <TabBar active="receipts" />
        </div>

        {/* --- 2: filed into the list ------------------------------------- */}
        <div className={cn(styles.wpScene, step === 2 && styles.wpSceneOn)}>
          <div className={styles.wpBody}>
            <div className={styles.wpTitle}>{receiptsListContent.title}</div>
            <div className={styles.wpSectionLabel}>Recent</div>
            {receiptsListContent.rows.map((row) => (
              <div key={row.merchant} className={cn(styles.wpRow, row.unreviewed && styles.wpRowUnreviewed)}>
                <span aria-hidden="true" className={styles.wpAvatar}>{row.initial}</span>
                <span className={styles.wpRowText}>
                  <span className={styles.wpMerchant} style={{ display: "block" }}>{row.merchant}</span>
                  <span className={styles.wpMeta} style={{ display: "block" }}>
                    {row.category} &middot; {row.date}
                  </span>
                </span>
                <span className={styles.wpAmount}>{row.amount}</span>
                <span aria-hidden="true" className={styles.wpChevron} />
              </div>
            ))}
          </div>
          <TabBar active="receipts" />
        </div>

        <div className={styles.wpHomeBar} aria-hidden="true" />
      </div>
    </div>
  );
}
