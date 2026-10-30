// lib/merchantReceipts/lint.ts
//
// MOCK MODE ONLY (NEXT_PUBLIC_MERCHANT_MOCK=1, via lib/merchantMock.ts). With no
// backend to ask, this answers for the publish lint: a mirror of Papex_RDH
// lambdas/cards/lib/lint.js and the frozen config schema, covering what the
// Receipts tab can produce. Against the real API the tab calls the real lint and
// never runs this file.
//
// Test: lib/merchantReceipts/merchantReceipts.test.ts holds it to goldens from
// the real lint (Papex_RDH scripts/cards-editor-parity.mjs). It must reach the
// same verdict on every case, report only (path, code) pairs the real one
// reports, and match the real one's non-schema errors and warnings exactly.

import { codeFits, localDate, resolveConfig, type MirrorInput } from "./resolve";
import type { CardConfigIssue, ConfigCard, OfferTemplate } from "./types";

export type LintableDoc = MirrorInput["config"] & { merchantId: string };

const PLACEHOLDER = "LICENSE_PLACEHOLDER";
const ID_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
const STATIC_CODE_RE = /^[\x21-\x7E]{1,80}$/;
const YMD_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
/** Control and bidi characters the schema's plainText pattern refuses. By code point, so no invisible character sits in this source file. */
function hasBadChar(s: string): boolean {
  for (const ch of s) {
    const c = ch.codePointAt(0) as number;
    if (c <= 0x1f || (c >= 0x7f && c <= 0x9f) || c === 0x2028 || c === 0x2029 || (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069)) return true;
  }
  return false;
}

function isPlainText(v: unknown, max: number): boolean {
  if (typeof v !== "string" || v.length < 1 || !/\S/.test(v) || hasBadChar(v)) return false;
  return [...v].length <= max;
}

function schemaErrors(doc: LintableDoc): string[] {
  const paths: string[] = [];
  const text = (path: string, v: unknown, max: number) => { if (!isPlainText(v, max)) paths.push(path); };
  const optional = (path: string, v: unknown, max: number) => { if (v !== undefined) text(path, v, max); };

  if (doc.merchant.ageRestricted === true && !doc.compliance) paths.push("/");
  if (doc.compliance) text("/compliance/licenseLine", doc.compliance.licenseLine, 120);

  for (const [id, o] of Object.entries(doc.offers ?? {}) as [string, OfferTemplate][]) {
    const p = `/offers/${id}`;
    if (!ID_RE.test(id)) paths.push("/offers");
    optional(`${p}/kicker`, o.kicker, 40);
    text(`${p}/valueLabel`, o.valueLabel, 12);
    optional(`${p}/valueSuffix`, o.valueSuffix, 12);
    optional(`${p}/qualifier`, o.qualifier, 40);
    text(`${p}/title`, o.title, 160);
    optional(`${p}/terms`, o.terms, 500);

    const v = o.validity;
    const hasDate = v?.expiresOn !== undefined;
    const hasDays = v?.validForDays !== undefined;
    if (!v || hasDate === hasDays) paths.push(`${p}/validity`);
    if (hasDate && !(typeof v.expiresOn === "string" && YMD_RE.test(v.expiresOn))) paths.push(`${p}/validity/expiresOn`);
    if (hasDays && !(Number.isInteger(v.validForDays) && (v.validForDays as number) >= 1 && (v.validForDays as number) <= 366)) paths.push(`${p}/validity/validForDays`);

    const r = o.redemption;
    if (r) {
      optional(`${p}/redemption/caption`, r.caption, 80);
      if (r.type === "barcode") optional(`${p}/redemption/text`, r.text, 80);
      if (r.code?.mode === "static" && !(typeof r.code.value === "string" && STATIC_CODE_RE.test(r.code.value))) {
        paths.push(`${p}/redemption/code/value`);
      }
    }
  }

  (doc.cards ?? []).forEach((c: ConfigCard, i) => {
    if (!ID_RE.test(c.id ?? "")) paths.push(`/cards/${i}/id`);
    optional(`/cards/${i}/heading`, c.heading, 60);
    const when = c.when as { fact?: string; value?: unknown[] } | undefined;
    if (when?.fact === "receipt.loyalty.segment" && (!Array.isArray(when.value) || when.value.length === 0)) paths.push(`/cards/${i}/when`);
  });
  return paths;
}

/**
 * @returns the same {errors, warnings} shape the real route answers with. Schema
 * errors stop the run early, as they do in lint.js.
 */
export function lintMirror(doc: LintableDoc, now: Date): { errors: CardConfigIssue[]; warnings: CardConfigIssue[] } {
  const errors: CardConfigIssue[] = [];
  const warnings: CardConfigIssue[] = [];
  const err = (path: string, code: string, message: string) => errors.push({ path, code, message });
  const warn = (path: string, code: string, message: string) => warnings.push({ path, code, message });

  const bad = schemaErrors(doc);
  if (bad.length) {
    for (const path of bad) err(path, "config_schema", "not allowed by the config schema");
    return { errors, warnings };
  }

  const test = doc.merchantId.startsWith("test-");
  const tz = doc.merchant.timezone;

  const comp = doc.compliance as { licenseLine?: string; licenseExpiresOn?: string } | null | undefined;
  if (comp?.licenseExpiresOn) {
    const today = localDate(now.getTime(), tz);
    const daysLeft = Math.round((Date.parse(comp.licenseExpiresOn) - Date.parse(today)) / 86_400_000);
    if (daysLeft < 0) err("/compliance/licenseExpiresOn", "license_expired", `licence expired ${comp.licenseExpiresOn}`);
    else if (daysLeft <= 30) warn("/compliance/licenseExpiresOn", "license_expiring", `licence expires ${comp.licenseExpiresOn}`);
  }
  const liveCards = doc.cards.filter((c) => c.surfaces.some((s) => s !== "preview"));
  if (JSON.stringify(comp ?? "").includes(PLACEHOLDER) || doc.cards.some((c) => JSON.stringify(c.compliance ?? "").includes(PLACEHOLDER))) {
    if (!test && doc.enabled && liveCards.length) err("/compliance/licenseLine", "license_placeholder", `${PLACEHOLDER} would reach a live surface`);
    else warn("/compliance/licenseLine", "license_placeholder", `licenseLine contains ${PLACEHOLDER}`);
  }

  const ids = new Set<string>();
  doc.cards.forEach((c, i) => {
    if (ids.has(c.id)) err(`/cards/${i}/id`, "duplicate_id", c.id);
    ids.add(c.id);
    if (c.type === "offer" && !doc.offers[c.offer ?? ""]) err(`/cards/${i}/offer`, "offer_missing", `no offers.${c.offer}`);
  });
  const used = new Set(doc.cards.filter((c) => c.type === "offer").map((c) => c.offer));
  for (const id of Object.keys(doc.offers)) if (!used.has(id)) warn(`/offers/${id}`, "unused_offer", id);

  for (const [id, o] of Object.entries(doc.offers)) {
    const r = o.redemption;
    if (r?.code.mode === "static" && !codeFits(r.code.value, r)) err(`/offers/${id}/redemption/code`, "code_invalid", `"${r.code.value}" is not valid`);
  }

  for (const s of ["web", "clip", "app", "preview"]) {
    const n = doc.cards.filter((c) => c.surfaces.includes(s) && !c.when).length;
    if (n > 6) warn("/cards", "too_many_cards", `${n} unconditional cards on ${s}; only 6 are emitted`);
  }

  if (errors.length === 0) dryResolve(doc, now, err, warn, test);
  return { errors: dedupe(errors), warnings: dedupe(warnings) };
}

function dedupe(list: CardConfigIssue[]): CardConfigIssue[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const k = `${x.path}|${x.code}|${x.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function dryResolve(
  doc: LintableDoc,
  now: Date,
  err: (p: string, c: string, m: string) => void,
  warn: (p: string, c: string, m: string) => void,
  test: boolean,
) {
  const usesFacts = JSON.stringify(doc.cards).includes("receipt.loyalty.segment");
  const segments = usesFacts ? ([undefined, "first", "returning", "none", "no_points", "unknown"] as const) : ([undefined] as const);
  const emitted = new Map<string, Set<string>>();
  const uploadedAt = new Date(now.getTime() - 60_000);
  for (const surface of ["web", "clip", "app", "preview"] as const) {
    for (const segment of segments) {
      const { emittedIds, dropped } = resolveConfig({
        config: { ...doc, enabled: true }, sid: "0123456789abcdef", now, surface, segment, uploadedAt, state: null,
      });
      for (const id of emittedIds) emitted.set(id, (emitted.get(id) ?? new Set()).add(surface));
      for (const d of dropped) {
        if (d.reason === "max_cards") continue;
        if (d.reason === "expired" && test) { warn("/cards", "expired_offer", `${d.cardId} is expired (test merchant: allowed)`); continue; }
        err("/cards", "dry_resolve_drop", `${d.cardId} dropped on ${surface}: ${d.reason}`);
      }
    }
  }
  doc.cards.forEach((c, i) => {
    for (const s of c.surfaces) {
      if (!emitted.get(c.id)?.has(s) && !c.schedule) warn(`/cards/${i}`, "never_emitted", `${c.id} was not emitted on ${s} by any probe`);
    }
  });
}
