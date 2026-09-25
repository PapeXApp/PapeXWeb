// How the quiz personalises the feature rows — section 04, Personas.tsx.
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
// persona sees ALL FIVE rows; the result sets their ORDER, the benefit line
// each row shows, and (for Find, on the Non-Keeper) the row title.
//
// Lines marked NICO are his, verbatim (2026-09-24) — change them only with his
// sign-off. The others are 2026-09-25 (P3-C2) drafts for the new Export row
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
  keeper: ["find", "export", "add", "share", "deals"],
  casual: ["add", "find", "deals", "share", "export"],
  non: ["deals", "find", "share", "add", "export"],
};

export const personaFeatureLines: Record<PersonaId, Record<FeatureKey, string>> = {
  keeper: {
    // NICO
    find: "Your filing system, without the filing: every receipt sorted and searchable.",
    export: "Need them outside the app? Select the receipts you want and share them as one PDF.",
    // NICO
    add: "Bring the whole folder: snap your paper receipts and forward email ones to your PapeX address.",
    // NICO
    share: "Send proof of purchase or split a bill in a tap, with a group or one person.",
    // NICO
    deals: "Keep coupons from the stores you shop at, and favorite the ones you'll use.",
  },
  casual: {
    // NICO
    add: "No more digging through your bag and inbox: snap it or forward it, and it's in one place.",
    // NICO
    find: "Find any receipt in seconds, already sorted by store and category.",
    // NICO
    deals: "Coupons from stores you like, saved right next to your receipts.",
    // NICO
    share: "A receipt a friend or roommate needs? Send it in a tap.",
    export: "Need a few for an expense report? Select them and share one PDF.",
  },
  non: {
    // NICO
    deals: "Something back for your trouble: coupons from stores you shop at, saved and favorited.",
    find: "Taking something back? Search the store's name and the receipt is right there, no digging.",
    // NICO
    share: "Splitting a bill or proving a purchase? Send it in a tap, no digging.",
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
 * `personasContent.results`: The Keeper / The Casual / The Non-Keeper).
 * `default` is shown before the quiz (and on the server / with no JS): the
 * casual order, with an invitation to answer.
 */
export const pickedHeader: Record<PersonaId | "default", { label: string; summary: string }> = {
  default: {
    label: "Showing: The Casual",
    summary: "Our everyday order. Answer the 3 questions to put what matters to you first.",
  },
  keeper: {
    label: "Picked for you: The Keeper",
    summary: "Search, auto-sorting and PDF export first: the tools you'll use most.",
  },
  casual: {
    label: "Picked for you: The Casual",
    summary: "A bit of everything: getting receipts in, finding them, and coupons.",
  },
  non: {
    label: "Picked for you: The Non-Keeper",
    summary: "Coupons first, then the receipt you need for a return, with no paper to keep.",
  },
};

/** The invitation button in the default header: jumps back up to the quiz. */
export const answerQuizLabel = "Answer 3 questions";
