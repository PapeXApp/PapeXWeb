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
import { Proof } from "./Proof";
import { Vision } from "./Vision";

/**
 * "For Customers" homepage — Screen 2 of the forked landing redesign.
 *
 * Sections no longer paint their own bands. Each declares a ground and
 * FlowGround crossfades ONE page-level ground between them (see
 * components/paths/shared/flow.module.css). One swap, not five (2026-09-10):
 *   Hero light · Problem light · ribbon · Personas light · Features NAVY ·
 *   HowItWorks light · Proof navy · Vision navy · footer navy
 * Three flips, not one (2026-09-22): the app-shot section takes a dark beat in
 * the middle of the light run, then the page closes navy through the footer,
 * which now rides inside the flow as a navy FlowSection (see below).
 * `initial="light"` is the hero's colour and MUST match the fork's bottom half.
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
    <FlowGround initial="light">
      <Hero />
      <Problem />
      <MarqueeBand />
      <Personas />
      <Features />
      <HowItWorks />
      <Proof />
      <Vision />
      {/* The footer is the page's navy tail, inside the flow (2026-09-22):
          it declares ground="navy" like any other section, so the last light
          section crossfades into it instead of hitting a hard navy edge.
          `inFlow` makes it paint no background and take --flow-* ink. */}
      <FlowSection ground="navy">
        <SiteFooter inFlow />
      </FlowSection>
    </FlowGround>
  );
}
