"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "@/components/motion";
import { Atmosphere, AtmosphereContent } from "./Atmosphere";
import { personasContent, type PersonaId } from "./content";
import styles from "./customer.module.css";

/** Tried casual-first so it wins ties by design — the middle ground / safest read. */
const TIE_BREAK_ORDER: PersonaId[] = ["casual", "keeper", "non"];

function emptyScore(): Record<PersonaId, number> {
  return { keeper: 0, casual: 0, non: 0 };
}

/** 2.4 Personas — white, three-question quiz (12 options, keeper/casual/non scoring). */
export function Personas() {
  const questionCount = personasContent.questions.length;
  const [step, setStep] = useState(0); // 0..questionCount-1 = questions, questionCount = result
  const [score, setScore] = useState<Record<PersonaId, number>>(emptyScore);
  const [winner, setWinner] = useState<PersonaId | null>(null);

  function answer(persona: PersonaId) {
    const next = { ...score, [persona]: score[persona] + 1 };
    setScore(next);
    if (step < questionCount - 1) {
      setStep(step + 1);
      return;
    }
    const result = TIE_BREAK_ORDER.reduce((a, b) => (next[b] > next[a] ? b : a), TIE_BREAK_ORDER[0]);
    setWinner(result);
    setStep(questionCount);
  }

  function restart() {
    setScore(emptyScore());
    setWinner(null);
    setStep(0);
  }

  return (
    <section
      data-nav-theme="light"
      className={styles.atmosHost}
      style={{
        background: "var(--white)",
        color: "var(--navy)",
        padding: "clamp(90px,11vw,160px) clamp(20px,5vw,56px)",
      }}
    >
      <Atmosphere tone="light" seam="top" lines="none" />
      <AtmosphereContent style={{ maxWidth: 1150, margin: "0 auto" }}>
        <Reveal variant="up" style={{ textAlign: "center" }}>
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
            {personasContent.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="mx-auto max-w-[24ch] [font-family:var(--font-display)] font-bold text-[clamp(30px,4.4vw,58px)] leading-[1.03] tracking-[-.02em]"
          >
            {personasContent.headline}
          </WordReveal>
          <p style={{ margin: "18px auto 0", fontSize: 17, lineHeight: 1.55, color: "#5a5a5a", maxWidth: "46ch" }}>
            {personasContent.intro}
          </p>
        </Reveal>

        <Reveal variant="up">
          <div
            className={styles.quiz}
            role="group"
            aria-label="Which one are you? — three question quiz"
            aria-live="polite"
          >
            {personasContent.questions.map((question, i) => (
              <div
                key={question.prompt}
                className={cn(styles.quizCard, step === i && styles.quizCardOn)}
                aria-hidden={step !== i}
              >
                <div className={styles.quizPrompt}>{question.prompt}</div>
                <div className={styles.quizOpts}>
                  {question.options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className={styles.quizOpt}
                      onClick={() => answer(option.persona)}
                      disabled={step !== i}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div
              className={cn(styles.quizCard, step === questionCount && styles.quizCardOn)}
              style={{ textAlign: "center" }}
              aria-hidden={step !== questionCount}
            >
              <div className={styles.quizResults}>
                {personasContent.results.map((result) => (
                  <div key={result.id} className={cn(styles.quizResult, winner === result.id && styles.quizResultYou)}>
                    <span className={styles.quizTag}>{result.tag}</span>
                    <div className={styles.quizResultEyebrow}>{result.eyebrow}</div>
                    <div className={styles.quizResultTitle}>{result.title}</div>
                    <p className={styles.quizResultBody}>{result.body}</p>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.quizRestart} onClick={restart} disabled={step !== questionCount}>
                {personasContent.restartLabel}
              </button>
            </div>
          </div>

          <div className={styles.quizSteps} aria-hidden="true">
            {Array.from({ length: questionCount }).map((_, i) => (
              <span key={i} className={cn(styles.quizPip, i <= Math.min(step, questionCount - 1) && styles.quizPipOn)} />
            ))}
          </div>
        </Reveal>
      </AtmosphereContent>
    </section>
  );
}
