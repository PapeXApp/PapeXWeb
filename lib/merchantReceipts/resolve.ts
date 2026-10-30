// lib/merchantReceipts/resolve.ts
//
// What a config would serve for one customer type on one surface, computed in
// the browser so the Receipts tab's preview can follow every keystroke. A TS
// mirror of Papex_RDH lambdas/cards/lib/resolve.js, rules.js, codes.js and
// dates.js, for the parts a config can reach. It returns the same envelope the
// real endpoint does, and the page feeds that through the real decoder
// (lib/cards/normalize.ts) and the real card views.
//
// PARITY IS TESTED, NOT ASSUMED: lib/merchantReceipts/merchantReceipts.test.ts
// compares this against goldens produced by the real resolver
// (Papex_RDH scripts/cards-editor-parity.mjs). The real code can't be vendored
// here: this repo is public, and that lint's PapeX-specific rules are not.

import { MAX_RENDERED_CARDS } from "@/lib/cards/types";
import type { CardConfig, ConfigCard, ConfigRedemption, LiveSurface, LoyaltySegment, OfferTemplate } from "./types";

/** The resolver emits at most 6 cards even though clients accept MAX_RENDERED_CARDS. */
export const MAX_RESOLVED_CARDS = Math.min(6, MAX_RENDERED_CARDS);
const DEFAULT_PRIORITY = 100;
const DEFAULT_TZ = "America/Los_Angeles";

export interface MirrorInput {
  config: Pick<CardConfig, "enabled" | "merchant" | "layout" | "offers" | "cards"> & {
    compliance?: { licenseLine?: string } | null;
    pools?: Record<string, string[]>;
  };
  sid: string;
  now: Date;
  surface: LiveSurface | "preview";
  segment?: LoyaltySegment;
  uploadedAt: Date;
  state?: { enabled: boolean; revokedCardIds: string[] } | null;
}

export interface MirrorResult {
  envelope: {
    schemaVersion: 1;
    sid: string;
    status: "ok" | "none";
    merchant: { partner: boolean; ageRestricted: boolean };
    layout?: { order: string };
    cards: Record<string, unknown>[];
  };
  emittedIds: string[];
  dropped: { cardId: string; reason: string }[];
}

// ---- Dates (lib/dates.js) ------------------------------------------------------

function wallClock(ms: number, tz: string) {
  const parts: Record<string, string> = {};
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  for (const p of fmt.formatToParts(new Date(ms))) parts[p.type] = p.value;
  return { y: +parts.year, mo: +parts.month, d: +parts.day, h: +parts.hour, mi: +parts.minute, s: +parts.second };
}

export function localDate(ms: number, tz: string): string {
  const w = wallClock(ms, tz);
  return `${w.y}-${String(w.mo).padStart(2, "0")}-${String(w.d).padStart(2, "0")}`;
}

function parseYmd(ymd: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new Error("bad date");
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) throw new Error("not a calendar date");
  return [y, mo, d];
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** 23:59:59 on `ymd` in `tz`, as a UTC instant. */
export function endOfDayUtc(ymd: string, tz: string): string {
  const [y, m, d] = parseYmd(ymd);
  const target = Date.UTC(y, m - 1, d, 23, 59, 59);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const w = wallClock(guess, tz);
    const diff = target - Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess).toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ---- Codes (lib/codes.js) ------------------------------------------------------

export const CODE_RE = /^[\x21-\x7E]{1,32}$/;
const SYMBOLOGY_RE: Record<string, RegExp> = {
  code128: /^[\x20-\x7E]{1,24}$/,
  ean13: /^[0-9]{13}$/,
  upca: /^[0-9]{12}$/,
  qr: /^[\x20-\x7E]{1,80}$/,
};
const TOKEN_RE = /\{(sid4|sid6|sid8|SID4|SID6|SID8)\}/g;

function checkDigitOk(digits: string): boolean {
  const body = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const d = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]);
}

export function codeFits(code: unknown, redemption: Pick<ConfigRedemption, "type"> & { symbology?: string }): boolean {
  if (typeof code !== "string") return false;
  if (redemption.type === "barcode") {
    const re = SYMBOLOGY_RE[redemption.symbology ?? ""];
    if (!re || !re.test(code)) return false;
    if (redemption.symbology === "ean13" || redemption.symbology === "upca") return checkDigitOk(code);
    return true;
  }
  return CODE_RE.test(code);
}

export function expandTemplate(template: string, sid: string): string {
  if (/[{}]/.test(template.replace(TOKEN_RE, ""))) throw new Error("code_template_token");
  return template.replace(TOKEN_RE, (_, tok: string) => {
    const s = sid.slice(16 - Number(tok.slice(3)));
    return tok === tok.toUpperCase() ? s.toUpperCase() : s;
  });
}

// ---- Rules (lib/rules.js): Kleene logic, a card shows only on TRUE -------------

type Tri = "T" | "F" | "U";

function evalRule(node: unknown, facts: Record<string, unknown>, depth = 0): Tri {
  if (node === undefined || node === null) return depth === 0 ? "T" : "U";
  if (depth > 4 || typeof node !== "object" || Array.isArray(node)) return "U";
  const n = node as { all?: unknown[]; any?: unknown[]; not?: unknown; fact?: string; op?: string; value?: unknown };
  if (Array.isArray(n.all)) {
    if (n.all.length === 0) return "U";
    let u = false;
    for (const c of n.all) {
      const v = evalRule(c, facts, depth + 1);
      if (v === "F") return "F";
      if (v === "U") u = true;
    }
    return u ? "U" : "T";
  }
  if (Array.isArray(n.any)) {
    if (n.any.length === 0) return "U";
    let u = false;
    for (const c of n.any) {
      const v = evalRule(c, facts, depth + 1);
      if (v === "T") return "T";
      if (v === "U") u = true;
    }
    return u ? "U" : "F";
  }
  if ("not" in n) {
    const v = evalRule(n.not, facts, depth + 1);
    return v === "T" ? "F" : v === "F" ? "T" : "U";
  }
  if (n.fact === "now") {
    if (n.op !== "between" || !Array.isArray(n.value) || n.value.length !== 2) return "U";
    const now = (facts.now as Date).getTime();
    const [a, b] = [Date.parse(n.value[0] as string), Date.parse(n.value[1] as string)];
    if (!Number.isFinite(a) || !Number.isFinite(b)) return "U";
    return a <= now && now < b ? "T" : "F";
  }
  if (!["sid", "device.id", "request.surface", "receipt.loyalty.segment"].includes(n.fact ?? "") || n.op !== "in" || !Array.isArray(n.value)) return "U";
  const actual = facts[n.fact as string];
  if (typeof actual !== "string" || actual.length === 0) return "U";
  return n.value.includes(actual) ? "T" : "F";
}

// ---- The pipeline (lib/resolve.js) ---------------------------------------------

class CardDrop extends Error {
  constructor(public reason: string) { super(reason); }
}

function copy(out: Record<string, unknown>, src: Record<string, unknown>, fields: string[]) {
  for (const f of fields) if (src[f] !== undefined && src[f] !== null) out[f] = src[f];
}

function expiresAtOf(tpl: OfferTemplate, uploadedAt: Date, tz: string): string {
  const v = tpl.validity;
  if (typeof v.expiresOn === "string") return endOfDayUtc(v.expiresOn, tz);
  if (Number.isInteger(v.validForDays) && (v.validForDays as number) >= 1) {
    return endOfDayUtc(addDays(localDate(uploadedAt.getTime(), tz), v.validForDays as number), tz);
  }
  throw new CardDrop("validity_config");
}

function resolveCode(r: ConfigRedemption, sid: string, pools: Record<string, string[]> | undefined) {
  const spec = r.code;
  if (spec.mode === "static") return { code: spec.value, scope: "shared" };
  if (spec.mode === "template") return { code: expandTemplate(spec.template, sid), scope: "unique" };
  if (spec.mode === "perSid") {
    // The API never sends pools to the browser, and a preview must not imply a
    // real issued code: this stands in for "each receipt gets its own".
    const pool = pools?.[spec.pool];
    return { code: pool?.[0] ?? "UNIQUE-CODE", scope: "unique" };
  }
  throw new CardDrop("code_config");
}

function buildRedemption(r: ConfigRedemption, sid: string, pools: Record<string, string[]> | undefined) {
  const { code, scope } = resolveCode(r, sid, pools);
  if (r.type === "barcode") {
    if (!codeFits(code, r)) throw new CardDrop("code_invalid");
    const out: Record<string, unknown> = { type: "barcode", symbology: r.symbology, value: code };
    copy(out, r as unknown as Record<string, unknown>, ["text", "caption"]);
    out.scope = scope;
    return out;
  }
  if (r.type !== "code") throw new CardDrop("redemption_type");
  if (!codeFits(code, { type: "code" })) throw new CardDrop("code_invalid");
  const out: Record<string, unknown> = { type: "code", code };
  copy(out, r as unknown as Record<string, unknown>, ["caption"]);
  out.scope = scope;
  return out;
}

function licenceFor(c: ConfigCard, input: MirrorInput): string | undefined {
  const own = c.compliance?.licenseLine;
  if (typeof own === "string") return own;
  const top = input.config.compliance?.licenseLine;
  return typeof top === "string" ? top : undefined;
}

function buildCard(c: ConfigCard, input: MirrorInput): Record<string, unknown> {
  const out: Record<string, unknown> = { id: c.id, type: c.type, mode: input.surface === "preview" ? "preview" : "live" };
  copy(out, c, ["heading"]);
  const tz = input.config.merchant.timezone || DEFAULT_TZ;
  const stampVoice = () => {
    if (out.voice !== "merchant") return;
    const line = licenceFor(c, input);
    if (line !== undefined) out.compliance = { licenseLine: line };
  };
  switch (c.type) {
    case "offer": {
      const tpl = input.config.offers[c.offer ?? ""];
      if (!tpl) throw new CardDrop("offer_missing");
      copy(out, tpl as unknown as Record<string, unknown>, ["kicker", "valueLabel", "valueSuffix", "qualifier", "title", "terms"]);
      if (tpl.validity !== undefined) {
        const expiresAt = expiresAtOf(tpl, input.uploadedAt, tz);
        if (Math.floor(input.now.getTime() / 1000) > Date.parse(expiresAt) / 1000) throw new CardDrop("expired");
        out.validity = { expiresAt, countdown: tpl.validity.countdown === true, hideWhenExpired: tpl.validity.hideWhenExpired !== false };
      }
      if (tpl.redemption) out.redemption = buildRedemption(tpl.redemption, input.sid, input.config.pools);
      if (input.surface === "app" && Array.isArray(c.actions)) {
        const actions = c.actions.filter((a) => a?.type === "save" && typeof a.label === "string").slice(0, 2).map((a) => ({ type: "save", label: a.label }));
        if (actions.length) out.actions = actions;
      }
      const line = licenceFor(c, input);
      if (line !== undefined) out.compliance = { licenseLine: line };
      return out;
    }
    case "text":
      copy(out, c, ["voice", "icon", "title", "body"]);
      stampVoice();
      return out;
    case "cta":
      copy(out, c, ["voice", "title", "body", "label", "url", "style"]);
      stampVoice();
      return out;
    case "savings":
      copy(out, c, ["headline", "total", "totalLabel"]);
      if (Array.isArray(c.components)) out.components = (c.components as { label?: unknown; amount?: unknown }[]).map((x) => ({ label: x?.label, amount: x?.amount }));
      return out;
    case "disclosure":
      copy(out, c, ["text"]);
      return out;
    default:
      throw new CardDrop("type");
  }
}

function inSchedule(schedule: ConfigCard["schedule"], now: Date): boolean {
  if (!schedule) return true;
  const t = now.getTime();
  if (schedule.startsAt && !(Date.parse(schedule.startsAt) <= t)) return false;
  if (schedule.endsAt && !(t < Date.parse(schedule.endsAt))) return false;
  return true;
}

/** Never throws: a card that can't be built is dropped, like the real resolver. */
export function resolveConfig(input: MirrorInput): MirrorResult {
  const { config, surface, sid, now, segment, state } = input;
  const merchant = { partner: config.merchant.partner === true, ageRestricted: config.merchant.ageRestricted === true };
  const dropped: MirrorResult["dropped"] = [];
  const none = (): MirrorResult => ({ envelope: { schemaVersion: 1, sid, status: "none", merchant, cards: [] }, emittedIds: [], dropped });

  if (config.enabled !== true || state?.enabled === false) return none();

  const facts = { sid, "device.id": null, "request.surface": surface, now, ...(segment ? { "receipt.loyalty.segment": segment } : {}) };
  const revoked = new Set(state?.revokedCardIds ?? []);
  const candidates = config.cards
    .map((c, idx) => ({ c, idx }))
    .filter(({ c }) => c.surfaces?.includes(surface) && !revoked.has(c.id) && inSchedule(c.schedule, now) && evalRule(c.when, facts) === "T");
  const prio = (c: ConfigCard) => (Number.isInteger(c.priority) ? (c.priority as number) : DEFAULT_PRIORITY);
  candidates.sort((a, b) => prio(a.c) - prio(b.c) || a.idx - b.idx);

  const cards: Record<string, unknown>[] = [];
  for (const { c } of candidates) {
    if (cards.length >= MAX_RESOLVED_CARDS) { dropped.push({ cardId: c.id, reason: "max_cards" }); continue; }
    try {
      const out = buildCard(c, input);
      if (cards.some((x) => x.id === out.id)) { dropped.push({ cardId: c.id, reason: "duplicate_id" }); continue; }
      cards.push(out);
    } catch (err) {
      dropped.push({ cardId: c.id, reason: err instanceof CardDrop ? err.reason : "error" });
    }
  }
  if (cards.length === 0) return none();
  const order = config.layout?.order === "cards-first" ? "cards-first" : "receipt-first";
  return { envelope: { schemaVersion: 1, sid, status: "ok", merchant, layout: { order }, cards }, emittedIds: cards.map((c) => c.id as string), dropped };
}
