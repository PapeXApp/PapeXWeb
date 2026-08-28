"use client";

// app/merchant/intelligence/page.tsx
//
// `/merchant/intelligence` (milestone M6, plan.md §6 / docs/
// COMPETITOR_INSIGHTS_USE_CASES.md §4) — a sibling of Insights, not a
// replacement. Insights answers "what happened"; Intelligence answers "what
// should I do."
//
// This file owns SECTION ORDER ONLY and fetches nothing itself — every
// section below is self-contained: it fetches its own data, owns its own
// loading/error state, and degrades on its own terms. That's deliberate,
// not incidental: forensics, cross-shopping, and traffic-index are three
// independent calls (property 4 of this build), and if page.tsx held any of
// that state, one failing fetch could take the others down with it via a
// shared error/loading gate. Composing pre-fetched sections instead makes
// that structurally impossible.
//
// Reading order (use-cases doc §4): alarm -> identity -> opportunity ->
// context.
//   1. Needs your attention   — AttentionSection (Family H, own receipts only)
//   2. Your customers         — RESERVED, not this build (see comment below)
//   3. Money on the table     — RESERVED, not this build (see comment below)
//   4. Beyond your four walls — BeyondYourWallsSection (the panel product;
//      least certain, most legally sensitive, so it runs last — "a reward,
//      not a claim")
// The panel section renders its own basis banner + DemoRibbon + closing
// disclosure internally, since page.tsx has no data of its own to hand it.

import { T } from "../ui/tokens";
import AttentionSection from "./sections/AttentionSection";
import BeyondYourWallsSection from "./sections/BeyondYourWallsSection";

export default function IntelligencePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
          Intelligence
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
          What&apos;s happening in your own receipts, and — carefully, categorically — beyond them.
        </p>
      </div>

      <AttentionSection />

      {/*
        Section 2 — "Your customers" (returning-customer rate, lapsed
        regulars, tap-rate loyalty link — use-cases doc §4 Family E).
        Reserved, not built in M6. No placeholder card: an empty slot here
        would either look broken or read as a promise this milestone doesn't
        keep. Add a <YourCustomersSection /> import + line here when that
        work lands.
      */}

      {/*
        Section 3 — "Money on the table" (attachment rate, basket affinity,
        cannibalization, price-change read — use-cases doc §4 Family B/C).
        Reserved, not built in M6. Same no-placeholder rule as above.
      */}

      <BeyondYourWallsSection />
    </div>
  );
}
