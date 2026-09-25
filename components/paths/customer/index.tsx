"use client";

import { useEffect } from "react";
import { FlowGround } from "../shared/FlowGround";
import { Faq } from "../shared/Faq";
import { SiteFooter } from "@/components/brand/site-footer";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { MarqueeBand } from "./MarqueeBand";
import { Personas } from "./Personas";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { Vision } from "./Vision";
import { Privacy } from "./Privacy";
import { customerFaq, customerFaqHeading } from "./faq";
import styles from "./customer.module.css";

/**
 * "For Customers" homepage — Screen 2 of the forked landing redesign.
 *
 * Sections no longer paint their own bands. Each declares a ground and
 * FlowGround crossfades ONE page-level ground between them (see
 * components/paths/shared/flow.module.css).
 *
 * Web 2.1 FINAL ORDER (Nico, 2026-09-24, merge wiring). Show WHAT first,
 * then answer the visitor's next question, in the order they ask it:
 *   01 Hero                              light
 *   02 How it works (walkthrough)        light  (the hero cue scrolls here)
 *      ribbon                            (no ground of its own)
 *   03 Problem — "Why does it matter?"   light
 *   04 Quiz — "What's in it for you?"    NAVY
 *   05 Features — "What else can I do?"  NAVY   id="features"
 *      (the quiz result re-orders Features' five rows and swaps their
 *      lines/titles/phones: personaStore.ts; restored as two sections in
 *      P3-C3 after the P3-C2 merge — Nico: "don't touch the questionnaire")
 *   06 Privacy                           light
 *   07 Get it — Vision + Download        NAVY
 *   08 FAQ                               NAVY   id="faq"
 *      footer                            NAVY   (FlowGround's footer slot,
 *                                                outside <main>)
 * 04→05 is navy next to navy by Nico's order; 07→08→footer is also navy next
 * to navy, so there's no colour change from Get it through the footer;
 * everything else alternates.
 *
 * The [NN] eyebrows live inside each section file (or are passed as
 * `eyebrowIndex` for the shared Faq and Privacy); keep them in step with
 * this list.
 *
 * `initial="light"` is the hero's colour and MUST match the fork's bottom half.
 *
 * Screens, not sections (2026-09-23): from 821px every section here is at
 * least one viewport tall with its content centred (`styles.screen` in
 * customer.module.css) — the model /business adopted on 2026-09-22 — and
 * inner spacing uses the shared --gap-title/--gap-body/--gap-list rhythm.
 * The How-it-works runway is taller than a screen by design (it pins).
 *
 * `styles.path` is a `display: contents` wrapper: it draws no box and exists
 * only to carry the --section-pad alias every section reads (see the top of
 * customer.module.css for why it can't sit on `:global(.rd)`).
 */
export function CustomerPath() {
  // The fork's commit already scrolls to 0 before it pushes here (fork.tsx —
  // not ours to edit), and a fresh load has nowhere else to start. This is
  // the belt-and-braces half: `history.scrollRestoration` defaults to
  // "auto", so a plain reload of a scrolled `/customers` (or any scroll
  // restoration Next itself attempts on the App Router) can otherwise land
  // mid-page — Nico: "the phone scrolls in the wrong place... should start
  // at top." A hash means someone linked to a spot on the page on purpose;
  // leave that alone.
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.path}>
      <FlowGround initial="light" footer={<SiteFooter inFlow />}>
        <Hero />
        <HowItWorks />
        <MarqueeBand />
        <Problem />
        <Personas />
        <Features />
        <Privacy eyebrowIndex="06" />
        <Vision />
        <Faq id="faq" eyebrowIndex="08" ground="navy" heading={customerFaqHeading} items={customerFaq} />
      </FlowGround>
    </div>
  );
}
