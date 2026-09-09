"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "@/components/motion";
import { problemContent, type ProblemCardId } from "./content";
import styles from "./customer.module.css";

// ---- card "print" — receipts eject faster and faster (240ms -> 40ms ramp), then the paper runs out ----
const PRINTER_SLIP_COUNT = 20;
const PRINTER_SLIPS: { delay: number; dx: number; rot: number }[] = (() => {
  const slips: { delay: number; dx: number; rot: number }[] = [];
  let t = 0;
  for (let k = 0; k < PRINTER_SLIP_COUNT; k++) {
    const gap = 240 - 200 * (k / (PRINTER_SLIP_COUNT - 1)); // 240ms -> 40ms ramp
    t += gap;
    const sign = k % 2 ? 1 : -1;
    slips.push({
      delay: t,
      dx: sign * (14 + ((k * 4.5) % 62)),
      rot: sign * (12 + ((k * 7) % 46)),
    });
  }
  return slips;
})();
const PRINTER_DURATION = PRINTER_SLIPS[PRINTER_SLIPS.length - 1].delay + 900;

// ---- card "forest" — a forest grows in, then one axe swing takes it down ----
const FOREST_TREE_COUNT = 11;
const FOREST_GROWN_MS = FOREST_TREE_COUNT * 68 + 400;
const FOREST_AXE_DELAY = FOREST_GROWN_MS + 120;
const FOREST_FELL_START = FOREST_GROWN_MS + 400;
const FOREST_TREES = Array.from({ length: FOREST_TREE_COUNT }, (_, k) => ({
  left: 7 + k * 8.2,
  growDelay: k * 68,
  fellDelay: FOREST_FELL_START + k * 26,
}));
const FOREST_DURATION = FOREST_FELL_START + FOREST_TREE_COUNT * 26 + 620;

// ---- card "proof" — one blank receipt feeds out ----
const ZERO_DURATION = 1500;

const SCENE_DURATION: Record<ProblemCardId, number> = {
  print: PRINTER_DURATION,
  forest: FOREST_DURATION,
  proof: ZERO_DURATION,
};

/** Wait for the flip to expose the back face before the scene runs — matches the design spec. */
const FLIP_TO_SCENE_MS = 360;

interface CardState {
  flipped: boolean;
  playing: boolean; // scene elements are mounted and animating (CSS-driven, timed by mount)
  revealed: boolean; // the stat has popped in and the scene is cleared
}

function closedState(): CardState {
  return { flipped: false, playing: false, revealed: false };
}

function PrinterScene() {
  return (
    <div aria-hidden="true" className={styles.flipStage}>
      <div className={styles.scenePrinter} />
      {PRINTER_SLIPS.map((slip, i) => (
        <div
          key={i}
          className={styles.sceneSlip}
          style={
            {
              "--dx": `${slip.dx}px`,
              "--rot": `${slip.rot}deg`,
              animationDelay: `${slip.delay}ms`,
            } as CSSProperties
          }
        >
          <span className={styles.sceneSlipLine} style={{ top: 9 }} />
          <span className={styles.sceneSlipLine} style={{ top: 16 }} />
          <span className={styles.sceneSlipLine} style={{ top: 23 }} />
        </div>
      ))}
    </div>
  );
}

function ForestScene() {
  return (
    <div aria-hidden="true" className={styles.flipStage}>
      <div className={styles.sceneGround} />
      {FOREST_TREES.map((tree, i) => (
        <div
          key={i}
          className={styles.sceneTree}
          style={{
            left: `${tree.left}%`,
            animation: `sceneGrow .4s cubic-bezier(.16,1,.3,1) ${tree.growDelay}ms forwards, sceneFell .5s cubic-bezier(.6,0,.4,1) ${tree.fellDelay}ms forwards`,
          }}
        >
          <b className={styles.sceneTreeCanopy} />
          <u className={styles.sceneTreeTrunk} />
        </div>
      ))}
      <div
        className={styles.sceneAxe}
        style={{ animation: `sceneSwing .62s cubic-bezier(.5,0,.3,1) ${FOREST_AXE_DELAY}ms forwards` }}
      />
    </div>
  );
}

function ZeroScene() {
  return (
    <div aria-hidden="true" className={styles.flipStage}>
      <div className={cn(styles.sceneZero, styles.sceneZeroFeed)}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 46,
            color: "var(--navy)",
            lineHeight: 1,
          }}
        >
          0
        </span>
        <span style={{ display: "block", marginTop: 10, height: 1.5, background: "#ececec" }} />
        <span style={{ display: "block", marginTop: 5, height: 1.5, background: "#f0f0f0" }} />
        <span style={{ display: "block", marginTop: 5, height: 1.5, background: "#f4f4f4" }} />
      </div>
    </div>
  );
}

const SCENES: Record<ProblemCardId, () => ReactElement> = {
  print: PrinterScene,
  forest: ForestScene,
  proof: ZeroScene,
};

/** Front-face icon per card — small decorative markup, not reused elsewhere. */
function CardIcon({ id }: { id: ProblemCardId }) {
  if (id === "print") {
    return (
      <div
        aria-hidden="true"
        style={{
          width: 58,
          height: 44,
          borderRadius: "7px 7px 4px 4px",
          background: "linear-gradient(160deg,var(--navy-raised),var(--navy-deep))",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 9,
            right: 9,
            bottom: 8,
            height: 3,
            borderRadius: 2,
            background: "rgba(245,245,245,.3)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: -11,
            height: 14,
            background: "#fff",
            border: "1px solid var(--hairline-3)",
            borderRadius: 2,
          }}
        />
      </div>
    );
  }
  if (id === "forest") {
    return (
      <div aria-hidden="true" style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
        <span
          style={{
            display: "block",
            width: 0,
            height: 0,
            borderLeft: "11px solid transparent",
            borderRight: "11px solid transparent",
            borderBottom: "30px solid #2f7d4f",
          }}
        />
        <span
          style={{
            display: "block",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "22px solid #3c9160",
          }}
        />
        <span
          style={{
            display: "block",
            width: 0,
            height: 0,
            borderLeft: "11px solid transparent",
            borderRight: "11px solid transparent",
            borderBottom: "30px solid #2f7d4f",
          }}
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: 56,
        padding: "10px 8px 12px",
        background: "#fff",
        border: "1.5px solid var(--hairline-3)",
        borderRadius: 3,
        boxShadow: "0 6px 16px rgba(0,18,29,.1)",
      }}
    >
      <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "var(--navy)", lineHeight: 1 }}>
        $0
      </span>
      <span style={{ display: "block", marginTop: 6, height: 1.5, background: "#ececec" }} />
      <span style={{ display: "block", marginTop: 4, height: 1.5, background: "#f0f0f0" }} />
    </div>
  );
}

function FlipCard({ id, question, hint, value, caption }: (typeof problemContent.cards)[number]) {
  const [state, setState] = useState<CardState>(closedState);
  const prefersReduced = useReducedMotion();
  const timers = useRef<number[]>([]);
  const Scene = SCENES[id];

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function toggle() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const opening = !state.flipped;
    setState({ flipped: opening, playing: false, revealed: false });
    if (!opening) return;

    if (prefersReduced) {
      setState({ flipped: true, playing: false, revealed: true });
      return;
    }
    const toScene = window.setTimeout(() => {
      setState((s) => (s.flipped ? { ...s, playing: true } : s));
      const toReveal = window.setTimeout(() => {
        setState((s) => (s.flipped ? { flipped: true, playing: false, revealed: true } : s));
      }, SCENE_DURATION[id]);
      timers.current.push(toReveal);
    }, FLIP_TO_SCENE_MS);
    timers.current.push(toScene);
  }

  return (
    <button
      type="button"
      aria-pressed={state.flipped}
      aria-label={`Flip card: ${question}`}
      onClick={toggle}
      className={cn(styles.flipCard, state.flipped && styles.flipCardFlipped)}
      style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, textAlign: "inherit", font: "inherit" }}
    >
      <div className={styles.flipCardInner}>
        <div className={styles.flipFace}>
          <CardIcon id={id} />
          <div
            style={{
              marginTop: 14,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 21,
              color: "var(--navy)",
              lineHeight: 1.2,
              maxWidth: "18ch",
            }}
          >
            {question}
          </div>
          <span className={styles.flipHint}>{hint}</span>
        </div>
        <div className={cn(styles.flipFace, styles.flipFaceBack)}>
          {state.playing && <Scene />}
          <div className={cn(styles.flipResult, state.revealed && styles.flipReveal)}>
            <div className={styles.flipNum}>{value}</div>
            <p className={styles.flipCap}>{caption}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

/** 2.2 Problem — light. Three tap-to-flip cards, each with a scripted scene on the back. */
export function Problem() {
  return (
    <section
      data-nav-theme="light"
      style={{
        background: "var(--offwhite)",
        color: "var(--navy)",
        padding: "clamp(90px,11vw,170px) clamp(20px,5vw,56px)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            {problemContent.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[clamp(32px,4.6vw,62px)] leading-[1.02] tracking-[-.02em]"
          >
            {problemContent.headline}
          </WordReveal>
        </Reveal>
        <Reveal variant="up">
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
              gap: "clamp(20px,3vw,40px)",
              marginTop: "clamp(50px,6vw,90px)",
            }}
          >
            {problemContent.cards.map((card) => (
              <FlipCard key={card.id} {...card} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
