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
 * v1.1 (1.7.0): a response body larger than this many bytes (UTF-8, as
 * received) renders no cards. The resolver never gets near it: 6 cards at
 * their maximum lengths are well under 16 KB.
 */
export const MAX_RESPONSE_BYTES = 32_768;

/**
 * v1.1 (1.7.0): the `surface` query parameter. It is a request parameter and
 * is NOT echoed in the response. `app` is the installed PapeX app's tap
 * landing; `preview` needs a preview key. Audiences are segregated in config:
 * a card configured for `app` is never also configured for `web`/`clip`.
 */
export const CARDS_SURFACES = ["web", "clip", "app", "preview"] as const;
export type CardsSurface = (typeof CARDS_SURFACES)[number];

/**
 * v1.1 (1.7.0): the `caps=` value each 1.7.0 surface sends, verbatim. Comma
 * separated tokens; a card-type token enables that type; `barcode:a|b|c`
 * enables those symbologies. The server drops any card whose type or
 * symbology is not enabled, and ignores unknown tokens.
 *   - `compliance`: the client renders `compliance.licenseLine`. Without it the
 *     server sends NO card from an age-restricted merchant.
 *   - There is no `save` token: the server emits `save` actions only for
 *     `surface=app`, whose client implements them locally.
 *   - All three surfaces send `qr` (v1.1, 2026-09-23 amendment): the web
 *     draws it server-side (lib/cards/qr.ts). Before that amendment the web
 *     row omitted `qr`; see contracts/cards/v1/README.md "v1.1".
 * A client MUST send caps: an absent `caps` means "every v1 type" to the
 * server (the P0 behaviour), which no 1.7.0 client can render.
 */
export const CAPS_1_7_0 = {
  web: "text,offer,cta,savings,disclosure,compliance,barcode:code128|ean13|upca|qr",
  clip: "text,offer,cta,savings,disclosure,compliance,barcode:code128|ean13|upca|qr",
  app: "text,offer,cta,savings,disclosure,compliance,barcode:code128|ean13|upca|qr",
} as const satisfies Record<Exclude<CardsSurface, "preview">, string>;

/** Parse a caps string the way the server does. */
export function parseCaps(caps: string): { types: Set<string>; symbologies: Set<string> } {
  const types = new Set<string>();
  const symbologies = new Set<string>();
  for (const tok of caps.split(",").map((t) => t.trim()).filter(Boolean)) {
    if (tok.startsWith("barcode:")) for (const s of tok.slice(8).split("|")) symbologies.add(s);
    else types.add(tok);
  }
  return { types, symbologies };
}

/**
 * v1.1 (1.7.0): where the card stack sits relative to the receipt.
 * `receipt-first` (the default): cards below the receipt.
 * `cards-first`: cards above the receipt. The receipt still paints first and
 * never waits: clients reserve no space, insert the stack above the receipt
 * once, with a fade, when (and if) it arrives, and never re-order afterwards.
 * A missing, malformed or unknown value is `receipt-first`.
 */
export const LAYOUT_ORDERS = ["receipt-first", "cards-first"] as const;
export type LayoutOrder = (typeof LAYOUT_ORDERS)[number];
export interface CardsLayout {
  order: LayoutOrder;
}

/**
 * v1.1 (1.7.0): the legally required line under a merchant's promotional
 * content, e.g. a cannabis licence number (Cal. B&P §26152(a), 4 CCR §15040).
 * Rendered verbatim, muted, directly under the offer terms (or under the
 * body of a text/cta card). For a `merchant.ageRestricted` merchant, every
 * offer, and every text/cta card in the merchant's voice, MUST carry one; a
 * client drops such a card without it.
 */
export interface CardCompliance {
  /** At most 120 code points. */
  licenseLine: string;
}

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
  /** v1.1. Required when `merchant.ageRestricted` and `voice` is `merchant`. */
  compliance?: CardCompliance;
}

// ---- offer ------------------------------------------------------------------

/** `qr` is v1.1 (1.7.0): at most 80 printable ASCII characters. */
export const BARCODE_SYMBOLOGIES = ["code128", "ean13", "upca", "qr"] as const;
export type BarcodeSymbology = (typeof BARCODE_SYMBOLOGIES)[number];

/**
 * v1.1 (1.7.0), a DISPLAY HINT only: `shared` = one code for everyone,
 * `unique` = a code issued to this receipt (a client may label it "Your
 * code"). The code itself is always already resolved for this sid. An unknown
 * value is ignored (treated as absent); it never drops the card.
 */
export const REDEMPTION_SCOPES = ["shared", "unique"] as const;
export type RedemptionScope = (typeof REDEMPTION_SCOPES)[number];

export type OfferRedemption =
  /** A code the shopper reads out or types at the register. */
  | { type: "code"; code: string; caption?: string; scope?: RedemptionScope }
  /** A code the register scans. `text` is the human-readable line under the bars (defaults to `value`). */
  | { type: "barcode"; symbology: BarcodeSymbology; value: string; text?: string; caption?: string; scope?: RedemptionScope };

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
  /**
   * v1.1 (1.7.0). When true, a client whose clock is past `expiresAt` does not
   * draw the offer at all. Absent/false keeps the P0 behaviour (the offer is
   * drawn, without a chip). The resolver sets it on every non-demo offer and
   * never emits an offer that has already expired.
   */
  hideWhenExpired?: boolean;
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
  /** v1.1. Required when `merchant.ageRestricted`. Drawn under `terms`. */
  compliance?: CardCompliance;
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
  /** v1.1. Required when `merchant.ageRestricted` and `voice` is `merchant`. */
  compliance?: CardCompliance;
}

// ---- savings ----------------------------------------------------------------

/**
 * Always PapeX's voice (glass), never the merchant's. The 1.7.0 "You saved $X
 * with a PapeX coupon" card is this type with a `headline`.
 */
export interface SavingsCard extends CardBase {
  type: "savings";
  /** v1.1: one line above the figure, at most 60 code points ("You saved $4.00 with a PapeX coupon"). */
  headline?: string;
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
  /** v1.1 (1.7.0). Absent, malformed or unknown: `receipt-first`. */
  layout?: CardsLayout;
  cards: Card[];
}
