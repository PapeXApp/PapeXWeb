"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { RDH_VIEWS, RdhDevice } from "./RdhDevice";
import { WALK_CARD_MS, WalkPhone } from "./WalkPhone";
import { HOW_IT_WORKS_ANCHOR, howItWorksContent } from "./content";
import styles from "./customer.module.css";

/** How long the phone stays lifted onto the reader before the receipt lands (mirrors NfcPhone's bow). */
const BOW_MS = 380;

/** Autoplay timing (P3-C1). A beat on the idle lock screen before the tap,
 *  then the bow (BOW_MS) + WalkPhone's App Clip card beat (WALK_CARD_MS),
 *  then the clip's receipt holds long enough to read before it is saved. */
const AUTO_LEAD_MS = 700;
const AUTO_CLIP_HOLD_MS = 2400;

/** When the stage pins. MUST match the media query on .walkRunway/.walkStage
 *  in customer.module.css — the CSS owns the layout, this only picks the
 *  behaviour. min-height 600 -> 850 (2026-09-24) -> 640 (P3-C1, 2026-09-25):
 *  the pinned layout now compacts by viewport height instead of unpinning,
 *  so a normal ~780px laptop window scrolls through the steps again. */
const PIN_QUERY = "(prefers-reduced-motion: no-preference) and (min-width: 821px) and (min-height: 640px)";

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
 *
 * NO MODE NEEDS A TAP TO SEE THE DEMO (P3-C1, 2026-09-25, Nico: a first-time
 * visitor won't know to tap):
 *   - pinned: scrolling plays it (the pin now fits down to 640px tall);
 *   - tap mode (phones, short windows): the first time the phone is mostly
 *     on screen it plays 1 -> 2 -> 3 by itself, once;
 *   - after step 3 the phone keeps alternating Receipts <-> Coupons while it
 *     is on screen (WalkPhone), and a tap/click on the phone replays the demo
 *     from step 1 — in place, in both modes. In pinned mode a replay is only
 *     visual: the next scroll event cancels it and the scroll position wins
 *     again, so the two never fight;
 *   - reduced motion: no autoplay, no alternation — the complete last step,
 *     still steppable by tap/keys.
 */
export function HowItWorks() {
  const stepCount = howItWorksContent.steps.length;
  const last = stepCount - 1;
  const [step, setStep] = useState(0);
  const [bowing, setBowing] = useState(false);
  const [pinned, setPinned] = useState(false);
  /** The phone is mostly on screen. Drives the tap-mode autoplay and pauses
   *  WalkPhone's tab alternation off-screen. */
  const [inView, setInView] = useState(false);
  const prefersReduced = useReducedMotion();
  const bowTimer = useRef<number | undefined>(undefined);
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  /** The step most recently asked for. Equal to `step` except during a bow,
   *  which lands on whatever this is when it finishes. */
  const target = useRef(0);
  /** Timers of an autoplay / replay in flight (empty = none). */
  const autoTimers = useRef<number[]>([]);
  /** Tap mode's one-time autoplay has run (or the visitor took over). */
  const autoplayed = useRef(false);
  /** `pinned` for callbacks that must not re-subscribe when it flips. */
  const pinnedRef = useRef(false);

  const stopAuto = useCallback(() => {
    autoTimers.current.forEach((t) => window.clearTimeout(t));
    autoTimers.current = [];
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(bowTimer.current);
      stopAuto();
    },
    [stopAuto],
  );

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const apply = () => {
      pinnedRef.current = mq.matches;
      setPinned(mq.matches);
    };
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

  /** Show `next` as a demo beat: land it (with the bow on 0 -> 1) and, when
   *  pinned, move the list's highlight with it — in pinned mode the scroll
   *  listener normally owns --walk-s, and hands it back on the next scroll. */
  const showBeat = useCallback(
    (next: number, animate: boolean) => {
      if (pinnedRef.current) stageRef.current?.style.setProperty("--walk-s", String(next));
      land(next, animate);
    },
    [land],
  );

  /** Play the demo from step 1: the idle lock screen, the tap, the clip's
   *  receipt, then saved into the app (where WalkPhone's alternation takes
   *  over). Used by tap mode's autoplay and by every replay. */
  const playFromStart = useCallback(() => {
    stopAuto();
    showBeat(0, false);
    const tapAt = AUTO_LEAD_MS;
    const saveAt = tapAt + BOW_MS + WALK_CARD_MS + AUTO_CLIP_HOLD_MS;
    autoTimers.current = [
      window.setTimeout(() => showBeat(1, true), tapAt),
      window.setTimeout(() => {
        autoTimers.current = [];
        showBeat(last, true);
      }, saveAt),
    ];
  }, [last, showBeat, stopAuto]);

  /* Is the phone on screen? One observer for both modes. */
  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.55 });
    io.observe(phone);
    return () => io.disconnect();
  }, []);

  /* Reduced motion: the complete last frame, not the first (no autoplay will
     ever get it there). Once, after hydration — the server can't know. */
  const reducedApplied = useRef(false);
  useEffect(() => {
    if (!prefersReduced || reducedApplied.current) return;
    reducedApplied.current = true;
    autoplayed.current = true;
    stopAuto();
    land(last, false);
  }, [prefersReduced, last, land, stopAuto]);

  /* Tap mode autoplays ONCE, the first time the phone is on screen. If the
     phone leaves the screen mid-play, the play is dropped and runs again,
     from the top, next time it comes into view — nothing plays unseen. */
  useEffect(() => {
    if (pinned || prefersReduced !== false) return;
    if (inView) {
      if (autoplayed.current || target.current !== 0) return;
      autoplayed.current = true;
      playFromStart();
    } else if (autoTimers.current.length > 0) {
      stopAuto();
      autoplayed.current = false;
      land(0, false);
    }
  }, [inView, pinned, prefersReduced, playFromStart, stopAuto, land]);

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
      // A scroll takes back over from an in-place replay.
      stopAuto();
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
      if (!raf) raf = requestAnimationFrame(() => read()); // settle the final position on the way in AND out
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
  }, [pinned, stepCount, land, stopAuto]);

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
    stopAuto();
    autoplayed.current = true;
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
  /** `replay`: a tap/click/Enter on the finished demo plays it again from
   *  step 1 (in place, both modes). Arrow keys pass false, so in pinned mode
   *  ArrowRight on the last step still moves on to the next section. */
  function stepForward(replay = true) {
    const wasPlaying = autoTimers.current.length > 0;
    stopAuto();
    autoplayed.current = true;
    if (pinned) {
      if (target.current >= last) {
        if (replay) playFromStart();
        else scrollToStep(stepCount); // off the last step = on to the next section
        return;
      }
      if (!wasPlaying) {
        scrollToStep(target.current + 1);
        return;
      }
      // A tap during a replay jumps it one beat on, in place.
      showBeat(target.current + 1, true);
      return;
    }
    if (bowing) return;
    if (step === last) {
      if (prefersReduced) land(0, false);
      else playFromStart();
      return;
    }
    land(step + 1, !prefersReduced);
  }

  function stepBack() {
    stopAuto();
    autoplayed.current = true;
    if (pinned) {
      if (target.current > 0) scrollToStep(target.current - 1);
      return;
    }
    land(step === 0 ? last : step - 1, false);
  }

  function advance(replay = true) {
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    stepForward(replay);
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
    if (dx < 0) stepForward(false);
    else stepBack();
  }

  const cue = (pinned ? howItWorksContent.scrollCues : howItWorksContent.cues)[step];
  // A tap on the finished demo replays it in both modes now (P3-C1), so the
  // last cue offers "Replay" in pinned mode too (content.continueLabel is no
  // longer shown).
  // The optional-copy fields are typed loosely in content.ts; fall back rather
  // than widen WalkPhone's props to allow undefined.
  const tapCopy = {
    headline: howItWorksContent.steps[0].phoneHeadline ?? "Tap to receive",
    subline: howItWorksContent.steps[0].phoneSubline ?? "Hold near the PapeX device",
    caption: howItWorksContent.steps[1].phoneCaption ?? "Saved to your receipts",
  };

  // Pinned: the scroll listener writes --walk-s straight onto the stage every
  // frame, so React must not own it. Tap-only: it is simply the step.
  const stageStyle = pinned ? undefined : ({ ["--walk-s" as string]: step } as CSSProperties);

  return (
    // `styles.screen` (2026-09-23): when the stage pins, the runway is already
    // taller than a screen and this is a no-op; when it doesn't (reduced
    // motion, or a desktop window under 850px tall) the section still owns a
    // full screen like every other one from 821px. The runway is a plain
    // block, so the screen's column flexbox stretches it full width and the
    // sticky stage inside it is unaffected.
    // `id`: the hero's "How does that work?" cue scrolls here (content.ts).
    <FlowSection
      ground="light"
      index="02"
      id={HOW_IT_WORKS_ANCHOR}
      className={`${styles.screen} ${styles.rhythm}`}
    >
      <div
        ref={runwayRef}
        className={styles.walkRunway}
        data-nojs="walk-runway"
        style={{ ["--walk-steps" as string]: stepCount } as CSSProperties}
      >
        <div ref={stageRef} className={styles.walkStage} data-nojs="walk-stage" style={stageStyle}>
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
              <SectionLabel index="02">{howItWorksContent.eyebrow}</SectionLabel>
              <WordReveal
                as="h2"
                className={cn(
                  "max-w-[16ch] [font-family:var(--font-display)] font-bold text-[length:var(--fs-h2)] leading-[1.02] tracking-[-.02em]",
                  styles.walkHeading,
                )}
              >
                {howItWorksContent.headline}
              </WordReveal>
              <div className={cn(styles.walkSteps, !pinned && styles.walkStepsEased)}>
                {howItWorksContent.steps.map((s, index) => (
                  // The row is the click target; the <button> inside is what
                  // keyboard and screen-reader users reach (its click bubbles
                  // here, so there is exactly one handler).
                  <div
                    key={s.number}
                    className={styles.walkStep}
                    data-nojs="walk-step"
                    style={{ ["--walk-i" as string]: index } as CSSProperties}
                    onClick={() => goToStep(index)}
                  >
                    <div className={styles.walkStepRail}>
                      <div className={styles.walkStepFill} data-nojs="walk-fill" />
                    </div>
                    <div className={styles.walkStepText}>
                      <div className={styles.walkStepNum}>{s.number}</div>
                      <h3 className={styles.walkStepTitle}>
                        <button
                          type="button"
                          className={styles.walkStepBtn}
                          aria-current={index === step ? "step" : undefined}
                        >
                          {s.title}
                        </button>
                      </h3>
                      <p className={styles.walkStepBody}>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal variant="up" className={styles.walkPhoneCol}>
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
                  ref={phoneRef}
                  role="button"
                  tabIndex={0}
                  aria-label={howItWorksContent.phoneAriaLabel}
                  onClick={() => advance()}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      advance(false);
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
                    <WalkPhone step={step} tapCopy={tapCopy} active={inView} />
                  </div>
                </div>
              </div>

              {/* Page dots: the affordance that says "there are three of these and
                  you can move between them". */}
              <div className={styles.wpDots} data-nojs="walk-dots" aria-hidden="true">
                {howItWorksContent.steps.map((s, i) => (
                  <span key={s.number} className={cn(styles.wpDot, i === step && styles.wpDotOn)} />
                ))}
              </div>

              <div className={styles.walkCue} data-nojs="walk-cue" aria-live="polite">
                {step === last ? (
                  <>
                    {cue} <b>{howItWorksContent.replayLabel}</b>
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
