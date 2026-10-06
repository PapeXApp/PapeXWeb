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
import { Pocket } from "./Pocket";
import { DownloadCta } from "./DownloadCta";
import { customerFaq, customerFaqHeading } from "./faq";
import styles from "./customer.module.css";

/**
 * "For Customers" homepage — Screen 2 of the forked landing redesign.
 *
 * Sections no longer paint their own bands. Each declares a ground and
 * FlowGround crossfades ONE page-level ground between them (see
 * components/paths/shared/flow.module.css).
 *
 * PAGE ORDER (Web 2.1 P4 reorder, Nico 2026-09-28 — the app first, because
 * most visitors can't tap a PapeX device yet). Render order, with each
 * section's own [NN] eyebrow and id:
 *   [01] Hero — the app                        light
 *   [02] Pocket — the app, step by step        light  id="pocket"
 *   [04] Quiz — "What's in it for you?"        NAVY   id="quiz"
 *   [05] Features — "Once it's yours"          NAVY   id="features"
 *        (the quiz result re-orders Features' five rows and swaps their
 *        lines/titles/phones: personaStore.ts — Nico: "don't touch the
 *        questionnaire")
 *   [03] Problem — "Why does it matter?"       light  id="problem"
 *   [06] How it works — the tap walkthrough    light  id="how-it-works"
 *        ribbon                                (no ground of its own)
 *   [07] Get it — Vision + Download            NAVY   id="get-it"
 *   [08] FAQ + a closing "Download the app"    NAVY   id="faq"
 *        footer                                NAVY   (FlowGround's footer
 *                                              slot, outside <main>)
 * The old Privacy section is retired (its headline became the hero's).
 *
 * The [NN] indexes above are the ones each section file passes; they are
 * no longer rendered (SectionLabel), so their pre-reorder values are harmless.
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
        <Pocket />
        <Personas />
        <Features />
        <Problem />
        <HowItWorks />
        <MarqueeBand />
        <Vision />
        <Faq
          id="faq"
          eyebrowIndex="08"
          ground="light"
          heading={customerFaqHeading}
          items={customerFaq}
          footer={<DownloadCta />}
        />
      </FlowGround>
    </div>
  );
}
