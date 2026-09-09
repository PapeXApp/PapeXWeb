"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "@/components/motion";
import { howItWorksContent, receipt, receiptsListContent } from "./content";
import { ReceiptCard } from "./ReceiptCard";
import styles from "./customer.module.css";

/** How long the phone stays lifted onto the reader before the receipt lands (mirrors NfcPhone's bow). */
const BOW_MS = 380;

/**
 * 2.6 How it works — light. A 2-click walkthrough (replaces the 300vh pinned
 * scroll): tap once to lift the phone onto the reader and land the receipt,
 * tap again to file it into the saved list, tap a third time to replay.
 * `components/motion/PinnedSequence.tsx` stays in the repo — just unused here.
 */
export function HowItWorks() {
  const stepCount = howItWorksContent.steps.length;
  const [step, setStep] = useState(0);
  const [bowing, setBowing] = useState(false);
  const prefersReduced = useReducedMotion();
  const bowTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(bowTimer.current), []);

  function advance() {
    if (bowing) return;
    if (step === 0) {
      if (prefersReduced) {
        setStep(1);
        return;
      }
      setBowing(true);
      bowTimer.current = window.setTimeout(() => {
        setBowing(false);
        setStep(1);
      }, BOW_MS);
      return;
    }
    setStep(step === 1 ? 2 : 0);
  }

  const cue = howItWorksContent.cues[step];

  return (
    <section
      data-nav-theme="light"
      style={{
        background: "var(--offwhite)",
        color: "var(--navy)",
        padding: "clamp(80px,10vw,140px) clamp(20px,5vw,56px)",
      }}
    >
      <div
        className="grid items-center"
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))",
          gap: "clamp(34px,6vw,80px)",
        }}
      >
        <Reveal variant="up">
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".24em",
              textTransform: "uppercase",
              color: "var(--orange)",
              marginBottom: 18,
            }}
          >
            {howItWorksContent.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="max-w-[16ch] [font-family:var(--font-display)] font-bold text-[clamp(34px,4.4vw,60px)] leading-[1.02] tracking-[-.02em]"
          >
            {howItWorksContent.headline}
          </WordReveal>
          <div className="grid" style={{ marginTop: "clamp(28px,3.6vw,44px)", gap: 8 }}>
            {howItWorksContent.steps.map((s, index) => {
              const isActive = index === step;
              const isDone = index < step;
              return (
                <div
                  key={s.number}
                  className="flex"
                  style={{
                    gap: 22,
                    opacity: isActive ? 1 : 0.32,
                    transform: isActive ? "translateX(0)" : "translateX(-8px)",
                    transition: "opacity .45s ease, transform .45s ease",
                  }}
                >
                  <div
                    className="relative self-stretch"
                    style={{ width: 3, borderRadius: 3, background: "var(--hairline-light)", flex: "0 0 3px" }}
                  >
                    <div
                      className="absolute left-0 top-0"
                      style={{
                        width: "100%",
                        height: isActive || isDone ? "100%" : "0%",
                        background: "var(--orange)",
                        borderRadius: 3,
                        transition: "height .55s cubic-bezier(.16,1,.3,1)",
                      }}
                    />
                  </div>
                  <div style={{ paddingBottom: index < stepCount - 1 ? 22 : 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--orange)",
                        letterSpacing: ".04em",
                      }}
                    >
                      {s.number}
                    </div>
                    <h4
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "clamp(21px,2.4vw,28px)",
                        marginTop: 3,
                      }}
                    >
                      {s.title}
                    </h4>
                    <p style={{ marginTop: 7, fontSize: 15, color: "#5a5a5a", lineHeight: 1.5, maxWidth: "34ch" }}>
                      {s.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal variant="up" className="flex flex-col items-center" style={{ gap: 18 }}>
          <div
            className="relative flex items-end justify-center"
            style={{ paddingTop: 64 }}
          >
            {/* reader sits behind the phone, only its head showing */}
            <div
              aria-hidden="true"
              className="absolute flex flex-col items-center"
              style={{
                zIndex: 1,
                top: 0,
                left: "50%",
                marginLeft: -92,
                width: 184,
                borderRadius: 16,
                background: "linear-gradient(160deg,#12303e,#081d27)",
                border: "1px solid rgba(255,255,255,.12)",
                boxShadow: "0 20px 44px rgba(0,18,29,.32)",
                padding: "12px 12px 30px",
                gap: 7,
              }}
            >
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12.5, color: "var(--offwhite)" }}>
                {howItWorksContent.readerLabel}
              </span>
              <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
                <span
                  aria-hidden="true"
                  className={styles.nfcRing}
                  style={{ position: "absolute", top: "50%", left: "50%", width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--orange)" }}
                />
                <span
                  aria-hidden="true"
                  className="relative"
                  style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--orange)", boxShadow: "0 0 0 6px rgba(235,113,0,.18)" }}
                />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label={howItWorksContent.phoneAriaLabel}
              onClick={advance}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                advance();
              }}
              className={cn(styles.walkPhone, bowing && styles.walkPhoneBowing)}
            >
              <div className={styles.walkTilt}>
                <div
                  style={{
                    position: "relative",
                    height: "min(520px,56vh)",
                    aspectRatio: "300 / 600",
                    borderRadius: 42,
                    background: "linear-gradient(160deg,var(--navy-raised),var(--navy-deep))",
                    border: "2px solid rgba(255,255,255,.1)",
                    boxShadow: "0 34px 76px rgba(0,18,29,.3)",
                    padding: 13,
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute"
                    style={{
                      top: 15,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 86,
                      height: 22,
                      background: "var(--navy-deep)",
                      borderRadius: "0 0 13px 13px",
                      zIndex: 8,
                    }}
                  />
                  <div
                    className="relative"
                    style={{ width: "100%", height: "100%", borderRadius: 30, overflow: "hidden", background: "var(--offwhite)" }}
                  >
                    {/* state 0: tap */}
                    <div
                      className={cn(styles.walkScreen, step === 0 && styles.walkScreenOn, "flex flex-col items-center justify-center")}
                      style={{ gap: 22, padding: 26 }}
                    >
                      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                        <span
                          aria-hidden="true"
                          className={styles.nfcRing}
                          style={{ position: "absolute", top: "50%", left: "50%", width: 120, height: 120, borderRadius: "50%", border: "2px solid var(--orange)" }}
                        />
                        <span
                          aria-hidden="true"
                          className={styles.nfcRingOffset}
                          style={{ position: "absolute", top: "50%", left: "50%", width: 120, height: 120, borderRadius: "50%", border: "2px solid var(--orange)" }}
                        />
                        <span
                          aria-hidden="true"
                          className="relative"
                          style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--orange)", boxShadow: "0 0 0 9px rgba(235,113,0,.16)" }}
                        />
                      </div>
                      <div className="text-center">
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--navy)" }}>
                          {howItWorksContent.steps[0].phoneHeadline}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12.5, color: "#8a8a8a" }}>{howItWorksContent.steps[0].phoneSubline}</div>
                      </div>
                    </div>

                    {/* state 1: receipt appears */}
                    <div
                      className={cn(styles.walkScreen, step === 1 && styles.walkScreenOn, "flex flex-col justify-center")}
                      style={{ padding: 18 }}
                    >
                      <ReceiptCard data={receipt} />
                      <div className="text-center" style={{ marginTop: 13, fontSize: 12, color: "#8a8a8a" }}>
                        {howItWorksContent.steps[1].phoneCaption}
                      </div>
                    </div>

                    {/* state 2: organized */}
                    <div
                      className={cn(styles.walkScreen, step === 2 && styles.walkScreenOn, "flex flex-col")}
                      style={{ gap: 10, padding: "18px 15px" }}
                    >
                      <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--navy)" }}>
                          Receipts
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex items-center justify-center"
                          style={{ width: 27, height: 27, borderRadius: "50%", background: "var(--orange)", color: "#fff", fontWeight: 700, fontSize: 11.5 }}
                        >
                          P
                        </span>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: 8, background: "#fff", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#9a9a9a" }}
                      >
                        {receiptsListContent.searchPlaceholder}
                      </div>
                      {receiptsListContent.rows.map((row) => (
                        <div
                          key={row.merchant}
                          className="flex items-center justify-between"
                          style={{ background: "#fff", borderRadius: 12, padding: "11px 13px" }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)" }}>{row.merchant}</div>
                            <div style={{ fontSize: 10, color: "var(--orange)", marginTop: 2 }}>{row.category}</div>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>{row.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.walkCue} aria-live="polite">
            {step === 2 ? (
              <>
                {cue} <b>{howItWorksContent.replayLabel}</b>
              </>
            ) : (
              cue
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
