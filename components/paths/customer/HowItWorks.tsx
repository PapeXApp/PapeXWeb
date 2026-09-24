"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { RDH_VIEWS, RdhDevice } from "./RdhDevice";
import { WalkPhone } from "./WalkPhone";
import { howItWorksContent } from "./content";
import styles from "./customer.module.css";

/** How long the phone stays lifted onto the reader before the receipt lands (mirrors NfcPhone's bow). */
const BOW_MS = 380;

/** When the stage pins. MUST match the media query on .walkRunway/.walkStage
 *  in customer.module.css — the CSS owns the layout, this only picks the
 *  behaviour. */
const PIN_QUERY = "(prefers-reduced-motion: no-preference) and (min-width: 821px) and (min-height: 600px)";

/** Seats the phone under the "front" RDH view (see .walkRdhSeat). The phone's
 *  top edge sits 9 viewBox units below the top face's nearest corner, so a
 *  strip of the plain front face shows — that strip is what makes the art read
 *  as a box behind the phone rather than a tilted card. */
const RDH = RDH_VIEWS.front;
const RDH_SEAT = {
  ["--walk-rdh-seat" as string]: ((RDH.frontEdgeY + 9) / RDH.width).toFixed(4),
  ["--walk-rdh-cx" as string]: (RDH.boxCentreX / RDH.width).toFixed(4),
} as CSSProperties;

/**
 * 2.6 How it works — light. Two ways through the same three steps:
 *
 *   TAP  — tap/click/Enter/swipe/arrows on the phone, or click a step in the
 *          list. Tap-only mode (reduced motion, narrow or short screens) is
 *          exactly the old walkthrough, replay wrap included.
 *   SCROLL — on desktop the stage pins inside a runway (see .walkRunway) and
 *          keeping on scrolling walks 1 -> 2 -> 3, then releases into the next
 *          section. Crossing into step 2 plays the tap (bow + LED pulse).
 *
 * WHY THIS IS NOT THE 2026-09-09 SCROLL VERSION THAT WAS REVERTED: that one
 * advanced the steps while the section was still travelling past (nothing
 * held the phone still), and scroll and taps each kept their own step, so a
 * tap was undone by the next wheel tick. Here the stage is pinned while it
 * steps, and in pinned mode the SCROLL POSITION IS THE ONLY SOURCE OF TRUTH:
 * a tap never sets the step — it smooth-scrolls to that step's spot in the
 * runway and the scroll listener lands it. They cannot disagree.
 *
 * No rAF loop: a passive scroll listener, attached only while an
 * IntersectionObserver says the runway is on screen, with one rAF-throttled
 * read per frame. The list highlight follows via a CSS variable (--walk-s),
 * so scrolling re-renders React only when the whole step changes.
 */
export function HowItWorks() {
  const stepCount = howItWorksContent.steps.length;
  const last = stepCount - 1;
  const [step, setStep] = useState(0);
  const [bowing, setBowing] = useState(false);
  const [pinned, setPinned] = useState(false);
  const prefersReduced = useReducedMotion();
  const bowTimer = useRef<number | undefined>(undefined);
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /** The step most recently asked for. Equal to `step` except during a bow,
   *  which lands on whatever this is when it finishes. */
  const target = useRef(0);

  useEffect(() => () => window.clearTimeout(bowTimer.current), []);

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const apply = () => setPinned(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /** Show step `next`. Leaving step 0 forwards plays the bow first. */
  const land = useCallback((next: number, animate: boolean) => {
    const from = target.current;
    if (next === from) return;
    target.current = next;
    if (bowTimer.current !== undefined) {
      if (next !== 0) return; // the bow in flight lands on target.current
      window.clearTimeout(bowTimer.current);
      bowTimer.current = undefined;
      setBowing(false);
      setStep(0);
      return;
    }
    if (animate && from === 0 && next > 0) {
      setBowing(true);
      bowTimer.current = window.setTimeout(() => {
        bowTimer.current = undefined;
        setBowing(false);
        setStep(target.current);
      }, BOW_MS);
      return;
    }
    setStep(next);
  }, []);

  /* Pinned mode: scroll position -> step. */
  useEffect(() => {
    if (!pinned) return;
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return;

    let raf = 0;
    let listening = false;
    const read = (animate = true) => {
      raf = 0;
      const rect = runway.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      const s = progress * (stepCount - 1);
      stage.style.setProperty("--walk-s", s.toFixed(4));
      land(Math.round(s), animate);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => read());
    };
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      const method = on ? "addEventListener" : "removeEventListener";
      window[method]("scroll", onScroll, { passive: true } as AddEventListenerOptions);
      window[method]("resize", onScroll, { passive: true } as AddEventListenerOptions);
    };
    const io = new IntersectionObserver(([entry]) => {
      listen(entry.isIntersecting);
      onScroll(); // settle the final position on the way in AND out
    });
    io.observe(runway);
    // First read without the bow: a page restored below this section should
    // just show the last step, not replay the tap off-screen.
    read(false);
    return () => {
      io.disconnect();
      listen(false);
      if (raf) cancelAnimationFrame(raf);
      stage.style.removeProperty("--walk-s");
    };
  }, [pinned, stepCount, land]);

  /** Pinned mode's only way to change step: scroll to its spot in the runway.
   *  `index === stepCount` means past the runway, i.e. on to the next section. */
  function scrollToStep(index: number) {
    const runway = runwayRef.current;
    if (!runway) return;
    const rect = runway.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    const y =
      index >= stepCount
        ? rect.bottom + window.scrollY
        : rect.top + window.scrollY + (travel * Math.max(0, index)) / (stepCount - 1);
    window.scrollTo({ top: Math.round(y), behavior: "smooth" });
  }

  function goToStep(index: number) {
    if (pinned) scrollToStep(index);
    else land(index, !prefersReduced);
  }

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
    if (pinned) {
      // Off the last step = on to the next section, never a wrap back to 1.
      scrollToStep(target.current + 1);
      return;
    }
    if (bowing) return;
    land(step === last ? 0 : step + 1, !prefersReduced);
  }

  function stepBack() {
    if (pinned) {
      if (target.current > 0) scrollToStep(target.current - 1);
      return;
    }
    land(step === 0 ? last : step - 1, false);
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

  const cue = (pinned ? howItWorksContent.scrollCues : howItWorksContent.cues)[step];
  // The optional-copy fields are typed loosely in content.ts; fall back rather
  // than widen WalkPhone's props to allow undefined.
  const tapCopy = {
    headline: howItWorksContent.steps[0].phoneHeadline ?? "Tap to receive",
    subline: howItWorksContent.steps[0].phoneSubline ?? "Hold near the reader",
    caption: howItWorksContent.steps[1].phoneCaption ?? "Saved to your receipts",
  };

  // Pinned: the scroll listener writes --walk-s straight onto the stage every
  // frame, so React must not own it. Tap-only: it is simply the step.
  const stageStyle = pinned ? undefined : ({ ["--walk-s" as string]: step } as CSSProperties);

  return (
    // `styles.screen` (2026-09-23): when the stage pins, the runway is already
    // taller than a screen and this is a no-op; when it doesn't (reduced
    // motion, or a desktop window under 600px tall) the section still owns a
    // full screen like every other one from 821px. The runway is a plain
    // block, so the screen's column flexbox stretches it full width and the
    // sticky stage inside it is unaffected.
    <FlowSection ground="light" index="05" className={`${styles.screen} ${styles.rhythm}`}>
      <div
        ref={runwayRef}
        className={styles.walkRunway}
        style={{ ["--walk-steps" as string]: stepCount } as CSSProperties}
      >
        <div ref={stageRef} className={styles.walkStage} style={stageStyle}>
          <div
            className="grid w-full items-center"
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
                className="max-w-[16ch] [font-family:var(--font-display)] font-bold text-[length:var(--fs-h2)] leading-[1.02] tracking-[-.02em]"
              >
                {howItWorksContent.headline}
              </WordReveal>
              <div
                className={cn("grid", !pinned && styles.walkStepsEased)}
                style={{ marginTop: "var(--gap-body)", gap: 8 }}
              >
                {howItWorksContent.steps.map((s, index) => (
                  // The row is the click target; the <button> inside is what
                  // keyboard and screen-reader users reach (its click bubbles
                  // here, so there is exactly one handler).
                  <div
                    key={s.number}
                    className={styles.walkStep}
                    style={{ ["--walk-i" as string]: index } as CSSProperties}
                    onClick={() => goToStep(index)}
                  >
                    <div className={styles.walkStepRail}>
                      <div className={styles.walkStepFill} />
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
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "clamp(21px,2.4vw,28px)",
                          marginTop: 3,
                        }}
                      >
                        <button
                          type="button"
                          className={styles.walkStepBtn}
                          aria-current={index === step ? "step" : undefined}
                        >
                          {s.title}
                        </button>
                      </h3>
                      <p style={{ marginTop: 7, fontSize: 15, color: "var(--flow-fg-2)", lineHeight: 1.5, maxWidth: "34ch" }}>
                        {s.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal variant="up" className="flex flex-col items-center" style={{ gap: 18 }}>
              <div className={cn("relative flex items-end justify-center", styles.walkRdhSeat)} style={RDH_SEAT}>
                {/* The reader: the SAME generated box as the hero, from its
                    sticker end. It sits behind the phone; the bow lifts the
                    phone onto its sticker and the LED pulses. */}
                <div className={styles.walkRdh}>
                  <RdhDevice view="front" pulsing={bowing} />
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
                {step === last ? (
                  <>
                    {cue} <b>{pinned ? howItWorksContent.continueLabel : howItWorksContent.replayLabel}</b>
                  </>
                ) : (
                  cue
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </FlowSection>
  );
}
