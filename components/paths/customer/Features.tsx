"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollReveal, ScrollWipe, ScrollWords } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { NextSection } from "../shared/NextSection";
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
import page from "./customer.module.css";
import styles from "./quizFeatures.module.css";

/** How long a row takes to glide to its new place after the quiz re-sorts. */
const REORDER_MS = 700;

/** After the result, the header's button restarts the quiz rather than just
 *  pointing at it. */
const CHANGE_ANSWERS_LABEL = "Change my answers";

/**
 * 05 Features — NAVY ground, right after the navy quiz (04, Personas.tsx):
 * the quiz's OUTCOME. Nico, 2026-09-25: "so what happens from the quiz
 * changes the output of the section that follows". The quiz is untouched
 * (P3-C3 restored it after the P3-C2 merge); this section is where the result
 * shows — the "Showing / Picked for you" header, then the rows in the
 * persona's order with its lines, titles and phone data. id="features" is the
 * footer's /customers#features target, as at 9ef8fd4.
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

  /** Scroll the quiz (section 04, id="quiz") into view and, after a result,
   *  restart it at Question 1. Without JS the plain #quiz anchor still jumps
   *  there. */
  function toQuiz(event: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById("quiz");
    if (!target) return;
    event.preventDefault();
    if (persona) requestRetake();
    // Land on the section's top, pushed down just enough that the quiz's
    // eyebrow clears the fixed nav (on phones the section's padding alone
    // leaves it under the nav). Two reads, once, on click.
    const navBottom = document.querySelector(".rd-nav")?.getBoundingClientRect().bottom ?? 0;
    const sectionTop = target.getBoundingClientRect().top;
    const lead = target.querySelector("h2")?.parentElement ?? target;
    const leadOffset = lead.getBoundingClientRect().top - sectionTop;
    const clearance = Math.max(0, navBottom + 12 - leadOffset);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: Math.round(sectionTop + window.scrollY - clearance),
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    <FlowSection
      ground="navy"
      index="05"
      id="features"
      className={`${page.screen} ${page.rhythm}`}
      style={{ padding: "var(--section-pad) clamp(20px,5vw,56px)" }}
    >
      {/* One 1150 column for the label, headline, header and rows, so they
          share one left edge. `w-full` because a `margin: 0 auto` item in the
          screen's column flexbox would otherwise shrink to its content. */}
      <div className="w-full" style={{ maxWidth: 1150, margin: "0 auto" }}>
        {/* P3-R1: scroll-linked — label, title word by word, the "Showing"
            header, then each row: its words rise, then its phone wipes open
            (P3-C5, ScrollWipe). The reveal sits
            INSIDE each row, so the re-sort FLIP (a transform on .row) and the
            reveal never write the same element. */}
        <ScrollReveal>
          <SectionLabel index="05">{featuresContent.eyebrow}</SectionLabel>
        </ScrollReveal>
        <ScrollWords
          as="h2"
          className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[length:var(--fs-h2)] leading-[1.03] tracking-[-.02em]"
        >
          {featuresContent.headline}
        </ScrollWords>

        <div className={styles.list}>
          {/* The header over the rows: who the list is picked for, and why it is
              in this order. Announced politely when a result arrives. */}
          <ScrollReveal className={styles.picked}>
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
          </ScrollReveal>

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
                  <div className={cn(styles.grid, mirrored && styles.gridMirrored)}>
                    <ScrollReveal className={styles.text}>
                      <SectionLabel index={`05.${index + 1}`} style={{ marginBottom: 12 }}>
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
                    </ScrollReveal>
                    {/* The app visual OPENS sideways from its own side (P3-C5,
                        restoring the pre-R1 mask wipe as a scroll-linked one):
                        right → left when it sits on the right, left → right on a
                        mirrored row. The side is `--wipe-dir`, set by the same
                        container query that mirrors the row
                        (quizFeatures.module.css), so a stacked row on a phone
                        always opens from the right. */}
                    <ScrollWipe order={1} className={styles.shotCell}>
                      <FeatureShot feature={key} persona={active} />
                    </ScrollWipe>
                  </div>
                </div>
              );
            })}
          </PointerLitGroup>
        </div>
      </div>
      <NextSection targetId="privacy" name="Privacy" />
    </FlowSection>
  );
}
