"use client";

import { useEffect } from "react";
import { FlowGround } from "../shared/FlowGround";
import { FlowSection } from "../shared/FlowSection";
import { SiteFooter } from "@/components/brand/site-footer";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { MarqueeBand } from "./MarqueeBand";
import { Personas } from "./Personas";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { Vision } from "./Vision";
import styles from "./customer.module.css";

/**
 * "For Customers" homepage — Screen 2 of the forked landing redesign.
 *
 * Sections no longer paint their own bands. Each declares a ground and
 * FlowGround crossfades ONE page-level ground between them (see
 * components/paths/shared/flow.module.css).
 *
 * Web 2.1 FINAL ORDER (Nico, 2026-09-24 — ledger "LOCKED PAGE ORDER" as
 * finalised by the lead). Show WHAT first, then answer the visitor's next
 * question, in the order they ask it:
 *   01 Hero                         light
 *   02 How it works (walkthrough)   light  (the hero cue scrolls here)
 *      ribbon                       (no ground of its own)
 *   03 Quiz — "Is it for me?"       NAVY
 *   04 Problem — "Why does it matter?" light
 *   05 Features — "What else can I do?" NAVY   id="features"
 *   06 Privacy                      light  (SLOT: task C3)
 *   07 Get it — Vision + Download   NAVY
 *   08 FAQ                          light  (SLOT: task C3)   id="faq"
 *      footer                       NAVY
 * Navy never sits next to navy — BUT only once C3's Privacy and FAQ fill
 * their slots. Until then 05→07 and 07→footer are navy-on-navy.
 *
 * The [NN] eyebrows live inside each section file: Personas (03), Problem
 * (04) and Features (05) are owned by other tasks, so their numbers are set
 * there, not here.
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
      <FlowGround initial="light">
        <Hero />
        <HowItWorks />
        <MarqueeBand />
        <Personas />
        <Problem />
        {/* `id="features"` is the footer's "Features" link target (spec
            §3.5). It sits on a plain block wrapper because Features.tsx is
            owned by another task; a block (not display:contents) so the
            browser has a box to scroll to. */}
        <div id="features">
          <Features />
        </div>
        {/* SLOT C3: <Privacy /> from ./Privacy */}
        <Vision />
        {/* `id="faq"` reserves the anchor (footer "FAQ" link + the hero's
            "Questions?" link). When C3's component fills the slot it carries
            id="faq" itself — drop this wrapper's id then, never keep two. */}
        <div id="faq">
          {/* SLOT C3: <Faq id="faq" items={customerFaq} /> */}
        </div>
        {/* The footer is the page's navy tail, inside the flow (2026-09-22):
            it declares ground="navy" like any other section, so the last light
            section crossfades into it instead of hitting a hard navy edge.
            `inFlow` makes it paint no background and take --flow-* ink. */}
        <FlowSection ground="navy">
          <SiteFooter inFlow />
        </FlowSection>
      </FlowGround>
    </div>
  );
}
