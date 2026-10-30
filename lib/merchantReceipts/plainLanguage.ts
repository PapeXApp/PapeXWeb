// lib/merchantReceipts/plainLanguage.ts
//
// The publish lint speaks in JSON paths and rule codes. This turns each issue
// into a sentence a store owner can act on, attached to the field it's about.
// An issue this file doesn't recognise still gets a sentence and is never shown
// raw: it asks the merchant to contact PapeX, with the code for support.

import type { CardConfig, CardConfigIssue } from "./types";

export interface PlainIssue {
  text: string;
  /** Set when the issue belongs to one offer. */
  offerId?: string;
  /** Which of that offer's controls it belongs under (see FIELDS). */
  field?: string;
}

const FIELDS: Record<string, { label: string; max?: number }> = {
  kicker: { label: "The label above the deal", max: 40 },
  valueLabel: { label: "The deal", max: 12 },
  valueSuffix: { label: "The word after the deal", max: 12 },
  qualifier: { label: "The line under the deal", max: 40 },
  title: { label: "The offer description", max: 160 },
  terms: { label: "The terms", max: 500 },
  "redemption/caption": { label: "The instruction above the code", max: 80 },
  "redemption/text": { label: "The text under the code", max: 80 },
};

function describeText(label: string, value: unknown, max?: number): string {
  if (typeof value !== "string" || value.trim() === "") return `${label} can't be empty.`;
  if (max !== undefined && [...value].length > max) return `${label} is too long: ${[...value].length} characters, and the limit is ${max}.`;
  return `${label} has a character receipts can't show. Retype it without pasted formatting.`;
}

function codeRule(symbology: string | undefined): string {
  if (symbology === "qr") return "QR codes can be up to 80 characters, using letters, numbers and common symbols.";
  if (symbology === "code128") return "Barcodes can be up to 24 characters, using letters, numbers and common symbols.";
  return "Codes can be up to 32 characters, using letters, numbers and symbols, with no spaces.";
}

function fieldValue(o: Record<string, unknown> | undefined, field: string): unknown {
  return field.split("/").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), o);
}

/** Which offer a card id belongs to, for lint messages that name a card. */
function offerOfCard(cardId: string, config: CardConfig): string | undefined {
  return config.cards.find((c) => c.id === cardId)?.offer;
}

export function describeIssue(issue: CardConfigIssue, config: CardConfig): PlainIssue {
  const { path, code, message } = issue;

  const offer = /^\/offers\/([^/]+)(?:\/(.*))?$/.exec(path);
  if (offer) {
    const [, offerId, rest = ""] = offer;
    const tpl = config.offers[offerId] as unknown as Record<string, unknown> | undefined;
    if (code === "code_invalid" || rest.startsWith("redemption/code")) {
      const r = config.offers[offerId]?.redemption;
      const symbology = r?.type === "barcode" ? r.symbology : undefined;
      return { offerId, field: "code", text: `That code won't work. ${codeRule(symbology)}` };
    }
    if (rest === "redemption" || rest === "redemption/type") {
      return { offerId, field: "code", text: `That code won't work. ${codeRule(undefined)}` };
    }
    if (rest === "validity/validForDays") return { offerId, field: "expiry", text: "Days valid must be a whole number from 1 to 366." };
    if (rest === "validity/expiresOn") return { offerId, field: "expiry", text: "Pick a real date for this offer to end." };
    if (rest.startsWith("validity")) return { offerId, field: "expiry", text: "Choose when this offer ends." };
    if (FIELDS[rest]) return { offerId, field: rest, text: describeText(FIELDS[rest].label, fieldValue(tpl, rest), FIELDS[rest].max) };
  }

  const card = /^\/cards\/(\d+)(?:\/(.*))?$/.exec(path);
  if (card) {
    const c = config.cards[Number(card[1])];
    const rest = card[2] ?? "";
    if (rest === "heading") return { offerId: c?.offer, field: "heading", text: describeText("The heading above the offer", c?.heading, 60) };
    if (rest.startsWith("when")) return { offerId: c?.offer, field: "audience", text: "Pick at least one customer type for this offer, or switch it off." };
  }

  // A dry-resolve drop names the card in its message ("<id> dropped on web: expired").
  if (code === "dry_resolve_drop") {
    const m = /^(\S+) dropped on \S+: (\S+)/.exec(message);
    const offerId = m ? offerOfCard(m[1], config) : undefined;
    if (m?.[2] === "expired") return { offerId, field: "expiry", text: "This offer has already ended, so it can't go live. Pick a later end date." };
    if (m?.[2] === "code_invalid") return { offerId, field: "code", text: "That code won't work on a receipt. Try a shorter one with no spaces." };
    return { offerId, text: "This offer couldn't be drawn on a receipt. Check its fields, or contact PapeX if it keeps happening." };
  }

  switch (code) {
    case "license_expired":
      return { text: "Your licence on file has expired, so PapeX can't publish offers for your store. Contact PapeX with your renewed licence." };
    case "license_expiring":
      return { text: `Your licence on file expires soon${/\d{4}-\d{2}-\d{2}/.test(message) ? ` (${/\d{4}-\d{2}-\d{2}/.exec(message)![0]})` : ""}. Send PapeX your renewal to keep offers running.` };
    case "license_placeholder":
      return { text: "PapeX hasn't added your licence line yet, so offers can't go live. Contact PapeX to finish setup." };
    case "too_many_cards":
      return { text: "A receipt shows at most 6 cards, so some of these won't appear. Switch some off." };
    case "age_restricted_required":
      return { text: "Your store must carry its licence line on every offer. Contact PapeX if that's wrong." };
    case "backdate":
      return { text: "A newer version starts later than now. Reload this page and try again." };
    default:
      break;
  }
  if (code === "config_schema" && path === "/") {
    return { text: "Age-restricted stores need a licence line before offers can go live. Contact PapeX to finish setup." };
  }
  return { text: `PapeX needs to look at something in this setup before it can go live. Contact PapeX and mention “${code}”.` };
}

/** Warnings that only describe what the merchant already chose, so they aren't worth saying. */
const QUIET_WARNINGS = new Set(["unused_offer", "never_emitted", "expired_offer"]);

export function describeIssues(issues: CardConfigIssue[], config: CardConfig): PlainIssue[] {
  const seen = new Set<string>();
  const out: PlainIssue[] = [];
  for (const issue of issues) {
    if (QUIET_WARNINGS.has(issue.code)) continue;
    const plain = describeIssue(issue, config);
    const key = `${plain.offerId ?? ""}|${plain.field ?? ""}|${plain.text}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(plain);
    }
  }
  return out;
}
