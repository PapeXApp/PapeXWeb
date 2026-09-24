// How the quiz (section 04, Personas.tsx) personalises Features (section 05).
//
// Nico, 2026-09-24 (spec §8c): "there needs to be a value add to each; it's
// not IF but HOW we share the story, as there is benefit to all." So every
// persona sees ALL FOUR rows; the result only sets their ORDER and picks the
// benefit line each row shows. The lines below are Nico's, VERBATIM — change
// them only with his sign-off.
//
// Before anyone takes the quiz the page shows `casual`: it is the quiz's
// tie-break winner and the broadest middle ground (spec §8b).

import type { FeatureKey, PersonaId } from "./content";

export const DEFAULT_PERSONA: PersonaId = "casual";

export const personaFeatureOrder: Record<PersonaId, FeatureKey[]> = {
  keeper: ["find", "add", "share", "deals"],
  casual: ["add", "find", "deals", "share"],
  non: ["deals", "find", "share", "add"],
};

export const personaFeatureLines: Record<PersonaId, Record<FeatureKey, string>> = {
  keeper: {
    find: "Your filing system, without the filing: every receipt sorted and searchable.",
    add: "Bring the whole folder: snap your paper receipts and forward email ones to your PapeX address.",
    share: "Send proof of purchase or split a bill in a tap, with a group or one person.",
    deals: "Keep coupons from the stores you shop at, and favorite the ones you'll use.",
  },
  casual: {
    add: "No more digging through your bag and inbox: snap it or forward it, and it's in one place.",
    find: "Find any receipt in seconds, already sorted by store and category.",
    deals: "Coupons from stores you like, saved right next to your receipts.",
    share: "A receipt a friend or roommate needs? Send it in a tap.",
  },
  non: {
    deals: "Something back for your trouble: coupons from stores you shop at, saved and favorited.",
    find: "Tap, save, done. Receipts sort themselves, so the one you need later is already there.",
    share: "Splitting a bill or proving a purchase? Send it in a tap, no digging.",
    add: "Even the paper ones: snap it before you toss it.",
  },
};

/**
 * The small label above the Features rows once the quiz has a result. Named
 * after the quiz's own results (content.ts `personasContent.results`:
 * The Keeper / The Casual / The Non-Keeper). Never shown before the quiz.
 */
export const pickedForYouLabel: Record<PersonaId, string> = {
  keeper: "Picked for you, a Keeper",
  casual: "Picked for you, a Casual keeper",
  non: "Picked for you, a Non-Keeper",
};
