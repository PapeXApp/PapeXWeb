"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { PointerLitGroup } from "../shared/PointerLit";
import { SectionLabel } from "../shared/SectionLabel";
import { FeatureShot } from "./FeatureScreens";
import { featuresContent, type FeatureKey } from "./content";
import { DEFAULT_PERSONA, personaFeatureLines, personaFeatureOrder, pickedForYouLabel } from "./personaFeatures";
import { onBeforePersonaChange, usePersona } from "./personaStore";
import styles from "./customer.module.css";

/** How long a row takes to glide to its new place after the quiz re-sorts. */
const REORDER_MS = 700;

/**
 * 05 Features — NAVY ground, right after the navy quiz: the two read as one
 * "for you" block (Nico, 2026-09-24).
 *
 * FOUR ROWS, ALWAYS (Web 2.1, live features only): Find · Add · Share ·
 * Deals. The quiz result (personaStore.ts, in memory only) sets their ORDER
 * and which benefit line each shows (personaFeatures.ts). Before the quiz,
 * the page shows the `casual` order and lines. Rows alternate text/shot sides
 * by POSITION, so the rhythm holds in every order.
 *
 * THE RE-SORT is a FLIP on transforms only: the moment the quiz hands over a
 * new persona — synchronously, before React re-renders — each row's offsetTop
 * is read once ("First"); after the commit it is read once more ("Last"), the
 * row is put back where it was with a transform ("Invert") and eased to none
 * ("Play"). No per-frame layout reads. Reduced motion: the rows just land in
 * their new order.
 *
 * `styles.screen` (2026-09-23, screens not sections): the section runs past
 * one viewport, so the screen is a floor, not a fit. The inner columns carry
 * `w-full` because a `margin: 0 auto` item in the screen's column flexbox
 * would otherwise shrink to its content instead of filling the 1150 column.
 */
export function Features() {
  const persona = usePersona();
  const active = persona ?? DEFAULT_PERSONA;
  const order = personaFeatureOrder[active];
  const lines = personaFeatureLines[active];

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

  return (
    <FlowSection
      ground="navy"
      index="05"
      id="features"
      className={`${styles.screen} ${styles.rhythm}`}
      style={{ padding: "var(--section-pad) clamp(20px,5vw,56px)" }}
    >
      {/* Same 1150 column as the rows below, so the label, headline and the
          first row share one left edge. */}
      <div className="w-full" style={{ maxWidth: 1150, margin: "0 auto" }}>
        <Reveal variant="up">
          <SectionLabel index="05">{featuresContent.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="max-w-[20ch] [font-family:var(--font-display)] font-bold text-[length:var(--fs-h2)] leading-[1.03] tracking-[-.02em]"
          >
            {featuresContent.headline}
          </WordReveal>
        </Reveal>
        {/* Held in place (hidden) before the quiz so nothing below jumps when
            it appears. Announced politely when a result arrives. */}
        <p aria-live="polite" style={{ marginTop: "var(--gap-title)" }}>
          <span
            className={cn(styles.featPicked, !persona && styles.featPickedHidden)}
            aria-hidden={!persona || undefined}
          >
            {persona ? pickedForYouLabel[persona] : pickedForYouLabel[DEFAULT_PERSONA]}
          </span>
        </p>
      </div>
      <PointerLitGroup
        className="grid w-full"
        style={{ maxWidth: 1150, margin: "calc(var(--gap-body) * 1.5) auto 0", gap: "clamp(44px,5vw,72px)" }}
      >
        {order.map((key, index) => {
          const row = featuresContent.rows[key];
          const mirrored = index % 2 === 1;
          return (
            <div
              key={key}
              ref={(el) => {
                if (el) rowEls.current.set(key, el);
                else rowEls.current.delete(key);
              }}
            >
              <Reveal
                variant="up"
                className="grid items-center"
                style={{
                  // auto-fit with a floor collapses to one column when two can't
                  // breathe; the min(100%, …) stops the floor itself overflowing
                  // tiny screens.
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
                  gap: "clamp(30px,5vw,80px)",
                }}
              >
                <div style={{ order: mirrored ? 2 : 1 }}>
                  <SectionLabel index={`05.${index + 1}`} style={{ marginBottom: 16 }}>
                    {row.eyebrow}
                  </SectionLabel>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "clamp(28px,3.4vw,46px)",
                      lineHeight: 1.05,
                      letterSpacing: "-.02em",
                    }}
                  >
                    {row.title}
                  </h3>
                  <p
                    key={`${key}-${active}`}
                    className={styles.featLine}
                    style={{
                      marginTop: "var(--gap-title)",
                      fontSize: 17,
                      lineHeight: 1.55,
                      color: "var(--flow-fg-2)",
                      maxWidth: "42ch",
                    }}
                  >
                    {lines[key]}
                  </p>
                  <ul className={styles.featTags} aria-label={`${row.eyebrow}: what's included`}>
                    {row.tags.map((tag) => (
                      <li key={tag} className={styles.featTag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <Reveal variant="mask" className="flex items-center justify-center" style={{ order: mirrored ? 1 : 2 }}>
                  {/* Real app screens, built from PapeXV2's own tokens — see FeatureScreens.tsx. */}
                  <FeatureShot feature={key} />
                </Reveal>
              </Reveal>
            </div>
          );
        })}
      </PointerLitGroup>
    </FlowSection>
  );
}
