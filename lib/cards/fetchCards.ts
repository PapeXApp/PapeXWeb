// lib/cards/fetchCards.ts
//
// SERVER-ONLY. Production `/r` asks the RDH cards service which cards to draw
// with a receipt: `GET {RDH}/receipt/{sid}/cards?surface=web&schema=1&caps=…`
// (contract: contracts/cards/v1/README.md, "v1.1"; W0 §1–§3).
//
// THE RULES THIS FILE EXISTS TO KEEP
//   - FAIL CLOSED AND FAST. Every failure (network error, non-200, a timeout,
//     a body over 32 768 bytes, invalid UTF-8, not JSON, a rejected envelope)
//     comes back as "no cards", and no cards means the receipt renders exactly
//     as it did before this file existed. Hard budget: 2.5 s, covering the
//     body read too. Never throws, never retries.
//   - NEVER IN THE RECEIPT'S WAY. `startWebCards` begins the request and hands
//     back a task; app/r/page.tsx starts it alongside the byte and /parsed
//     reads and never awaits it before the receipt's markup (see the page).
//   - NEVER FOR A DEMO SID. A sid in the compiled demo registry
//     (lib/demoReceipts.ts DEMO_RECEIPTS, via isDemoSid) never calls the
//     service; its value layer lives on /r/demo and /demo/r and stays exactly
//     as it is. Malformed sids never call it either. (rid links never reach
//     this file: app/r/page.tsx routes them away first.)
//   - ONE DECODER. The body goes through lib/cards/normalize.ts's total
//     normalizer (`parseCardsResponse`) with the render clock, so
//     `hideWhenExpired` offers that have lapsed are dropped here too.
//   - WEB CAPS, ENFORCED ON OUR SIDE TOO. The server only sends what `caps`
//     allows, but the web renderer also knows P0 types the web must not show
//     in 1.7.0 (loyalty, insight, emailCapture). Anything outside the web
//     caps is dropped here, and `save` actions are stripped (contract §6:
//     "a clip/web client that receives one skips it"). The existing
//     "Save to PapeX" receipt CTA is untouched.
//
// Why server-side at all: the RDH API has no CORS for browsers (see the header
// of app/r/page.tsx), and a server fetch keeps the page free of client JS.

import { rdhApiBase, isValidSid } from "@/lib/rdh";
import { isDemoSid } from "@/lib/demoReceipts";
import { parseCardsResponse, type CardDrop, type NormalizedCards } from "./normalize";
import { CAPS_1_7_0, MAX_RESPONSE_BYTES, parseCaps, type Card } from "./types";

/** W0 §2: the web's hard budget for the whole cards call, body included. */
export const WEB_CARDS_TIMEOUT_MS = 2_500;

/** The exact `caps` the web sends (W0 §1: "the client MUST send exactly its row"). */
export const WEB_CAPS = CAPS_1_7_0.web;

/**
 * The request URL for `sid`. Only `|` is percent-encoded (`%7C`, which W0 §1
 * allows; the server decodes the query string first). Commas and colons are
 * legal in a query and stay literal, so the URL reads like the contract row.
 */
export function webCardsUrl(sid: string): string {
  return `${rdhApiBase()}/receipt/${sid}/cards?surface=web&schema=1&caps=${WEB_CAPS.replace(/\|/g, "%7C")}`;
}

/** Whether `/r` may ask about this sid at all. */
export function mayFetchWebCards(sid: string | undefined | null): sid is string {
  return isValidSid(sid) && !isDemoSid(sid);
}

export interface FetchWebCardsOptions {
  /** The render clock (hideWhenExpired). */
  now: Date;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** Decoded cards plus why there are none, for tests and logs. Never carries the merchant. */
export interface WebCardsResult {
  cards: NormalizedCards;
  /** `ok` when the service answered and the envelope was accepted (even with zero cards). */
  outcome: "ok" | "skipped" | "http" | "timeout" | "network" | "oversize" | "encoding" | "rejected";
}

const NONE: NormalizedCards = {
  status: "none",
  merchant: { partner: false, ageRestricted: false },
  layout: { order: "receipt-first" },
  cards: [],
  dropped: [],
};

function none(outcome: WebCardsResult["outcome"]): WebCardsResult {
  return { cards: { ...NONE, merchant: { ...NONE.merchant }, layout: { ...NONE.layout }, cards: [], dropped: [] }, outcome };
}

/** Read at most `max` bytes of a body; `null` if it is longer. */
async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) {
    await res.body?.cancel().catch(() => {});
    return null;
  }
  if (!res.body) return new Uint8Array(0);
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

const WEB = parseCaps(WEB_CAPS);

/**
 * Keep only what the web advertises, and drop write actions. Pure; exported
 * for tests. Cards are rebuilt, never mutated.
 */
export function restrictToWebCaps(input: NormalizedCards): NormalizedCards {
  const cards: Card[] = [];
  const dropped: CardDrop[] = [...input.dropped];
  input.cards.forEach((card, index) => {
    if (!WEB.types.has(card.type)) {
      dropped.push({ index, id: card.id, type: card.type, reason: "not in web caps" });
      return;
    }
    if (card.type === "offer") {
      if (card.redemption?.type === "barcode" && !WEB.symbologies.has(card.redemption.symbology)) {
        dropped.push({ index, id: card.id, type: card.type, reason: "symbology not in web caps" });
        return;
      }
      if (card.actions) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { actions, ...rest } = card;
        cards.push(rest);
        return;
      }
    }
    cards.push(card);
  });
  return { ...input, cards, dropped };
}

/**
 * The whole web client pipeline for one sid. Never throws; every failure is
 * "no cards". Does not fetch for a malformed or demo sid.
 */
export async function fetchWebCards(sid: string, opts: FetchWebCardsOptions): Promise<WebCardsResult> {
  if (!mayFetchWebCards(sid)) return none("skipped");
  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs ?? WEB_CARDS_TIMEOUT_MS);
  try {
    const res = await doFetch(webCardsUrl(sid), {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (res.status !== 200) {
      await res.body?.cancel().catch(() => {});
      return none("http");
    }
    const body = await readCapped(res, MAX_RESPONSE_BYTES);
    if (body == null) return none("oversize");
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    } catch {
      return none("encoding");
    }
    const cards = restrictToWebCaps(parseCardsResponse(text, sid, { now: opts.now }));
    if (cards.rejected) return { cards, outcome: "rejected" };
    return { cards, outcome: "ok" };
  } catch {
    return none(timedOut ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A cards request that is already running. `peek()` answers synchronously:
 * the result if the request has finished, `undefined` if it has not. The
 * page uses it to render cards inline when they beat the receipt, and a
 * Suspense boundary when they don't; see app/r/page.tsx.
 */
export interface WebCardsTask {
  promise: Promise<WebCardsResult>;
  peek(): WebCardsResult | undefined;
}

export function startWebCards(sid: string, opts: FetchWebCardsOptions): WebCardsTask {
  let settled: WebCardsResult | undefined;
  // fetchWebCards never rejects; the catch is belt and braces so an
  // un-awaited task can never surface as an unhandled rejection.
  const promise = fetchWebCards(sid, opts)
    .catch(() => none("network"))
    .then((r) => {
      settled = r;
      return r;
    });
  return { promise, peek: () => settled };
}
