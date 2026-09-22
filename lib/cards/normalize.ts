// lib/cards/normalize.ts
//
// The client half of the cards contract: turn whatever came back from the
// cards source into a list of cards that is safe to render, or into nothing.
//
// TOTAL. This function never throws, whatever it is handed: `undefined`, a
// string, a v2 envelope, a card with a 10 kB title, a prototype-pollution
// key. Malformed input never reaches JSX, which is what lets the renderer
// trust every field it reads. The rules are the ones in
// contracts/cards/v1/README.md, and they are the rules the Swift port
// implements too:
//
//   ENVELOPE, FAIL CLOSED. Anything wrong with the envelope (not an object,
//     schemaVersion is not 1, the sid is not the sid we asked about, an
//     unknown status, a malformed `merchant`, `cards` not an array) renders
//     NO cards. `none` and `degraded` render no cards either. The receipt
//     itself never depends on any of this.
//   UNKNOWN IS SKIPPED. A card whose `type` is not a v1 type is skipped
//     silently, and so is an action whose `type` is not a v1 action. Newer
//     servers can add types; older clients just don't draw them.
//   KNOWN BUT INVALID IS DROPPED WHOLE. A v1 card with a missing or invalid
//     required field, an invalid optional field, an over-long string, a
//     control or bidi character, an unknown enum value, a bad URL or a bad
//     check digit is dropped entirely. Never repaired, never partly drawn.
//   ELIGIBILITY. An emailCapture card is dropped unless `merchant.partner`
//     is true, and (for an age-restricted merchant) unless it carries
//     `ageAffirmationLabel`.
//   IDS ARE UNIQUE. A card repeating the id of an earlier ACCEPTED card is
//     dropped.
//   AT MOST MAX_RENDERED_CARDS render, counted after all of the above.
//   UNKNOWN PROPERTIES ARE IGNORED, and an optional field sent as `null` is
//   treated as absent (it is what Swift's decodeIfPresent does).
//
// The output objects are rebuilt from known keys only, so nothing the source
// sent beyond the v1 fields survives into the renderer.

import {
  BARCODE_SYMBOLOGIES,
  CARD_ICONS,
  CARD_TYPES,
  CARDS_SCHEMA_VERSION,
  MAX_RENDERED_CARDS,
  type BarcodeSymbology,
  type Card,
  type CardAction,
  type CardsMerchant,
  type CardType,
  type OfferRedemption,
  type OfferValidity,
} from "./types";
import { isValidEan13, isValidUpcA } from "./barcode";
import { parseExpiresAt } from "./countdown";
import { safeHttpsUrl } from "./url";

/** Why a card (or the whole envelope) did not make it to the page. For logs and tests. */
export interface CardDrop {
  index: number;
  id?: string;
  type?: string;
  reason: string;
}

export interface NormalizedCards {
  /** `ok`/`pending` when the envelope was accepted; `none` when it rendered nothing by design or by failure. */
  status: "ok" | "pending" | "none";
  merchant: CardsMerchant;
  cards: Card[];
  /** Only for `pending`, and only when valid. */
  retryAfterMs?: number;
  /** Set when the ENVELOPE was rejected (fail closed). */
  rejected?: string;
  /** Cards that were skipped or dropped, in input order. */
  dropped: CardDrop[];
}

const NO_MERCHANT: CardsMerchant = { partner: false, ageRestricted: false };

function nothing(rejected?: string): NormalizedCards {
  return { status: "none", merchant: { ...NO_MERCHANT }, cards: [], dropped: [], ...(rejected ? { rejected } : {}) };
}

// ---- primitives -----------------------------------------------------------------

class Invalid extends Error {}

function invalid(reason: string): never {
  throw new Invalid(reason);
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Own property only: a `__proto__` or `constructor` key in the JSON is data, never a lookup path. */
function get(o: Obj, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(o, key) ? o[key] : undefined;
}

/**
 * C0 and C1 controls, the Unicode line/paragraph separators, and the bidi
 * embeddings, overrides and isolates. Same class as the schema's plainText
 * pattern. Zero-width joiners are allowed: emoji sequences need them.
 */
const FORBIDDEN_CHARS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/;

/** Length in Unicode code points, as JSON Schema's maxLength counts it. */
export function codePointLength(s: string): number {
  return Array.from(s).length;
}

/** True when `v` is display text the renderer may draw, at most `max` code points. */
export function isPlainText(v: unknown, max: number): v is string {
  return (
    typeof v === "string" &&
    v.length > 0 &&
    /\S/.test(v) &&
    !FORBIDDEN_CHARS.test(v) &&
    codePointLength(v) <= max
  );
}

function reqText(o: Obj, key: string, max: number): string {
  const v = get(o, key);
  if (v === undefined || v === null) invalid(`missing ${key}`);
  if (!isPlainText(v, max)) invalid(`bad ${key}`);
  return v;
}

function optText(o: Obj, key: string, max: number): string | undefined {
  const v = get(o, key);
  if (v === undefined || v === null) return undefined;
  if (!isPlainText(v, max)) invalid(`bad ${key}`);
  return v;
}

function reqEnum<T extends string>(o: Obj, key: string, values: readonly T[]): T {
  const v = get(o, key);
  if (typeof v !== "string" || !(values as readonly string[]).includes(v)) invalid(`bad ${key}`);
  return v as T;
}

function optEnum<T extends string>(o: Obj, key: string, values: readonly T[]): T | undefined {
  const v = get(o, key);
  if (v === undefined || v === null) return undefined;
  return reqEnum(o, key, values);
}

function reqObj(o: Obj, key: string): Obj {
  const v = get(o, key);
  if (!isObj(v)) invalid(`bad ${key}`);
  return v;
}

function optObj(o: Obj, key: string): Obj | undefined {
  const v = get(o, key);
  if (v === undefined || v === null) return undefined;
  if (!isObj(v)) invalid(`bad ${key}`);
  return v;
}

function optArray(o: Obj, key: string, maxItems: number): unknown[] | undefined {
  const v = get(o, key);
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || v.length > maxItems) invalid(`bad ${key}`);
  return v;
}

function reqUrl(o: Obj, key: string): string {
  const v = get(o, key);
  const url = safeHttpsUrl(v);
  if (url == null) invalid(`bad ${key}`);
  return url;
}

function optUrl(o: Obj, key: string): string | undefined {
  const v = get(o, key);
  if (v === undefined || v === null) return undefined;
  return reqUrl(o, key);
}

/** Drops `undefined` values so a normalized card deep-equals the JSON it came from. */
function compact<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) {
    if (o[k] === undefined) delete o[k];
  }
  return o;
}

const CARD_ID_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
const CODE_RE = /^[\x21-\x7E]{1,32}$/;
/** 24 characters keeps a Code 128 module above ~1 CSS px in a 430 px column: dense, still scannable. */
const CODE128_RE = /^[\x20-\x7E]{1,24}$/;
const SID_RE = /^[a-f0-9]{16}$/;

// ---- per-type validators ------------------------------------------------------------

interface CardContext {
  merchant: CardsMerchant;
}

function base(o: Obj) {
  const id = get(o, "id");
  if (typeof id !== "string" || !CARD_ID_RE.test(id)) invalid("bad id");
  return {
    id,
    mode: reqEnum(o, "mode", ["live", "preview"] as const),
    heading: optText(o, "heading", 60),
  };
}

function textCard(o: Obj): Card {
  return compact({
    ...base(o),
    type: "text" as const,
    voice: reqEnum(o, "voice", ["merchant", "papex"] as const),
    icon: optEnum(o, "icon", CARD_ICONS),
    title: optText(o, "title", 120),
    body: reqText(o, "body", 500),
  });
}

function redemption(o: Obj): OfferRedemption {
  const type = reqEnum(o, "type", ["code", "barcode"] as const);
  if (type === "code") {
    const code = get(o, "code");
    if (typeof code !== "string" || !CODE_RE.test(code)) invalid("bad redemption.code");
    return compact({ type, code, caption: optText(o, "caption", 80) });
  }
  const symbology: BarcodeSymbology = reqEnum(o, "symbology", BARCODE_SYMBOLOGIES);
  const value = get(o, "value");
  if (typeof value !== "string") invalid("bad redemption.value");
  const ok =
    symbology === "code128"
      ? CODE128_RE.test(value)
      : symbology === "ean13"
        ? isValidEan13(value)
        : isValidUpcA(value);
  if (!ok) invalid("bad redemption.value");
  return compact({
    type,
    symbology,
    value,
    text: optText(o, "text", 80),
    caption: optText(o, "caption", 80),
  });
}

function validity(o: Obj): OfferValidity {
  const expiresAt = get(o, "expiresAt");
  if (typeof expiresAt !== "string" || parseExpiresAt(expiresAt) == null) invalid("bad validity.expiresAt");
  const countdown = get(o, "countdown");
  if (typeof countdown !== "boolean") invalid("bad validity.countdown");
  return { expiresAt, countdown };
}

/** At most this many actions render on one card, counted after unknown actions are skipped. */
const MAX_RENDERED_ACTIONS = 2;

function actions(o: Obj): CardAction[] | undefined {
  const list = get(o, "actions");
  if (list === undefined || list === null) return undefined;
  if (!Array.isArray(list)) invalid("bad actions");
  const out: CardAction[] = [];
  for (const a of list) {
    // Unknown (or type-less) actions are skipped, like unknown cards; a newer
    // server may send more of them than this client knows.
    if (!isObj(a) || get(a, "type") !== "save") continue;
    // A known action that is invalid invalidates the card, like any field.
    const action: CardAction = { type: "save", label: reqText(a, "label", 80) };
    if (out.length < MAX_RENDERED_ACTIONS) out.push(action);
  }
  return out;
}

function offerCard(o: Obj): Card {
  const v = optObj(o, "validity");
  const r = optObj(o, "redemption");
  return compact({
    ...base(o),
    type: "offer" as const,
    kicker: optText(o, "kicker", 40),
    valueLabel: reqText(o, "valueLabel", 12),
    valueSuffix: optText(o, "valueSuffix", 12),
    qualifier: optText(o, "qualifier", 40),
    title: reqText(o, "title", 160),
    terms: optText(o, "terms", 500),
    validity: v ? validity(v) : undefined,
    redemption: r ? redemption(r) : undefined,
    actions: actions(o),
  });
}

function ctaCard(o: Obj): Card {
  return compact({
    ...base(o),
    type: "cta" as const,
    voice: reqEnum(o, "voice", ["merchant", "papex"] as const),
    title: optText(o, "title", 120),
    body: optText(o, "body", 500),
    label: reqText(o, "label", 40),
    url: reqUrl(o, "url"),
    style: reqEnum(o, "style", ["primary", "secondary"] as const),
  });
}

function savingsCard(o: Obj): Card {
  const components = optArray(o, "components", 10)?.map((c) => {
    if (!isObj(c)) invalid("bad components");
    return { label: reqText(c, "label", 80), amount: reqText(c, "amount", 16) };
  });
  return compact({
    ...base(o),
    type: "savings" as const,
    total: reqText(o, "total", 16),
    totalLabel: reqText(o, "totalLabel", 40),
    components,
  });
}

function loyaltyCard(o: Obj): Card {
  const balance = optObj(o, "balance");
  const progress = optObj(o, "progress");
  let progressOut: { fraction: number; text: string } | undefined;
  if (progress) {
    const fraction = get(progress, "fraction");
    if (typeof fraction !== "number" || !Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
      invalid("bad progress.fraction");
    }
    progressOut = { fraction, text: reqText(progress, "text", 160) };
  }
  return compact({
    ...base(o),
    type: "loyalty" as const,
    programName: reqText(o, "programName", 60),
    earned: optText(o, "earned", 24),
    balance: balance ? { value: reqText(balance, "value", 24), label: reqText(balance, "label", 24) } : undefined,
    balanceWorth: optText(o, "balanceWorth", 40),
    progress: progressOut,
    note: reqText(o, "note", 200),
  });
}

function insightCard(o: Obj): Card {
  const evidence = get(o, "evidence");
  if (!Array.isArray(evidence) || evidence.length < 1 || evidence.length > 8) invalid("bad evidence");
  return compact({
    ...base(o),
    type: "insight" as const,
    kicker: optText(o, "kicker", 40),
    headline: reqText(o, "headline", 160),
    body: reqText(o, "body", 500),
    evidence: evidence.map((row) => {
      if (!isObj(row)) invalid("bad evidence");
      return { label: reqText(row, "label", 40), value: reqText(row, "value", 60) };
    }),
    footnote: optText(o, "footnote", 200),
  });
}

function emailCaptureCard(o: Obj, ctx: CardContext): Card {
  // PARTNER-ONLY. Checked first, so a non-partner's capture card is dropped
  // for the reason that matters rather than for whatever else is wrong with it.
  if (ctx.merchant.partner !== true) invalid("emailCapture requires a partner merchant");

  const consent = reqObj(o, "consent");
  const textId = get(consent, "textId");
  if (typeof textId !== "string" || !CARD_ID_RE.test(textId)) invalid("bad consent.textId");
  const textVersion = get(consent, "textVersion");
  if (typeof textVersion !== "number" || !Number.isInteger(textVersion) || textVersion < 1) {
    invalid("bad consent.textVersion");
  }
  const input = optObj(o, "input");
  const card = compact({
    ...base(o),
    type: "emailCapture" as const,
    kicker: optText(o, "kicker", 40),
    title: optText(o, "title", 120),
    consentLabel: reqText(o, "consentLabel", 300),
    consentNote: optText(o, "consentNote", 200),
    consent: { textId, textVersion },
    input: input
      ? { placeholder: reqText(input, "placeholder", 60), submitLabel: reqText(input, "submitLabel", 40) }
      : undefined,
    ageAffirmationLabel: optText(o, "ageAffirmationLabel", 200),
    privacyUrl: optUrl(o, "privacyUrl"),
  });
  if (card.mode === "live" && !card.input) invalid("live emailCapture requires input");
  if (ctx.merchant.ageRestricted && !card.ageAffirmationLabel) {
    invalid("age-restricted merchant requires ageAffirmationLabel");
  }
  return card;
}

function disclosureCard(o: Obj): Card {
  return compact({ ...base(o), type: "disclosure" as const, text: reqText(o, "text", 280) });
}

const VALIDATORS: Record<CardType, (o: Obj, ctx: CardContext) => Card> = {
  text: textCard,
  offer: offerCard,
  cta: ctaCard,
  savings: savingsCard,
  loyalty: loyaltyCard,
  insight: insightCard,
  emailCapture: emailCaptureCard,
  disclosure: disclosureCard,
};

// ---- the envelope ------------------------------------------------------------------------

/**
 * Validate a cards response for `expectedSid`. Never throws.
 */
export function normalizeResolvedCards(input: unknown, expectedSid: string): NormalizedCards {
  try {
    return normalizeUnsafe(input, expectedSid);
  } catch {
    // Unreachable by construction; here so that "never throws" is a guarantee
    // rather than a claim. Fail closed.
    return nothing("internal");
  }
}

function normalizeUnsafe(input: unknown, expectedSid: string): NormalizedCards {
  if (!isObj(input)) return nothing("not an object");
  if (get(input, "schemaVersion") !== CARDS_SCHEMA_VERSION) return nothing("unsupported schemaVersion");

  const sid = get(input, "sid");
  if (typeof sid !== "string" || !SID_RE.test(sid) || sid !== expectedSid) return nothing("sid mismatch");

  const status = get(input, "status");
  if (status === "none" || status === "degraded") return nothing();
  if (status !== "ok" && status !== "pending") return nothing("unknown status");

  const m = get(input, "merchant");
  if (!isObj(m)) return nothing("bad merchant");
  const partner = get(m, "partner");
  const ageRestricted = get(m, "ageRestricted");
  if (typeof partner !== "boolean" || typeof ageRestricted !== "boolean") return nothing("bad merchant");
  const merchant: CardsMerchant = { partner, ageRestricted };

  const list = get(input, "cards");
  if (!Array.isArray(list)) return nothing("bad cards");

  const retry = get(input, "retryAfterMs");
  const retryAfterMs =
    status === "pending" && typeof retry === "number" && Number.isInteger(retry) && retry >= 0 && retry <= 60_000
      ? retry
      : undefined;

  const cards: Card[] = [];
  const dropped: CardDrop[] = [];
  const seen = new Set<string>();

  list.forEach((raw, index) => {
    const type = isObj(raw) ? get(raw, "type") : undefined;
    const rawId = isObj(raw) ? get(raw, "id") : undefined;
    const id = typeof rawId === "string" ? rawId : undefined;
    if (typeof type !== "string" || !(CARD_TYPES as readonly string[]).includes(type)) {
      dropped.push({ index, id, type: typeof type === "string" ? type : undefined, reason: "unknown type" });
      return;
    }
    let card: Card;
    try {
      card = VALIDATORS[type as CardType](raw as Obj, { merchant });
    } catch (err) {
      dropped.push({ index, id, type, reason: err instanceof Invalid ? err.message : "invalid" });
      return;
    }
    if (seen.has(card.id)) {
      dropped.push({ index, id, type, reason: "duplicate id" });
      return;
    }
    if (cards.length >= MAX_RENDERED_CARDS) {
      dropped.push({ index, id, type, reason: "over the card limit" });
      return;
    }
    seen.add(card.id);
    cards.push(card);
  });

  return { status, merchant, cards, dropped, ...(retryAfterMs != null ? { retryAfterMs } : {}) };
}
