"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_STORE_URL } from "@/components/brand/links";
import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { PointerLitGroup } from "../shared/PointerLit";
import { SectionLabel } from "../shared/SectionLabel";
import { heroContent, personasContent, type PersonaId } from "./content";
import styles from "./personas.module.css";

/** Tried casual-first so it wins ties by design — the middle ground / safest read. */
const TIE_BREAK_ORDER: PersonaId[] = ["casual", "keeper", "non"];

/**
 * How long a picked answer stays on screen, selected, before the quiz moves
 * on. Long enough to SEE the choice land (the orange fill + check), short
 * enough that it never reads as waiting. Kept under reduced motion too: the
 * beat is a pause, not an animation, and without it the pick is invisible.
 */
const ADVANCE_BEAT_MS = 420;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function emptyScore(): Record<PersonaId, number> {
  return { keeper: 0, casual: 0, non: 0 };
}

/**
 * Scoring is unchanged from the original quiz: every answer adds one to the
 * persona it is tagged with, and the tie-break reduce keeps `casual` winning
 * ties. The only difference is that the tally is DERIVED from the answers
 * rather than accumulated click by click — that is what makes Back safe
 * (changing an answer can't double-count it).
 */
function scoreAnswers(answers: (number | null)[]): PersonaId {
  const score = emptyScore();
  answers.forEach((optionIndex, questionIndex) => {
    if (optionIndex === null) return;
    const persona = personasContent.questions[questionIndex].options[optionIndex].persona;
    score[persona] += 1;
  });
  return TIE_BREAK_ORDER.reduce((a, b) => (score[b] > score[a] ? b : a), TIE_BREAK_ORDER[0]);
}

/**
 * 03 Personas — the page's FIRST navy beat (Nico, 2026-09-23: "this is when it
 * should change to blue for the first time").
 *
 * One question at a time: a progress bar ("Question 1 of 3" + three steps),
 * four full-card answers, auto-advance after a short beat, a Back button, and
 * a result screen that says what the persona means and ends on ONE action
 * (the page's own "Download the app" CTA) plus "Take it again".
 *
 * Ink: everything that sits on the ground uses --flow-fg / --flow-fg-2 so it
 * crossfades with the ground. The only fixed colours are the orange selected
 * state and the orange CTA, which are elevated fills with their own navy text.
 */
export function Personas() {
  const questions = personasContent.questions;
  const questionCount = questions.length;

  /** 0..questionCount-1 = questions, questionCount = result. */
  const [step, setStep] = useState(0);
  /** Option index chosen per question, or null. */
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(questionCount).fill(null));
  /** True during the beat between a pick and the advance — input is locked. */
  const [pending, setPending] = useState(false);
  /** Which way the panel slides in: forward after a pick, back after Back. */
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  /** Screen-reader progress line. Empty until the visitor does something. */
  const [announcement, setAnnouncement] = useState("");

  /** False until the visitor first picks/navigates: no focus moves, no slide-in on first paint. */
  const [interacted, setInteracted] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  // After every step change the visitor caused, move focus to the new
  // panel's heading. The button they just pressed has unmounted, so without
  // this a keyboard user would be thrown back to the top of the page.
  useEffect(() => {
    if (!interacted) return;
    headingRef.current?.focus({ preventScroll: true });
  }, [step, interacted]);

  const isResult = step >= questionCount;
  const winner = isResult ? scoreAnswers(answers) : null;
  const result = winner ? personasContent.results.find((r) => r.id === winner) ?? null : null;

  function goTo(nextStep: number, nextAnswers: (number | null)[], dir: "forward" | "back") {
    setInteracted(true);
    setDirection(dir);
    setStep(nextStep);
    setPending(false);
    if (nextStep >= questionCount) {
      const id = scoreAnswers(nextAnswers);
      const r = personasContent.results.find((x) => x.id === id);
      setAnnouncement(r ? `Your result: ${r.eyebrow}. ${r.title}` : "");
    } else {
      setAnnouncement(`Question ${nextStep + 1} of ${questionCount}: ${questions[nextStep].prompt}`);
    }
  }

  function pick(questionIndex: number, optionIndex: number) {
    if (pending || questionIndex !== step) return;
    const next = [...answers];
    next[questionIndex] = optionIndex;
    setAnswers(next);
    setPending(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      goTo(questionIndex + 1, next, "forward");
    }, ADVANCE_BEAT_MS);
  }

  function back() {
    if (step === 0) return;
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    goTo(step - 1, answers, "back");
  }

  function restart() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const cleared = Array(questionCount).fill(null);
    setAnswers(cleared);
    goTo(0, cleared, "back");
  }

  // The first paint (server + hydration) shows Question 1 at rest; only
  // panels the visitor navigated to get the slide-in.
  const panelMotion = interacted
    ? direction === "forward"
      ? styles.enterForward
      : styles.enterBack
    : undefined;

  const question = isResult ? null : questions[step];

  return (
    <FlowSection ground="navy" index="03" className={styles.section}>
      <div className={styles.inner}>
        <Reveal variant="up" style={{ textAlign: "center" }}>
          <SectionLabel index="03">{personasContent.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="mx-auto max-w-[24ch] [font-family:var(--font-display)] font-bold text-[length:var(--fs-h2)] leading-[1.03] tracking-[-.02em]"
          >
            {personasContent.headline}
          </WordReveal>
          <p className={styles.intro}>{personasContent.intro}</p>
        </Reveal>

        <Reveal variant="up">
          <div className={styles.quiz} role="group" aria-label="Receipt personality quiz, three questions">
            {/* Progress: Back on the left, "Question N of 3" on the right,
                three steps underneath. The steps are decoration for sighted
                visitors; the text line is the accessible progress. */}
            <div className={styles.progress}>
              <div className={styles.progressRow}>
                <button
                  type="button"
                  className={cn(styles.back, step === 0 && styles.backHidden)}
                  onClick={back}
                  disabled={step === 0}
                  aria-hidden={step === 0 || undefined}
                >
                  <span aria-hidden="true" className={styles.backArrow}>
                    ←
                  </span>
                  Back
                </button>
                <span className={styles.progressText}>
                  {isResult ? "Your result" : `Question ${step + 1} of ${questionCount}`}
                </span>
              </div>
              <ol className={styles.steps} aria-hidden="true">
                {questions.map((q, i) => (
                  <li
                    key={q.prompt}
                    className={cn(
                      styles.stepSeg,
                      (i < step || isResult) && styles.stepDone,
                      i === step && !isResult && styles.stepCurrent,
                    )}
                  />
                ))}
              </ol>
            </div>

            <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
              {announcement}
            </p>

            <div className={styles.stage}>
              {question ? (
                <div key={`q-${step}`} className={cn(styles.panel, panelMotion)}>
                  <h3 ref={headingRef} tabIndex={-1} id={`quiz-q-${step}`} className={styles.prompt}>
                    {question.prompt}
                  </h3>
                  <p className={styles.hint}>{personasContent.tapHint}</p>
                  <PointerLitGroup
                    className={cn(styles.options, pending && styles.optionsPending)}
                    role="group"
                    aria-labelledby={`quiz-q-${step}`}
                  >
                    {question.options.map((option, oi) => {
                      const selected = answers[step] === oi;
                      return (
                        <button
                          key={option.label}
                          type="button"
                          data-lit="dark"
                          className={cn(styles.option, selected && styles.optionSelected)}
                          onClick={() => pick(step, oi)}
                          aria-pressed={selected}
                          aria-disabled={pending || undefined}
                        >
                          <span className={styles.optionLetter} aria-hidden="true">
                            {LETTERS[oi]}
                          </span>
                          <span className={styles.optionLabel}>{option.label}</span>
                          <span className={styles.optionCheck} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </PointerLitGroup>
                </div>
              ) : result ? (
                <div key="result" className={cn(styles.panel, styles.resultPanel, panelMotion)}>
                  <div className={styles.resultCard}>
                    <span className={styles.resultTag}>{result.tag}</span>
                    <div className={styles.resultEyebrow}>{result.eyebrow}</div>
                    <h3 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
                      {result.title}
                    </h3>
                    <p className={styles.resultBody}>{result.body}</p>
                  </div>
                  <div className={styles.resultActions}>
                    <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
                      {heroContent.ctaLabel}
                    </a>
                    <span className={styles.ctaSub}>{heroContent.ctaSubtext}</span>
                  </div>
                  <button type="button" className={styles.retake} onClick={restart}>
                    <span aria-hidden="true">↺</span>
                    {personasContent.restartLabel}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </FlowSection>
  );
}
