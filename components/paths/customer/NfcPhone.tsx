"use client";

import { useState } from "react";
import { receipt, heroContent } from "./content";
import { ReceiptCard } from "./ReceiptCard";
import styles from "./customer.module.css";

/**
 * The hero's NFC phone — the signature moment of the customer path.
 * Tapping it replays the receipt materialize/hold/dismiss loop on demand
 * (nice-to-have called out in the design README's open questions).
 */
export function NfcPhone() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Tap to replay the receipt animation"
      onClick={() => setReplayKey((key) => key + 1)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setReplayKey((key) => key + 1);
        }
      }}
      className={styles.floaty}
      style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
    >
      <div
        style={{
          position: "relative",
          width: "clamp(230px,24vw,300px)",
          height: "clamp(470px,49vw,610px)",
          borderRadius: 44,
          background: "linear-gradient(160deg,#0a2431,#04161f)",
          border: "2px solid rgba(255,255,255,.1)",
          boxShadow: "0 40px 80px rgba(0,0,0,.5), inset 0 0 0 8px var(--navy)",
          padding: 16,
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 96,
            height: 26,
            background: "var(--navy)",
            borderRadius: "0 0 16px 16px",
            zIndex: 5,
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 30,
            background: "var(--offwhite)",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: "34px 18px 14px", background: "#fff", borderBottom: "1px solid #ececec" }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--navy)" }}>
              Receipts
            </span>
            <span
              aria-hidden="true"
              className="flex items-center justify-center"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--orange)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              P
            </span>
          </div>
          <div style={{ flex: 1, padding: 14, position: "relative", background: "var(--offwhite)" }}>
            <ReceiptCard key={replayKey} data={receipt} loop showActions />
          </div>
          <div
            className="flex flex-col items-center"
            style={{ padding: 16, gap: 6, background: "#fff", borderTop: "1px solid #ececec" }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
              <span
                aria-hidden="true"
                className={styles.nfcRing}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  border: "2px solid var(--orange)",
                }}
              />
              <span
                aria-hidden="true"
                className={styles.nfcRingOffset}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  border: "2px solid var(--orange)",
                }}
              />
              <span
                aria-hidden="true"
                className="relative"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--orange)",
                  boxShadow: "0 0 0 6px rgba(235,113,0,.18)",
                }}
              />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", letterSpacing: ".04em" }}>
              {heroContent.tapZoneLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
