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
 * components/paths/shared/flow.module.css). One swap, not five (2026-09-10):
 *   01 Hero light · 02 Problem light · ribbon · 03 Personas light ·
 *   04 Features NAVY · 05 HowItWorks light · 06 Vision navy · footer navy
 * Three flips, not one (2026-09-22): the app-shot section takes a dark beat in
 * the middle of the light run, then the page closes navy through the footer,
 * which now rides inside the flow as a navy FlowSection (see below).
 * 2026-09-23: the "At a glance" section (Proof, was 06) is gone — its three
 * facts moved into Vision, which is now the one closing screen (06).
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
        <Problem />
        <MarqueeBand />
        <Personas />
        <Features />
        <HowItWorks />
        <Vision />
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
