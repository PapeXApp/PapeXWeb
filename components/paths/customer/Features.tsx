"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion";
import { PointerLitGroup } from "../shared/PointerLit";
import { SectionLabel } from "../shared/SectionLabel";
import { FeatureShot } from "./FeatureScreens";
import { featuresContent, type FeatureKey } from "./content";
import {
  DEFAULT_PERSONA,
  answerQuizLabel,
  personaFeatureLines,
  personaFeatureOrder,
  personaFeatureTitles,
  pickedHeader,
} from "./personaFeatures";
import { onBeforePersonaChange, requestRetake, usePersona } from "./personaStore";
import styles from "./quizFeatures.module.css";

/** How long a row takes to glide to its new place after the quiz re-sorts. */
const REORDER_MS = 700;

/** After the result, the header's button restarts the quiz rather than just
 *  pointing at it. */
const CHANGE_ANSWERS_LABEL = "Change my answers";

/**
 * The personalised feature rows — the BODY of section 04 (Personas.tsx is the
 * section; the quiz is its head). Not a section of its own any more (P3-C2,
 * 2026-09-25: the quiz and the old 05 Features merged into one section about
 * personalisation).
 *
 * FIVE ROWS, ALWAYS (live features only): Find · Export · Add · Share ·
 * Deals. The quiz result (personaStore.ts, in memory only) sets their ORDER,
 * the benefit line each shows, any per-persona title, and what the phones
 * show (personaFeatures.ts, featureData.ts). Before the quiz — and on the
 * server, and with no JS — the rows show the `casual` order under a
 * "Showing: The Casual" header that invites the visitor to answer.
 *
 * The header is always there and always the same size (label, one summary
 * line, one button), so the rows never move when a result arrives except by
 * the FLIP below.
 *
 * THE RE-SORT is a FLIP on transforms only: the moment the quiz hands over a
 * new persona — synchronously, before React re-renders — each row's offsetTop
 * is read once ("First"); after the commit it is read once more ("Last"), the
 * row is put back where it was with a transform ("Invert") and eased to none
 * ("Play"). No per-frame layout reads. Reduced motion: the rows just land in
 * their new order.
 */
export function Features() {
  const persona = usePersona();
  const active = persona ?? DEFAULT_PERSONA;
  const order = personaFeatureOrder[active];
  const lines = personaFeatureLines[active];
  const titles = personaFeatureTitles[active] ?? {};
  const header = pickedHeader[persona ?? "default"];

  const rowEls = useRef(new Map<FeatureKey, HTMLDivElement>());
  const firstTops = useRef<Map<FeatureKey, number> | null>(null);

  // FIRST — while the DOM still holds the old order.
  useEffect(
    () =>
      onBeforePersonaChange(() => {
        const tops = new Map<FeatureKey, number>();
        rowEls.current.forEach((el, key) => tops.set(key, el.offsetTop));
        firstTops.current = tops;
      }),
    [],
  );

  // LAST, INVERT, PLAY — once, right after the new order commits.
  useLayoutEffect(() => {
    const tops = firstTops.current;
    firstTops.current = null;
    if (!tops) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const moved: HTMLDivElement[] = [];
    rowEls.current.forEach((el, key) => {
      const before = tops.get(key);
      if (before === undefined) return;
      const delta = before - el.offsetTop;
      if (Math.abs(delta) < 1) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      moved.push(el);
    });
    if (!moved.length) return;
    // One forced style flush so the inverted position is the start frame.
    void moved[0].getBoundingClientRect();
    moved.forEach((el) => {
      el.style.transition = `transform ${REORDER_MS}ms cubic-bezier(.22,1,.36,1)`;
      el.style.transform = "";
    });
    const done = window.setTimeout(() => {
      moved.forEach((el) => {
        el.style.transition = "";
      });
    }, REORDER_MS + 50);
    return () => window.clearTimeout(done);
  }, [active]);

  /** Scroll the quiz into view (and, after a result, restart it). Without JS
   *  the plain #quiz anchor still jumps there. */
  function toQuiz(event: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById("quiz");
    if (!target) return;
    event.preventDefault();
    if (persona) requestRetake();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className={styles.list} id="your-picks">
      {/* The header over the rows: who the list is picked for, and why it is
          in this order. Announced politely when a result arrives. */}
      <div className={styles.picked}>
        <div aria-live="polite" aria-atomic="true" className={styles.pickedText}>
          <span key={`label-${active}-${persona ? 1 : 0}`} className={cn(styles.pickedLabel, persona && styles.pickedLabelOn)}>
            {header.label}
          </span>
          <p key={`sum-${active}-${persona ? 1 : 0}`} className={styles.pickedSummary}>
            {header.summary}
          </p>
        </div>
        <a href="#quiz" className={styles.pickedCta} onClick={toQuiz}>
          <span aria-hidden="true" className={styles.pickedCtaArrow}>
            ↑
          </span>
          {persona ? CHANGE_ANSWERS_LABEL : answerQuizLabel}
        </a>
      </div>

      <PointerLitGroup className={styles.rows}>
        {order.map((key, index) => {
          const row = featuresContent.rows[key];
          const mirrored = index % 2 === 1;
          return (
            <div
              key={key}
              className={styles.row}
              data-feature={key}
              ref={(el) => {
                if (el) rowEls.current.set(key, el);
                else rowEls.current.delete(key);
              }}
            >
              {/* Two columns only when the row is wide enough (a container
                  query in quizFeatures.module.css). Stacked, the text ALWAYS
                  comes first, so every phone sits under its own row's words;
                  side by side, rows alternate text/phone by position. */}
              <Reveal variant="up" className={cn(styles.grid, mirrored && styles.gridMirrored)}>
                <div className={styles.text}>
                  <SectionLabel index={`04.${index + 1}`} style={{ marginBottom: 12 }}>
                    {row.eyebrow}
                  </SectionLabel>
                  <h3 key={`t-${key}-${active}`} className={styles.title}>
                    {titles[key] ?? row.title}
                  </h3>
                  <p key={`l-${key}-${active}`} className={styles.line}>
                    {lines[key]}
                  </p>
                  <ul className={styles.tags} aria-label={`${row.eyebrow}: what's included`}>
                    {row.tags.map((tag) => (
                      <li key={tag} className={styles.tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.shotCell}>
                  <FeatureShot feature={key} persona={active} />
                </div>
              </Reveal>
            </div>
          );
        })}
      </PointerLitGroup>
    </div>
  );
}
