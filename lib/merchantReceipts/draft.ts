// lib/merchantReceipts/draft.ts
//
// The Receipts tab's working copy. A config stores one offer as a template plus
// separate cards per audience (the frozen schema won't let one card mix `app`
// with `web`/`clip`), which isn't how a merchant thinks about it, so the editor
// holds one OfferDraft per offer and rebuilds the config from it. Every field
// here maps onto a real config field; toConfigInput() is the only place that
// mapping lives.
//
// The Doobie Nights shape is what comes out: `<id>-web` on web+clip, `<id>-app`
// on app with a Save action, the same `when` on both. "Off" keeps the offer as a
// preview-only card, so its terms and audience survive being switched back on
// (Doobie's first version shipped preview-only the same way).
//
// A config this model can't represent (two web cards for one offer, a schedule,
// a rule that isn't a loyalty list) isn't rewritten: those cards pass through
// untouched and show as managed by PapeX.

import {
  LOYALTY_SEGMENTS,
  type CardConfig,
  type CardConfigInput,
  type ConfigCard,
  type LayoutOrder,
  type LiveSurface,
  type LoyaltySegment,
  type OfferTemplate,
} from "./types";

export interface OfferDraft {
  id: string;
  on: boolean;
  heading: string;
  template: OfferTemplate;
  /** Who gets it. All five means everyone, which is written as no rule at all. */
  segments: LoyaltySegment[];
  /** Where it shows while `on`. */
  surfaces: LiveSurface[];
  webCardId: string;
  appCardId: string;
}

export interface ReceiptsDraft {
  enabled: boolean;
  order: LayoutOrder;
  offers: OfferDraft[];
  /** Cards this editor doesn't author, kept as they are. */
  otherCards: ConfigCard[];
  /** Templates behind passed-through cards. */
  otherOffers: Record<string, OfferTemplate>;
}

const SAVE_ACTION = { type: "save" as const, label: "Save to PapeX" };
const SEGMENT_FACT = "receipt.loyalty.segment";
/** The resolver emits at most this many cards per receipt. */
export const MAX_OFFERS = 6;

function loyaltySegments(when: unknown): LoyaltySegment[] | null {
  if (when === undefined) return [...LOYALTY_SEGMENTS];
  const rule = when as { fact?: unknown; op?: unknown; value?: unknown };
  if (rule?.fact !== SEGMENT_FACT || rule.op !== "in" || !Array.isArray(rule.value)) return null;
  return LOYALTY_SEGMENTS.filter((s) => (rule.value as unknown[]).includes(s));
}

const liveOnly = (surfaces: string[]) => surfaces.filter((s): s is LiveSurface => (["clip", "web", "app"] as string[]).includes(s));

/** Can this offer's cards be expressed as one OfferDraft? */
function canEdit(cards: ConfigCard[]): boolean {
  const webish = cards.filter((c) => !c.surfaces.includes("app"));
  const appish = cards.filter((c) => c.surfaces.includes("app"));
  if (webish.length > 1 || appish.length > 1) return false;
  if (cards.some((c) => c.schedule || c.compliance || loyaltySegments(c.when) === null)) return false;
  const first = cards[0];
  return cards.every((c) => c.heading === first.heading && JSON.stringify(loyaltySegments(c.when)) === JSON.stringify(loyaltySegments(first.when)));
}

export function fromConfig(config: CardConfig): ReceiptsDraft {
  const byOffer = new Map<string, ConfigCard[]>();
  const otherCards: ConfigCard[] = [];
  for (const card of config.cards) {
    if (card.type === "offer" && card.offer && config.offers[card.offer]) {
      byOffer.set(card.offer, [...(byOffer.get(card.offer) ?? []), card]);
    } else {
      otherCards.push(card);
    }
  }

  const drafts: { draft: OfferDraft; priority: number }[] = [];
  const otherOffers: Record<string, OfferTemplate> = {};
  for (const [id, cards] of byOffer) {
    if (!canEdit(cards)) {
      otherCards.push(...cards);
      otherOffers[id] = config.offers[id];
      continue;
    }
    const live = cards.flatMap((c) => liveOnly(c.surfaces));
    const app = cards.find((c) => c.surfaces.includes("app"));
    const web = cards.find((c) => !c.surfaces.includes("app"));
    drafts.push({
      priority: Math.min(...cards.map((c) => c.priority ?? 100)),
      draft: {
        id,
        on: live.length > 0,
        heading: cards[0].heading ?? "",
        template: structuredClone(config.offers[id]),
        segments: loyaltySegments(cards[0].when) ?? [],
        surfaces: live.length > 0 ? ([...new Set(live)] as LiveSurface[]) : ["clip", "web", "app"],
        webCardId: web?.id ?? `${id}-web`,
        appCardId: app?.id ?? `${id}-app`,
      },
    });
  }
  // An offer with a template and no cards at all: keep it, switched off.
  for (const [id, template] of Object.entries(config.offers)) {
    if (byOffer.has(id)) continue;
    drafts.push({
      priority: 999,
      draft: { id, on: false, heading: "", template: structuredClone(template), segments: [...LOYALTY_SEGMENTS], surfaces: ["clip", "web", "app"], webCardId: `${id}-web`, appCardId: `${id}-app` },
    });
  }
  drafts.sort((a, b) => a.priority - b.priority);

  return { enabled: config.enabled, order: config.layout.order, offers: drafts.map((d) => d.draft), otherCards, otherOffers };
}

/** Optional text fields can't be empty strings in the schema: an empty box means absent. */
function cleanTemplate(t: OfferTemplate): OfferTemplate {
  const out = structuredClone(t);
  for (const key of ["kicker", "valueSuffix", "qualifier", "terms"] as const) {
    if (out[key] === "") delete out[key];
  }
  if (out.redemption) {
    if (out.redemption.caption === "") delete out.redemption.caption;
    if (out.redemption.type === "barcode" && out.redemption.text === "") delete out.redemption.text;
  }
  return out;
}

export function toConfigInput(draft: ReceiptsDraft): CardConfigInput {
  const offers: Record<string, OfferTemplate> = { ...draft.otherOffers };
  const cards: ConfigCard[] = [];
  draft.offers.forEach((o, i) => {
    offers[o.id] = cleanTemplate(o.template);
    const everyone = LOYALTY_SEGMENTS.every((s) => o.segments.includes(s));
    const live = o.on ? o.surfaces : [];
    const shared: Partial<ConfigCard> = {
      type: "offer",
      offer: o.id,
      priority: (i + 1) * 10,
      ...(o.heading.trim() === "" ? {} : { heading: o.heading }),
      // An off offer with no customers picked isn't an error: it isn't going anywhere.
      ...(everyone || (live.length === 0 && o.segments.length === 0)
        ? {}
        : { when: { fact: SEGMENT_FACT, op: "in", value: LOYALTY_SEGMENTS.filter((s) => o.segments.includes(s)) } }),
    };
    const web = (["web", "clip"] as const).filter((s) => live.includes(s));
    if (web.length > 0) cards.push({ id: o.webCardId, surfaces: ["preview", ...web], ...shared } as ConfigCard);
    if (live.includes("app")) cards.push({ id: o.appCardId, surfaces: ["preview", "app"], ...shared, actions: [SAVE_ACTION] } as ConfigCard);
    if (web.length === 0 && !live.includes("app")) cards.push({ id: o.webCardId, surfaces: ["preview"], ...shared } as ConfigCard);
  });
  return { enabled: draft.enabled, layout: { order: draft.order }, offers, cards: [...cards, ...draft.otherCards] };
}

/** The whole config the preview and the lint read: the draft on top of what PapeX manages. */
export function draftToConfig(draft: ReceiptsDraft, config: CardConfig): CardConfig {
  return { ...config, ...toConfigInput(draft) };
}

/** A new offer's starting point. A real, valid, publishable offer, never placeholder text. */
export function newOffer(existing: OfferDraft[], ageRestricted: boolean): OfferDraft {
  let n = existing.length + 1;
  const taken = new Set(existing.map((o) => o.id));
  while (taken.has(`offer-${n}`)) n += 1;
  const id = `offer-${n}`;
  return {
    id,
    on: true,
    heading: "",
    template: {
      valueLabel: "$5",
      valueSuffix: "off",
      title: "$5 off your next visit.",
      ...(ageRestricted ? { terms: "21+ with valid ID." } : {}),
      validity: { validForDays: 30, countdown: true, hideWhenExpired: true },
      redemption: { type: "code", code: { mode: "static", value: `SAVE${n}` }, caption: "Show this code at checkout" },
    },
    segments: [...LOYALTY_SEGMENTS],
    surfaces: ["clip", "web", "app"],
    webCardId: `${id}-web`,
    appCardId: `${id}-app`,
  };
}

/** The offers this customer type gets right now, in the order they'd show. */
export function offersFor(draft: ReceiptsDraft, segment: LoyaltySegment): OfferDraft[] {
  return draft.offers.filter((o) => o.on && o.segments.includes(segment));
}

/** A short name for an offer, for chips and messages: "20% off". */
export function offerName(o: Pick<OfferDraft, "template">): string {
  const { valueLabel, valueSuffix } = o.template;
  return [valueLabel, valueSuffix].filter(Boolean).join(" ") || "Untitled offer";
}

/** Cards a PapeX person wrote: shown locked, and the API keeps them whatever a publish sends. */
export function isManagedCard(card: ConfigCard): boolean {
  return card.type === "disclosure" || card.type === "savings" || card.type === "cta" || (card.type === "text" && card.voice !== "merchant");
}
