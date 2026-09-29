"use client";

import { Reveal, WordReveal } from "@/components/motion";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { PocketScene } from "./pocket/PocketScene";
import { pocketCopy } from "./pocket/pocketCopy";
import cstyles from "./customer.module.css";

// 02 "Every receipt, in your pocket." — LIGHT ground. The customer twin of
// /business §02 "Your store, in their pocket." (business/TapToRetain.tsx).
//
// Most visitors can't tap a PapeX device yet (tapping is live only at select
// Bay Area stores), so the page leads with the free app and this scene shows
// the everyday action: SCANNING. A paper receipt grows, the scanner locks on
// and reads it, and it shrinks into the phone as the new row of the Receipts
// tab; then a paper coupon does the same and lands in the Coupons tab. Two
// caption cards (Receipts / Coupons) highlight in turn. The scene, its
// screens and the reduced-motion static version live in ./pocket.
//
// As on /business, the heading rides INSIDE the pin on tall-enough desktops
// and sits in flow above everywhere else (PocketScene picks by CSS, so
// nothing moves at hydration).
export function Pocket() {
  // One header element tree, placed twice by PocketScene; CSS shows one.
  const header = <Header />;
  return (
    <FlowSection
      id={pocketCopy.id}
      ground="light"
      index="02"
      className={`${cstyles.rhythm} flow-root px-[clamp(20px,5vw,56px)]`}
    >
      <div className="mx-auto w-full max-w-[1150px]">
        <PocketScene header={header} />
      </div>
    </FlowSection>
  );
}

function Header() {
  const t = pocketCopy;
  return (
    <Reveal className="max-w-[820px]">
      <SectionLabel index="02">{t.eyebrow}</SectionLabel>
      <WordReveal
        as="h2"
        className="text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
      >
        {t.heading}
      </WordReveal>
      <p
        className="mt-[var(--gap-title)] max-w-[52ch] text-[length:var(--fs-lead)] leading-[1.55]"
        style={{ color: "var(--flow-fg-2)" }}
      >
        {t.lead}
      </p>
    </Reveal>
  );
}
