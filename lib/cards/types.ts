// lib/cards/types.ts
//
// Receipt cards, format v1: the TypeScript mirror of
// contracts/cards/v1/resolved-cards.schema.json.
//
// WHAT THIS FORMAT IS
//   The OUTPUT of the (future, P1) server-side cards resolver: for one sid,
//   the finished list of cards to draw under the receipt. Rules have already
//   been evaluated and templates already rendered, so every string here is
//   plain display text. Clients render; they never evaluate, template, format
//   money or pick cards. The web renderer (app/r/cards/) and the native App
//   Clip renderer (P3) consume the SAME JSON, and the golden fixtures under
//   contracts/cards/v1/fixtures/ are how both prove it.
//
// WHERE THE TRUTH LIVES
//   The JSON Schema is canonical. This file mirrors it for the compiler and
//   lib/cards/normalize.ts mirrors it at runtime; lib/cards/cards.test.ts runs
//   every fixture through both, so a drift between the three fails a test.
//   The client rules (unknown type skipped, fail closed, how lengths are
//   counted, the countdown arithmetic) are written down in
//   contracts/cards/v1/README.md, which is what the Swift port follows.
//
// Plain data only: no functions, Dates or classes, so a value of these types
// survives JSON.parse(JSON.stringify(x)) unchanged.

/** The one schema version this client understands. Anything else renders no cards. */
export const CARDS_SCHEMA_VERSION = 1 as const;

/** Every card type v1 defines. A `type` outside this list is skipped silently. */
export const CARD_TYPES = [
  "text",
  "offer",
  "cta",
  "savings",
  "loyalty",
  "insight",
  "emailCapture",
  "disclosure",
] as const;
export type CardType = (typeof CARD_TYPES)[number];

/** At most this many cards render, counted after invalid and unknown cards are removed. */
export const MAX_RENDERED_CARDS = 8;

/**
 * `live`: a real card for a real receipt. `preview`: a demo, a merchant
 * preview, or anything whose write actions must stay inert. In P0 the web
 * renderer treats every write action as inert regardless of mode.
 */
export type CardMode = "live" | "preview";

/**
 * Who is speaking, for the two card types whose substrate depends on it.
 * Merchant speech (opaque warm paint) and PapeX speech (dark glass) are never
 * styled alike — see app/r/enrichment.tsx's TWO VOICES note.
 */
export type CardVoice = "merchant" | "papex";

export const CARD_ICONS = ["tag", "gift", "star", "mail", "info", "sparkle", "clock", "bag"] as const;
export type CardIcon = (typeof CARD_ICONS)[number];

interface CardBase {
  /** Stable authored id, `^[a-z0-9][a-z0-9-]{0,47}$`. Unique within a response. */
  id: string;
  mode: CardMode;
  /** Section title drawn above the card, on the page background. */
  heading?: string;
}

// ---- text -------------------------------------------------------------------

export interface TextCard extends CardBase {
  type: "text";
  voice: CardVoice;
  icon?: CardIcon;
  title?: string;
  body: string;
}

// ---- offer ------------------------------------------------------------------

export const BARCODE_SYMBOLOGIES = ["code128", "ean13", "upca"] as const;
export type BarcodeSymbology = (typeof BARCODE_SYMBOLOGIES)[number];

export type OfferRedemption =
  /** A code the shopper reads out or types at the register. */
  | { type: "code"; code: string; caption?: string }
  /** A code the register scans. `text` is the human-readable line under the bars (defaults to `value`). */
  | { type: "barcode"; symbology: BarcodeSymbology; value: string; text?: string; caption?: string };

/**
 * An action on an offer. v1 has one: save the offer (and, by D2, the
 * receipt) to PapeX. P0 renders it as an inert printed instruction.
 */
export type CardAction = { type: "save"; label: string };

export interface OfferValidity {
  /**
   * The last second the offer is valid, UTC, `YYYY-MM-DDTHH:MM:SSZ` (no
   * fractional seconds). The resolver sets it to 23:59:59 local time, in the
   * merchant's timezone, on the final valid day.
   */
  expiresAt: string;
  /** Draw the "N days left" chip. It disappears once `expiresAt` has passed; there is no "Expired" state. */
  countdown: boolean;
}

export interface OfferCard extends CardBase {
  type: "offer";
  /** Small caps line over the value: "Next visit". */
  kicker?: string;
  /** The deal figure, set large: "$10", "25%", "FREE". */
  valueLabel: string;
  /** Beside the figure: "off". */
  valueSuffix?: string;
  /** Under the figure: "On $75+", "No minimum". */
  qualifier?: string;
  /** The offer as one sentence. */
  title: string;
  /** The fine print, fully composed: validity, limit, exclusions. */
  terms?: string;
  validity?: OfferValidity;
  redemption?: OfferRedemption;
  actions?: CardAction[];
}

// ---- cta --------------------------------------------------------------------

export interface CtaCard extends CardBase {
  type: "cta";
  voice: CardVoice;
  title?: string;
  body?: string;
  label: string;
  /** https only, no credentials. Clients re-check before rendering a link. */
  url: string;
  style: "primary" | "secondary";
}

// ---- savings ----------------------------------------------------------------

export interface SavingsCard extends CardBase {
  type: "savings";
  /** "$11.49", formatted by the resolver. */
  total: string;
  /** "saved today". */
  totalLabel: string;
  components?: { label: string; amount: string }[];
}

// ---- loyalty ----------------------------------------------------------------

export interface LoyaltyCard extends CardBase {
  type: "loyalty";
  programName: string;
  /** "+96 pts". */
  earned?: string;
  /** "1,240" + "points". */
  balance?: { value: string; label: string };
  /** "worth $24". */
  balanceWorth?: string;
  /** The rung the shopper is inside (0..1), and the sentence that states it. */
  progress?: { fraction: number; text: string };
  /**
   * REQUIRED. The guardrail line ("PapeX tracks your points. Redeem them at
   * the register like always."). A loyalty card without it is invalid.
   */
  note: string;
}

// ---- insight ----------------------------------------------------------------

export interface InsightCard extends CardBase {
  type: "insight";
  kicker?: string;
  headline: string;
  body: string;
  /** The figures behind the claim. At least one row: an insight never ships without its evidence. */
  evidence: { label: string; value: string }[];
  footnote?: string;
}

// ---- emailCapture -------------------------------------------------------------

/**
 * "Share my email with <merchant>". PARTNER-ONLY: valid only in a response
 * whose `merchant.partner` is true (enforced by the schema, the normalizer and
 * the renderer). INERT IN P0: nothing is submitted or stored, whatever `mode`
 * says, until the legal review (design D4) is done and P2 ships the endpoint.
 *
 * There is deliberately no `checked`/`defaultChecked` field: the consent box
 * cannot be pre-checked because the format has no way to say so.
 */
export interface EmailCaptureCard extends CardBase {
  type: "emailCapture";
  kicker?: string;
  title?: string;
  /** The consent sentence beside the checkbox. Names the merchant and the purpose. */
  consentLabel: string;
  consentNote?: string;
  /** Which versioned consent text `consentLabel` was rendered from. The P2 audit record keys on it. */
  consent: { textId: string; textVersion: number };
  /** The email field and its button. Required when mode is `live`. Absent: a consent-only preview. */
  input?: { placeholder: string; submitLabel: string };
  /** Required when `merchant.ageRestricted` is true (4 CCR §15041 for dispensaries). */
  ageAffirmationLabel?: string;
  privacyUrl?: string;
}

// ---- disclosure ---------------------------------------------------------------

export interface DisclosureCard extends CardBase {
  type: "disclosure";
  text: string;
}

export type Card =
  | TextCard
  | OfferCard
  | CtaCard
  | SavingsCard
  | LoyaltyCard
  | InsightCard
  | EmailCaptureCard
  | DisclosureCard;

// ---- the response envelope ------------------------------------------------------

/**
 * `ok`: cards evaluated. `pending`: receipt facts not indexed yet; fact-free
 * cards may still be present and render. `none`: no cards for this receipt.
 * `degraded`: evaluation failed. `none` and `degraded` always carry `cards: []`.
 */
export type CardsStatus = "ok" | "pending" | "none" | "degraded";

export interface CardsMerchant {
  /**
   * The merchant is a PapeX partner. Email capture exists only for partners:
   * a response with an emailCapture card and `partner !== true` is invalid,
   * and the client drops the card.
   */
  partner: boolean;
  /** Age-restricted goods (cannabis, alcohol): email capture needs an age affirmation. */
  ageRestricted: boolean;
}

export interface ResolvedCards {
  schemaVersion: typeof CARDS_SCHEMA_VERSION;
  /** Echo of the requested sid. A mismatch renders no cards. */
  sid: string;
  status: CardsStatus;
  /** Only with `pending`: when to ask again. */
  retryAfterMs?: number;
  /** Opaque, for logs and support. Never the merchant id. */
  configRef?: string;
  /** Facts about the merchant the client needs to enforce eligibility. Never its id. */
  merchant: CardsMerchant;
  cards: Card[];
}
