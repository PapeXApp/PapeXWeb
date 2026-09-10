"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { WalkPhone } from "./WalkPhone";
import { howItWorksContent } from "./content";
import styles from "./customer.module.css";

/** How long the phone stays lifted onto the reader before the receipt lands (mirrors NfcPhone's bow). */
const BOW_MS = 380;

/**
 * 2.6 How it works — light. A tap-driven walkthrough (replaces the 300vh pinned
 * scroll): tap once to lift the phone onto the reader and land the receipt, tap
 * again to file it into the saved list, tap a third time to replay.
 * `components/motion/PinnedSequence.tsx` stays in the repo — just unused here.
 *
 * DELIBERATELY NOT SCROLL-DRIVEN. A scroll-progress version was tried on
 * 2026-09-09 and reverted: advancing the steps as the section travels past
 * changes the phone under the reader while they are still reading it, and it
 * fights a tap. The page scrolls; the phone is tapped. Keep them separate.
 */
export function HowItWorks() {
  const stepCount = howItWorksContent.steps.length;
  const [step, setStep] = useState(0);
  const [bowing, setBowing] = useState(false);
  const prefersReduced = useReducedMotion();
  const bowTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(bowTimer.current), []);

  /** Where a drag started. Null when no drag is in flight. */
  const dragFrom = useRef<{ x: number; y: number } | null>(null);
  /** A swipe was just handled, so the click the browser fires at the end of the
   *  same pointer sequence must not advance a second time. Cleared on the next
   *  pointerdown so it can never eat an unrelated click later on. */
  const swallowClick = useRef(false);

  /** Below this a drag is a click, not a swipe. */
  const SWIPE_MIN = 34;

  /* stepForward/stepBack are the real navigation. `advance` (the click
     handler) wraps stepForward with the swipe guard — keeping them separate is
     the point: an earlier version had the swipe set the guard and then call the
     guarded function, which immediately swallowed its own call and made swiping
     forward do nothing at all. */
  function stepForward() {
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

  function stepBack() {
    if (bowing) return;
    window.clearTimeout(bowTimer.current);
    setBowing(false);
    setStep(step === 0 ? stepCount - 1 : step - 1);
  }

  function advance() {
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    stepForward();
  }

  function onPointerDown(event: React.PointerEvent) {
    swallowClick.current = false;
    dragFrom.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: React.PointerEvent) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (!from) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    // Any real drag stops the trailing click from also counting as a tap —
    // including a vertical one, which is the visitor scrolling the page THROUGH
    // the phone and must not change the step at all.
    if (Math.abs(dx) >= SWIPE_MIN || Math.abs(dy) >= SWIPE_MIN) {
      swallowClick.current = true;
    }
    // Horizontal intent only.
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) stepForward();
    else stepBack();
  }

  const cue = howItWorksContent.cues[step];
  // The optional-copy fields are typed loosely in content.ts; fall back rather
  // than widen WalkPhone's props to allow undefined.
  const tapCopy = {
    headline: howItWorksContent.steps[0].phoneHeadline ?? "Tap to receive",
    subline: howItWorksContent.steps[0].phoneSubline ?? "Hold near the reader",
    caption: howItWorksContent.steps[1].phoneCaption ?? "Saved to your receipts",
  };

  return (
    <FlowSection ground="light" index="05" style={{ padding: "clamp(80px,10vw,140px) clamp(20px,5vw,56px)" }}>
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
          <SectionLabel index="05">{howItWorksContent.eyebrow}</SectionLabel>
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
                    style={{ width: 2, borderRadius: 2, background: "var(--flow-hair)", flex: "0 0 2px" }}
                  >
                    <div
                      className="absolute left-0 top-0"
                      style={{
                        width: "100%",
                        height: isActive || isDone ? "100%" : "0%",
                        background: "var(--orange)",
                        borderRadius: 2,
                        transition: "height .55s cubic-bezier(.16,1,.3,1)",
                      }}
                    />
                  </div>
                  <div style={{ paddingBottom: index < stepCount - 1 ? 22 : 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-label)",
                        fontWeight: 500,
                        fontSize: 12,
                        color: "var(--orange)",
                        letterSpacing: ".08em",
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
                    <p style={{ marginTop: 7, fontSize: 15, color: "var(--flow-fg-2)", lineHeight: 1.5, maxWidth: "34ch" }}>
                      {s.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal variant="up" className="flex flex-col items-center" style={{ gap: 18 }}>
          <div className="relative flex items-end justify-center" style={{ paddingTop: 64 }}>
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
                background: "linear-gradient(160deg,#F58A1B,#C75F00)",
                border: "1px solid rgba(255,255,255,.18)",
                boxShadow: "0 20px 44px rgba(0,18,29,.24)",
                padding: "12px 12px 30px",
                gap: 7,
              }}
            >
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12.5, color: "#fff" }}>
                {howItWorksContent.readerLabel}
              </span>
              <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
                <span
                  aria-hidden="true"
                  className={styles.nfcRing}
                  style={{ position: "absolute", top: "50%", left: "50%", width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(255,255,255,.85)" }}
                />
                <span
                  aria-hidden="true"
                  className="relative"
                  style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 0 0 6px rgba(255,255,255,.22)" }}
                />
              </div>
            </div>

            {/* Tap OR swipe. Swipe matters more than tap: most visitors will
                never think to tap a picture of a phone, so without a drag the
                walkthrough is invisible to them. Pointer Events cover mouse,
                trackpad and touch in one path. */}
            <div
              role="button"
              tabIndex={0}
              aria-label={howItWorksContent.phoneAriaLabel}
              onClick={advance}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  advance();
                  return;
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  stepBack();
                  return;
                }
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                advance();
              }}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                dragFrom.current = null;
              }}
              className={cn(styles.walkPhone, bowing && styles.walkPhoneBowing)}
              style={{ touchAction: "pan-y", cursor: "grab" }}
            >
              <div className={styles.walkTilt}>
                <WalkPhone step={step} tapCopy={tapCopy} />
              </div>
            </div>
          </div>

          {/* Page dots: the affordance that says "there are three of these and
              you can move between them". */}
          <div className={styles.wpDots} aria-hidden="true">
            {howItWorksContent.steps.map((s, i) => (
              <span key={s.number} className={cn(styles.wpDot, i === step && styles.wpDotOn)} />
            ))}
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
    </FlowSection>
  );
}
