// How the quiz (section 04, Personas.tsx) personalises section 05 Features.
//
// Nico, 2026-09-25: "section four gives you a personalization for section
// five, because that's what PapeX is about, personalization… if I'm a keeper,
// auto categorization and search features are going to be everything, with
// the ability to export. But if I'm a non-keeper, getting all my coupons and
// being able to just find a receipt for a return will be a lot more
// attractive."
//
// Nico, 2026-09-24 (spec §8c): "there needs to be a value add to each; it's
// not IF but HOW we share the story, as there is benefit to all." So every
// persona sees ALL SIX rows; the result sets their ORDER, the benefit line
// each row shows, and (for Find, on the Non-Keeper) the row title.
//
// Lines marked NICO are his, verbatim (2026-09-24) — change them only with his
// sign-off. (P5, 2026-09-29, signed off in q-07: "split a bill" → "share a
// bill", and coupons are the ones you "earn or scan", never "from the stores
// you shop at".) The others are 2026-09-25 (P3-C2) drafts for the new Export row
// and the Non-Keeper's "find it for a return" framing; words are finalised in
// Phase 4.
//
// Before anyone takes the quiz the page shows `casual`: it is the quiz's
// tie-break winner and the broadest middle ground (spec §8b).

import type { FeatureKey, PersonaId } from "./content";

export const DEFAULT_PERSONA: PersonaId = "casual";

/**
 * Keeper: find/organise (search + auto-categorization) and export first.
 * Non-Keeper: coupons first, then finding a receipt for a return.
 * Casual: balanced — getting receipts in, finding them, coupons.
 */
export const personaFeatureOrder: Record<PersonaId, FeatureKey[]> = {
  keeper: ["find", "export", "add", "share", "profiles", "coupons"],
  casual: ["add", "find", "profiles", "coupons", "share", "export"],
  non: ["profiles", "coupons", "find", "share", "add", "export"],
};

export const personaFeatureLines: Record<PersonaId, Record<FeatureKey, string>> = {
  keeper: {
    // NICO
    find: "Your filing system, without the filing: every receipt sorted and searchable.",
    export: "Need them outside the app? Select the receipts you want and share them as one PDF.",
    // NICO
    add: "Bring the whole folder: snap your paper receipts and forward email ones to your PapeX address.",
    // NICO
    share: "Share a receipt, and coupon, with a group or a friend.",
    // NICO (2026-09-29, all personas)
    profiles: "Everything you need from all of your favorite stores.",
    // NICO (2026-09-29, all personas)
    coupons: "Keep the coupons you earn and scan, and swipe to favorite the ones you'll use.",
  },
  casual: {
    // NICO
    add: "Keeping record has never been easier: take a photo, send it to your PapeX email, or tap it.",
    // NICO
    find: "Find any receipt or coupon in seconds, already sorted by store and category.",
    // NICO (2026-09-29, all personas)
    profiles: "Everything you need from all of your favorite stores.",
    // NICO (2026-09-29, all personas)
    coupons: "Keep the coupons you earn and scan, and swipe to favorite the ones you'll use.",
    // NICO
    share: "A receipt a friend or roommate needs? Send it in a tap.",
    export: "Need a few for an expense report? Select them and share one PDF.",
  },
  non: {
    // NICO (2026-09-29, all personas)
    profiles: "Everything you need from all of your favorite stores.",
    // NICO (2026-09-29, all personas)
    coupons: "Keep the coupons you earn and scan, and swipe to favorite the ones you'll use.",
    find: "Returning something? Search the store's name and the receipt is right there.",
    // NICO
    share: "Sharing a bill or proving a purchase? Send it in a tap, no digging.",
    // NICO
    add: "Even the paper ones: snap it before you toss it.",
    export: "And if you ever need a stack of them, select them and share one PDF.",
  },
};

/** Per-persona row titles, where the persona frames the same feature its own
 *  way. Anything not listed uses the shared title in content.ts. */
export const personaFeatureTitles: Partial<Record<PersonaId, Partial<Record<FeatureKey, string>>>> = {
  non: { find: "Find it for a return." },
};

/**
 * The header over the rows. Named after the quiz's own results (content.ts
 * `personasContent.results`: The Keeper / The Casual Keeper / The Non-Keeper).
 * `default` is shown before the quiz (and on the server / with no JS): the
 * casual order, with an invitation to answer.
 */
export const pickedHeader: Record<PersonaId | "default", { label: string; summary: string }> = {
  default: {
    label: "Showing: everyday picks",
    summary: "Answer the 3 questions above to put what matters to you first.",
  },
  keeper: {
    label: "Picked for you: The Keeper",
    summary: "Search, auto-sorting and PDF export first: the tools you'll use most.",
  },
  casual: {
    label: "Picked for you: The Casual Keeper",
    summary: "A little of everything: receipts for returns, coupons to save, and time to save.",
  },
  non: {
    label: "Picked for you: The Non-Keeper",
    summary: "Coupons first, then the receipt you need for a return, with no paper to keep.",
  },
};

/** The invitation button in the default header: jumps back up to the quiz. */
export const answerQuizLabel = "Answer 3 questions";
