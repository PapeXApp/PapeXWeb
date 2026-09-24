// lib/cards/testVariants.ts
//
// The 1.7.0 VARIANT FIXTURE SET, as data. One definition per test sid emits:
//   - contracts/cards/v1/fixtures/variants/<variant>[.<surface>].json
//       the EXACT resolved response a client gets for that sid and surface
//       (the RDH resolver must reproduce it byte for byte, `configRef` aside);
//   - contracts/cards/v1/fixtures/variants/INDEX.json
//       test sid -> variant -> merchant/template -> per-surface file + expected ids;
//   - contracts/cards/v1/config-examples/test-cards*.json
//       the two TEST merchant configs (merchant-config.schema.json) that make a
//       conforming resolver produce exactly those responses.
//
// The committed JSON is the artefact other repos vendor; this file is how it
// is produced. lib/cards/cards.test.ts fails if the two disagree. Regenerate:
//   npx tsx lib/cards/cards.test.ts --update-variants
//
// Copy is built on the Tech Week demo stories (lib/demoReceipts.ts): Hartwell's
// Market (consumer) and Ellsworth Market (merchant), plus an invented cannabis
// "Doobie-like" template whose licence number is the literal placeholder
// LICENSE_PLACEHOLDER until the real one is confirmed. No real merchant data.
//
// Test sids are 7e57ca4d0000NNNN ("test card"), all under the TEST merchants
// `test-cards` (not age-restricted) and `test-cards-21` (age-restricted).
// Their receipt blobs are byte copies of the Hartwell's / Ellsworth demo blobs.
// Never the live demo sids, never doobie-nights.

import { CAPS_1_7_0, type Card, type OfferCard, type ResolvedCards } from "./types";

type Surface = "web" | "clip" | "app";
const SURFACES: Surface[] = ["web", "clip", "app"];

export const TEST_SID_PREFIX = "7e57ca4d0000";
/** Decimal NNNN (0001, 0002 ... 0010): every digit is also valid hex. */
export const testSid = (n: number) => `${TEST_SID_PREFIX}${String(n).padStart(4, "0")}`;

export const LICENSE_PLACEHOLDER = "LICENSE_PLACEHOLDER";

// ---- merchants and receipt templates ------------------------------------------------

const MERCHANTS = {
  "test-cards": { displayName: "PapeX Test Cards", ageRestricted: false, partner: false },
  "test-cards-21": {
    displayName: "PapeX Test Cards 21+",
    ageRestricted: true,
    partner: false,
    licenseLine: `CA cannabis retailer licence ${LICENSE_PLACEHOLDER}`,
  },
} as const;
type MerchantId = keyof typeof MERCHANTS;

const TEMPLATES = {
  hartwells: { copyBlobFromSid: "5ca1e00000000001", printedDate: "2026-09-02", story: "Hartwell's Market (consumer)" },
  ellsworth: { copyBlobFromSid: "b0de9a0000000001", printedDate: "2026-09-08", story: "Ellsworth Market (merchant)" },
} as const;
type TemplateId = keyof typeof TEMPLATES;

// Every live test offer ends on the last second of 2026-10-31, America/Los_Angeles
// (PDT, UTC-7). Absolute (`expiresOn`) rather than purchase-relative, so the
// expected output does not depend on the resolver's date extraction.
const EXPIRES_ON = "2026-10-31";
const EXPIRES_AT = "2026-11-01T06:59:59Z";
const EXPIRED_ON = "2026-09-15";

// ---- offer templates (config) and their resolved form ---------------------------------

type CodeSpec =
  | { mode: "static"; value: string }
  | { mode: "perSid"; pool: string }
  | { mode: "template"; template: string };

interface OfferTemplate {
  kicker?: string;
  valueLabel: string;
  valueSuffix?: string;
  qualifier?: string;
  title: string;
  terms?: string;
  validity: { expiresOn: string; countdown: boolean; hideWhenExpired: boolean };
  redemption?:
    | { type: "code"; code: CodeSpec; caption?: string }
    | { type: "barcode"; symbology: "code128" | "ean13" | "upca" | "qr"; code: CodeSpec; text?: string; caption?: string };
}

const H_OFFER = {
  kicker: "Next visit",
  valueLabel: "$4",
  valueSuffix: "off",
  qualifier: "Bounty Select-A-Size 12=24",
  title: "$4 off Bounty Select-A-Size 12=24 on your next visit to Hartwell's Market.",
  terms: "Valid through Oct 31, 2026. Limit one per household. TEST COUPON: not redeemable.",
  validity: { expiresOn: EXPIRES_ON, countdown: true, hideWhenExpired: true },
};
const E_OFFER = {
  kicker: "Next visit",
  valueLabel: "$10",
  valueSuffix: "off",
  qualifier: "On $75+",
  title: "$10 off your next purchase of $75 or more at Ellsworth Market.",
  terms:
    "Valid through Oct 31, 2026. Limit one per customer. Excludes alcohol, tobacco, pharmacy, gift cards, lottery, CRV and bag fees. TEST COUPON: not redeemable.",
  validity: { expiresOn: EXPIRES_ON, countdown: true, hideWhenExpired: true },
};
const D_OFFER = {
  kicker: "Next visit",
  valueLabel: "$5",
  valueSuffix: "off",
  qualifier: "On $30+",
  title: "$5 off your next purchase of $30 or more.",
  terms:
    "Valid through Oct 31, 2026. 21+ only; valid ID required. One per customer. Not valid with other offers. TEST COUPON: not redeemable.",
  validity: { expiresOn: EXPIRES_ON, countdown: true, hideWhenExpired: true },
};

const SCAN = "Scan at the register";

export const OFFER_TEMPLATES: Record<string, OfferTemplate> = {
  "h-bounty-code128": { ...H_OFFER, redemption: { type: "barcode", symbology: "code128", code: { mode: "static", value: "HWM4BOUNTY" }, caption: SCAN } },
  "h-bounty-code": { ...H_OFFER, redemption: { type: "code", code: { mode: "static", value: "HARTWELL4" }, caption: "Show this code at the register" } },
  "h-bounty-expired": {
    ...H_OFFER,
    terms: "Valid through Sep 15, 2026. TEST COUPON: not redeemable.",
    validity: { expiresOn: EXPIRED_ON, countdown: true, hideWhenExpired: true },
    redemption: { type: "barcode", symbology: "code128", code: { mode: "static", value: "HWMEXPIRED" }, caption: SCAN },
  },
  "e-10off75-code128": { ...E_OFFER, redemption: { type: "barcode", symbology: "code128", code: { mode: "static", value: "ELLS10OFF75" }, caption: SCAN } },
  "e-10off75-qr": { ...E_OFFER, redemption: { type: "barcode", symbology: "qr", code: { mode: "static", value: "ELLS10OFF75" }, text: "ELLS10OFF75", caption: SCAN } },
  "e-10off75-upca": { ...E_OFFER, redemption: { type: "barcode", symbology: "upca", code: { mode: "static", value: "042100005264" }, caption: SCAN } },
  "e-10off75-template": { ...E_OFFER, redemption: { type: "barcode", symbology: "code128", code: { mode: "template", template: "EM10-{SID6}" }, caption: SCAN } },
  "e-10off75-pool": { ...E_OFFER, redemption: { type: "barcode", symbology: "code128", code: { mode: "perSid", pool: "tc-pool-01" }, caption: SCAN } },
  "d-5off30": { ...D_OFFER, redemption: { type: "barcode", symbology: "code128", code: { mode: "static", value: "LATENITE5" }, caption: SCAN } },
};

/**
 * The one pool the set uses. Its FIRST code goes to the first sid that asks:
 * 7e57ca4d00000007. Assignment is keyed by (offer template id, sid), so the
 * app twin of that card gets the SAME code.
 */
export const CODE_POOLS = { "tc-pool-01": ["TCP-7Q4X-01", "TCP-7Q4X-02", "TCP-7Q4X-03"] };

function resolveCode(spec: CodeSpec, sid: string): { value: string; scope: "shared" | "unique" } {
  switch (spec.mode) {
    case "static":
      return { value: spec.value, scope: "shared" };
    case "template":
      // {sid4|sid6|sid8}: the last N hex chars; an upper-case token gives upper-case hex.
      return {
        value: spec.template.replace(/\{(sid|SID)(4|6|8)\}/g, (_, t: string, n: string) => {
          const tail = sid.slice(-Number(n));
          return t === "SID" ? tail.toUpperCase() : tail;
        }),
        scope: "unique",
      };
    case "perSid":
      return { value: CODE_POOLS[spec.pool as keyof typeof CODE_POOLS][0], scope: "unique" };
  }
}

// ---- config cards ------------------------------------------------------------------------

type CardBody =
  | { type: "offer"; offer: string; heading?: string; actions?: { type: "save"; label: string }[]; compliance?: { licenseLine: string } }
  | Omit<Extract<Card, { type: "text" }>, "id" | "mode">
  | Omit<Extract<Card, { type: "cta" }>, "id" | "mode">
  | Omit<Extract<Card, { type: "savings" }>, "id" | "mode">;

interface VariantCard {
  id: string;
  body: CardBody;
}

const SAVE = { type: "save" as const, label: "Save to PapeX" };

const offer = (id: string, tpl: string, heading: string): VariantCard => ({ id, body: { type: "offer", offer: tpl, heading } });

const H_HEADING = "An offer from Hartwell's Market";
const E_HEADING = "An offer from Ellsworth Market";
const D_HEADING = "An offer from Late Night Test Dispensary";

const SAVINGS: VariantCard = {
  id: "tc-savings",
  body: {
    type: "savings",
    headline: "You saved $4.00 with a PapeX coupon",
    total: "$4.00",
    totalLabel: "saved with PapeX",
    components: [{ label: "PapeX coupon: $4 off Bounty", amount: "$4.00" }],
  },
};
const E_TEXT: VariantCard = {
  id: "tc-text",
  body: {
    type: "text",
    voice: "merchant",
    icon: "bag",
    heading: "From Ellsworth Market",
    title: "Thanks for stopping by",
    body: "Fresh Dungeness crab is back at the seafood counter this week. Ask for a taste.",
  },
};
const H_TEXT: VariantCard = {
  id: "tc-text",
  body: { type: "text", voice: "merchant", icon: "star", title: "Thanks for shopping at Hartwell's Market", body: "See you next time." },
};
const E_CTA: VariantCard = {
  id: "tc-cta",
  body: {
    type: "cta",
    voice: "merchant",
    title: "This week at Ellsworth Market",
    body: "See the weekly specials before your next trip.",
    label: "See weekly specials",
    url: "https://papex.app/",
    style: "primary",
  },
};
const D_TEXT: VariantCard = {
  id: "tc-text",
  body: { type: "text", voice: "merchant", icon: "clock", title: "Open late, every night", body: "Thanks for visiting. We're open until 2 AM." },
};

// ---- the variants ------------------------------------------------------------------------

interface Variant {
  n: number;
  name: string;
  merchant: MerchantId;
  template: TemplateId;
  order: "receipt-first" | "cards-first";
  cards: VariantCard[];
  /** Cards present in CONFIG but expected ABSENT from every response (e.g. expired). */
  configOnly?: VariantCard[];
  /** Surfaces whose caps make the server drop cards: surface -> ids that survive. */
  capsDrop?: Partial<Record<Surface, string[]>>;
  /** App twin behaviour. `twin` (default): same cards, `-app` ids, offers gain Save. `explicit`: `appCards`. `same`: identical file. */
  app?: "twin" | "same" | { cards: VariantCard[] };
  forceStatus?: { status: "degraded" | "pending"; retryAfterMs?: number };
  purpose: string;
}

export const VARIANTS: Variant[] = [
  { n: 1, name: "rf-offer-code128", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [offer("tc-offer", "h-bounty-code128", H_HEADING)], purpose: "Receipt-first (the default). One offer, Code 128, shared code." },
  { n: 2, name: "cf-offer-code128", merchant: "test-cards", template: "hartwells", order: "cards-first", cards: [offer("tc-offer", "h-bounty-code128", H_HEADING)], purpose: "Cards-first: the same offer as 0001, inserted ABOVE the receipt once, with a fade." },
  { n: 3, name: "offer-qr", merchant: "test-cards", template: "ellsworth", order: "receipt-first", cards: [offer("tc-offer", "e-10off75-qr", E_HEADING)], purpose: "QR redemption, on every surface (the web advertises barcode:qr since the 2026-09-23 amendment)." },
  { n: 4, name: "offer-upca", merchant: "test-cards", template: "ellsworth", order: "receipt-first", cards: [offer("tc-offer", "e-10off75-upca", E_HEADING)], purpose: "UPC-A redemption (check digit valid)." },
  { n: 5, name: "offer-text-code", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [offer("tc-offer", "h-bounty-code", H_HEADING)], purpose: "Text code only, no barcode." },
  { n: 6, name: "offer-unique-template", merchant: "test-cards", template: "ellsworth", order: "receipt-first", cards: [offer("tc-offer", "e-10off75-template", E_HEADING)], purpose: "Unique per-sid code, template mode EM10-{sid6}; scope unique." },
  { n: 7, name: "offer-unique-pool", merchant: "test-cards", template: "ellsworth", order: "receipt-first", cards: [offer("tc-offer", "e-10off75-pool", E_HEADING)], purpose: "Unique per-sid code from pool tc-pool-01 (first code); stable across re-taps; scope unique." },
  { n: 8, name: "offer-licence", merchant: "test-cards-21", template: "hartwells", order: "receipt-first", cards: [offer("tc-offer", "d-5off30", D_HEADING)], purpose: "Age-restricted merchant: the offer carries compliance.licenseLine (placeholder)." },
  { n: 9, name: "offer-no-licence", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [offer("tc-offer", "d-5off30", D_HEADING)], purpose: "The same copy as 0008 on a NON-restricted merchant: no licence line (layout control for 0008)." },
  { n: 10, name: "savings-on", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [SAVINGS, offer("tc-offer", "h-bounty-code128", H_HEADING)], purpose: "'You saved $4.00 with a PapeX coupon' savings card ON, above the offer." },
  { n: 11, name: "savings-off", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [offer("tc-offer", "h-bounty-code128", H_HEADING)], purpose: "Savings card OFF: the control for 0010." },
  { n: 12, name: "text-only", merchant: "test-cards", template: "ellsworth", order: "receipt-first", cards: [E_TEXT], purpose: "A single merchant-voice text card." },
  { n: 13, name: "cta", merchant: "test-cards", template: "ellsworth", order: "receipt-first", cards: [E_CTA], purpose: "A single CTA card (https, allowlisted host papex.app)." },
  { n: 14, name: "four-cards", merchant: "test-cards", template: "ellsworth", order: "receipt-first", cards: [SAVINGS, offer("tc-offer", "e-10off75-code128", E_HEADING), E_TEXT, E_CTA], purpose: "Four cards, receipt-first. Order = array order." },
  { n: 15, name: "cf-four-cards", merchant: "test-cards", template: "ellsworth", order: "cards-first", cards: [SAVINGS, offer("tc-offer", "e-10off75-code128", E_HEADING), E_TEXT, E_CTA], purpose: "Four cards, cards-first." },
  { n: 16, name: "expired-offer", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [H_TEXT], configOnly: [offer("tc-offer-expired", "h-bounty-expired", H_HEADING)], purpose: "Config has an offer that expired 2026-09-15: the server drops it; only the text card arrives." },
  { n: 17, name: "status-none", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [], app: "same", purpose: "No card matches this sid: status none." },
  { n: 18, name: "status-degraded", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [], app: "same", forceStatus: { status: "degraded" }, purpose: "Forced degraded (test-merchant debug hook): no cards, receipt unchanged." },
  { n: 19, name: "status-pending", merchant: "test-cards", template: "hartwells", order: "receipt-first", cards: [H_TEXT], forceStatus: { status: "pending", retryAfterMs: 10000 }, purpose: "Forced pending: a fact-free card still renders; clients may re-fetch ONCE after retryAfterMs." },
  {
    n: 20,
    name: "audience",
    merchant: "test-cards",
    template: "ellsworth",
    order: "receipt-first",
    cards: [offer("tc-aud-offer-web", "e-10off75-code128", E_HEADING)],
    app: { cards: [{ id: "tc-aud-offer-app", body: { type: "offer", offer: "e-10off75-code128", heading: "For PapeX app users", actions: [SAVE] } }] },
    purpose: "Audience segregation: ONE offer template, two card ids. web/clip get tc-aud-offer-web; the app gets tc-aud-offer-app with Save.",
  },
  { n: 21, name: "cf-licence-two-cards", merchant: "test-cards-21", template: "hartwells", order: "cards-first", cards: [offer("tc-offer", "d-5off30", D_HEADING), D_TEXT], purpose: "The Doobie-like case in coupon-first mode: offer + merchant text, both with the licence line." },
];

// ---- resolution (what a conforming resolver returns) ---------------------------------------

function resolveCard(vc: VariantCard, sid: string, merchant: MerchantId): Card {
  const m = MERCHANTS[merchant] as { ageRestricted: boolean; licenseLine?: string };
  const license = m.ageRestricted && m.licenseLine ? { licenseLine: m.licenseLine } : undefined;
  const b = vc.body;
  if (b.type === "offer") {
    const t = OFFER_TEMPLATES[b.offer];
    const out: OfferCard = {
      id: vc.id,
      type: "offer",
      mode: "live",
      ...(b.heading ? { heading: b.heading } : {}),
      ...(t.kicker ? { kicker: t.kicker } : {}),
      valueLabel: t.valueLabel,
      ...(t.valueSuffix ? { valueSuffix: t.valueSuffix } : {}),
      ...(t.qualifier ? { qualifier: t.qualifier } : {}),
      title: t.title,
      ...(t.terms ? { terms: t.terms } : {}),
      validity: { expiresAt: EXPIRES_AT, countdown: t.validity.countdown, hideWhenExpired: t.validity.hideWhenExpired },
    };
    if (t.redemption) {
      const { value, scope } = resolveCode(t.redemption.code, sid);
      out.redemption =
        t.redemption.type === "code"
          ? { type: "code", code: value, ...(t.redemption.caption ? { caption: t.redemption.caption } : {}), scope }
          : {
              type: "barcode",
              symbology: t.redemption.symbology,
              value,
              ...(t.redemption.text ? { text: t.redemption.text } : {}),
              ...(t.redemption.caption ? { caption: t.redemption.caption } : {}),
              scope,
            };
    }
    if (b.actions) out.actions = b.actions;
    const c = b.compliance ?? license;
    if (c) out.compliance = c;
    return out;
  }
  const card = { id: vc.id, mode: "live", ...b } as Card;
  if ((b.type === "text" || b.type === "cta") && b.voice === "merchant" && license && !("compliance" in b && b.compliance)) {
    (card as { compliance?: unknown }).compliance = license;
  }
  return card;
}

function appTwin(vc: VariantCard): VariantCard {
  const body = vc.body.type === "offer" ? { ...vc.body, actions: [SAVE] } : vc.body;
  return { id: `${vc.id}-app`, body };
}

/** Card ids carry the variant number so they are unique across the merchant's whole config (lint L6). */
const withN = (n: number) => (vc: VariantCard): VariantCard => ({ ...vc, id: `${vc.id}-${n}` });

/** web/clip cards as configured (including config-only ones when `withConfigOnly`). */
function webClipCards(v: Variant, withConfigOnly = false): VariantCard[] {
  return [...v.cards, ...(withConfigOnly ? (v.configOnly ?? []) : [])].map(withN(v.n));
}

function appCards(v: Variant, withConfigOnly = false): VariantCard[] {
  if (v.app === "same") return webClipCards(v, withConfigOnly);
  if (v.app && typeof v.app === "object") return v.app.cards.map(withN(v.n));
  return webClipCards(v, withConfigOnly).map(appTwin);
}

function cardsFor(v: Variant, surface: Surface): VariantCard[] {
  return surface === "app" ? appCards(v) : webClipCards(v);
}

function response(v: Variant, surface: Surface): ResolvedCards {
  const sid = testSid(v.n);
  const m = MERCHANTS[v.merchant];
  const merchant = { partner: m.partner, ageRestricted: m.ageRestricted };
  if (v.forceStatus?.status === "degraded") return { schemaVersion: 1, sid, status: "degraded", merchant, cards: [] };
  let cards = cardsFor(v, surface).map((c) => resolveCard(c, sid, v.merchant));
  const keep = v.capsDrop?.[surface];
  if (keep) cards = cards.filter((c) => keep.includes(c.id));
  if (cards.length === 0 && !v.forceStatus) return { schemaVersion: 1, sid, status: "none", merchant, cards: [] };
  return {
    schemaVersion: 1,
    sid,
    status: v.forceStatus?.status ?? "ok",
    ...(v.forceStatus?.retryAfterMs != null ? { retryAfterMs: v.forceStatus.retryAfterMs } : {}),
    merchant,
    layout: { order: v.order },
    cards,
  };
}

// ---- configs -------------------------------------------------------------------------------

function configCard(vc: VariantCard, surfaces: string[], sids: string[], priority: number) {
  return { id: vc.id, surfaces, priority, when: { fact: "sid", op: "in", value: sids }, ...vc.body };
}

function buildConfig(merchantId: MerchantId) {
  const m = MERCHANTS[merchantId] as (typeof MERCHANTS)[MerchantId] & { licenseLine?: string };
  const variants = VARIANTS.filter((v) => v.merchant === merchantId);
  const cards: object[] = [];
  const offersUsed = new Set<string>();
  for (const v of variants) {
    const sid = testSid(v.n);
    const wc = webClipCards(v, true);
    wc.forEach((vc, i) => cards.push(configCard(vc, ["web", "clip"], [sid], (i + 1) * 10)));
    if (v.app !== "same") {
      const ac = appCards(v, true);
      ac.forEach((vc, i) => cards.push(configCard(vc, ["app"], [sid], (i + 1) * 10)));
      for (const vc of ac) if (vc.body.type === "offer") offersUsed.add(vc.body.offer);
    }
    for (const vc of wc) if (vc.body.type === "offer") offersUsed.add(vc.body.offer);
  }
  const cfOverrides = variants.filter((v) => v.order === "cards-first").map((v) => testSid(v.n));
  const forced = variants.filter((v) => v.forceStatus);
  const usesPool = [...offersUsed].some((k) => OFFER_TEMPLATES[k].redemption?.code.mode === "perSid");
  return {
    $comment: `TEST merchant for the 1.7.0 cards variant matrix (contracts/cards/v1/fixtures/variants/INDEX.json). Generated by PapeXWeb lib/cards/testVariants.ts: do not hand-edit.`,
    configFormat: 1,
    merchantId,
    receiptsFrom: "2026-09-01T00:00:00Z",
    enabled: true,
    merchant: {
      displayName: m.displayName,
      timezone: "America/Los_Angeles",
      test: true,
      partner: m.partner,
      ageRestricted: m.ageRestricted,
    },
    ...(m.licenseLine ? { compliance: { licenseLine: m.licenseLine, licenseNote: "PLACEHOLDER for public test fixtures; never a real licence number." } } : {}),
    layout: {
      order: "receipt-first",
      ...(cfOverrides.length ? { rules: [{ when: { fact: "sid", op: "in", value: cfOverrides }, order: "cards-first" }] } : {}),
    },
    links: { allowedHosts: ["papex.app"] },
    ...(usesPool ? { pools: CODE_POOLS } : {}),
    offers: Object.fromEntries([...offersUsed].sort().map((k) => [k, OFFER_TEMPLATES[k]])),
    cards,
    ...(forced.length
      ? {
          debug: {
            forceStatus: forced.map((v) => ({
              sids: [testSid(v.n)],
              status: v.forceStatus!.status,
              ...(v.forceStatus!.retryAfterMs != null ? { retryAfterMs: v.forceStatus!.retryAfterMs } : {}),
            })),
          },
        }
      : {}),
  };
}

// ---- client-only cases (no sid is minted for these) -------------------------------------------

const HOSTILE_SID = "7e57ca4d0000ff01";
const EXPIRY_SID = "7e57ca4d0000ff02";

function hostile(): unknown {
  const licence = { licenseLine: `CA cannabis retailer licence ${LICENSE_PLACEHOLDER}` };
  const o = (id: string, extra: object = {}) => ({
    id,
    type: "offer",
    mode: "live",
    valueLabel: "$5",
    valueSuffix: "off",
    title: "$5 off your next purchase of $30 or more.",
    compliance: licence,
    ...extra,
  });
  return {
    schemaVersion: 1,
    sid: HOSTILE_SID,
    status: "ok",
    merchant: { partner: false, ageRestricted: true },
    layout: { order: "coupons-first" },
    cards: [
      o("ok-offer", { redemption: { type: "code", code: "LATENITE5", scope: "perCustomer" } }),
      o("no-licence-offer", { compliance: undefined }),
      { id: "merchant-text-no-licence", type: "text", mode: "live", voice: "merchant", body: "Open late." },
      { id: "papex-text", type: "text", mode: "live", voice: "papex", body: "PapeX keeps this receipt for you." },
      o("bidi-licence", { compliance: { licenseLine: "Licence ‮C10-0000000-LIC" } }),
      o("long-licence", { compliance: { licenseLine: "L".repeat(121) } }),
      o("licence-not-object", { compliance: "C10-0000000-LIC" }),
      o("qr-too-long", { redemption: { type: "barcode", symbology: "qr", value: "Q".repeat(81) } }),
      o("qr-control-char", { redemption: { type: "barcode", symbology: "qr", value: "A\nB" } }),
      o("bad-upca", { redemption: { type: "barcode", symbology: "upca", value: "042100005265" } }),
      o("bad-hide-flag", { validity: { expiresAt: EXPIRES_AT, countdown: true, hideWhenExpired: "yes" } }),
      { id: "js-cta", type: "cta", mode: "live", voice: "papex", label: "Go", url: "javascript:alert(1)", style: "primary" },
      { id: "long-headline", type: "savings", mode: "live", headline: "S".repeat(61), total: "$4.00", totalLabel: "saved" },
      { id: "capture", type: "emailCapture", mode: "preview", consentLabel: "Share my email.", consent: { textId: "x", textVersion: 1 }, ageAffirmationLabel: "I am 21+." },
      { id: "wallet", type: "couponWallet", mode: "live" },
      o("ok-offer"),
    ],
  };
}

function expiryAtRender(): ResolvedCards {
  const base = { type: "offer" as const, mode: "live" as const, valueLabel: "$4", valueSuffix: "off", title: "$4 off Bounty Select-A-Size 12=24." };
  return {
    schemaVersion: 1,
    sid: EXPIRY_SID,
    status: "ok",
    merchant: { partner: false, ageRestricted: false },
    layout: { order: "receipt-first" },
    cards: [
      { id: "hide-when-expired", ...base, validity: { expiresAt: EXPIRES_AT, countdown: true, hideWhenExpired: true } },
      { id: "p0-expiry", ...base, validity: { expiresAt: EXPIRES_AT, countdown: true } },
      { id: "no-validity", type: "text", mode: "live", voice: "papex", body: "Still here." },
    ],
  };
}

// ---- the output -------------------------------------------------------------------------------

export interface VariantFiles {
  /** path relative to contracts/cards/v1 -> JSON value */
  files: Record<string, unknown>;
}

export function buildVariantFiles(): VariantFiles {
  const files: Record<string, unknown> = {};
  const index: object[] = [];
  for (const v of VARIANTS) {
    const sid = testSid(v.n);
    const perSurface: Record<string, string> = {};
    const expect: Record<string, string[]> = {};
    const base = response(v, "clip");
    const baseFile = `${v.name}.json`;
    files[`fixtures/variants/${baseFile}`] = base;
    for (const s of SURFACES) {
      const r = response(v, s);
      const same = JSON.stringify(r) === JSON.stringify(base);
      const file = same ? baseFile : `${v.name}.${s}.json`;
      if (!same) files[`fixtures/variants/${file}`] = r;
      perSurface[s] = file;
      expect[s] = r.status === "ok" || r.status === "pending" ? r.cards.map((c) => c.id) : [];
    }
    index.push({
      sid,
      variant: v.name,
      merchantId: v.merchant,
      template: v.template,
      copyReceiptBlobFrom: TEMPLATES[v.template].copyBlobFromSid,
      layout: v.order,
      status: base.status,
      responses: perSurface,
      expectCardIds: expect,
      ...(v.configOnly ? { mustNotAppear: v.configOnly.map(withN(v.n)).map((c) => c.id) } : {}),
      purpose: v.purpose,
    });
  }
  files["fixtures/variants/hostile.json"] = hostile();
  files["fixtures/variants/expiry-at-render.json"] = expiryAtRender();
  files["fixtures/variants/INDEX.json"] = {
    format: 1,
    description:
      "1.7.0 card variants. Each `sid` is a planned TEST sid (merchant `test-cards` or `test-cards-21`, never a demo or pilot merchant). `responses[surface]` is the exact response for GET /receipt/{sid}/cards?surface=<surface>&schema=1&caps=<CAPS_1_7_0[surface]>, byte for byte except `configRef`. Mint each sid with a byte copy of the receipt blob of `copyReceiptBlobFrom`. `clientOnly` cases are never minted: clients feed the file to their decoder.",
    capsBySurface: CAPS_1_7_0,
    deviceId: "test-cards-bench",
    merchants: MERCHANTS,
    templates: TEMPLATES,
    codePools: CODE_POOLS,
    variants: index,
    clientOnly: [
      {
        file: "hostile.json",
        requestSid: HOSTILE_SID,
        now: null,
        expectLayout: "receipt-first",
        expectCardIds: ["ok-offer", "papex-text"],
        expectScopeOnOkOffer: null,
        purpose:
          "Malformed/hostile set for an AGE-RESTRICTED merchant. Survivors: ok-offer (its unknown scope ignored) and papex-text. Unknown layout -> receipt-first. Everything else is dropped: offer/merchant text without licence, bidi/over-long/non-object licence, over-long and control-char QR, bad UPC check digit, non-boolean hideWhenExpired, javascript: CTA, 61-char savings headline, non-partner emailCapture, unknown type (skipped), duplicate id.",
      },
      {
        file: "expiry-at-render.json",
        requestSid: EXPIRY_SID,
        now: "2026-11-01T07:00:00Z",
        expectCardIds: ["p0-expiry", "no-validity"],
        expectCardIdsWithoutClock: ["hide-when-expired", "p0-expiry", "no-validity"],
        purpose:
          "hideWhenExpired: at a clock 1 s past expiresAt the flagged offer is not drawn; the unflagged one keeps P0 behaviour (drawn, no chip). At 2026-11-01T06:59:59Z both still show, chip 'Last day'.",
      },
    ],
  };
  files["config-examples/test-cards.json"] = buildConfig("test-cards");
  files["config-examples/test-cards-21.json"] = buildConfig("test-cards-21");
  return { files };
}
