// lib/server/merchantData/shared.ts
//
// Pure logic both backends (mock.ts, firestore.ts) share, so the in-memory
// demo and the real Firestore path can't compute a version bump, a history
// diff or an item label differently.

import type {
  AdminMerchantUpdate,
  MerchantAccount,
  MerchantHistoryEntry,
  MerchantRecord,
  MerchantSummary,
} from "../../merchantProfiles/types";
import type {
  ChangeRequest,
  ChangeRequestAttachment,
  ChangeRequestSection,
} from "../../changeRequests/types";

/** Keys the server owns on a MerchantRecord; never diffed, never taken from a client. */
export const SERVER_OWNED_KEYS = ["version", "updatedAt", "updatedBy"] as const;

/** An attachment as stored: a storage path (or mock key), not a URL. */
export interface StoredAttachment extends Omit<ChangeRequestAttachment, "url"> {
  path: string;
}

/** A change request as stored. `url`s are resolved at read time. */
export interface StoredChangeRequest extends Omit<ChangeRequest, "attachments"> {
  attachments: StoredAttachment[];
}

export class MerchantDataError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly userMessage?: string
  ) {
    super(code);
    this.name = "MerchantDataError";
  }
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** JSON with object keys sorted, so key order never counts as a change. */
export function stableStringify(v: unknown): string {
  if (v === undefined) return "undefined";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? "null" : stableStringify(x))).join(",")}]`;
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** Drops undefined values (Firestore rejects them; JSON would too). */
function stripUndefined<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/** The record an update produces: editable fields REPLACED, server fields stamped. */
export function buildNextRecord(
  merchantId: string,
  currentVersion: number,
  update: AdminMerchantUpdate,
  byEmail: string,
  nowIso: string
): MerchantRecord {
  const editable: Record<string, unknown> = { ...update.record };
  for (const k of SERVER_OWNED_KEYS) delete editable[k];
  return stripUndefined({
    ...(editable as Omit<MerchantRecord, "version" | "updatedAt" | "updatedBy">),
    id: merchantId,
    version: currentVersion + 1,
    updatedAt: nowIso,
    updatedBy: byEmail,
  });
}

/** Top-level keys whose JSON differs; before/after carry only those keys. */
export function diffRecords(
  before: Partial<MerchantRecord>,
  after: Partial<MerchantRecord>
): { changedFields: string[]; before: Partial<MerchantRecord>; after: Partial<MerchantRecord> } {
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const skip = new Set<string>(SERVER_OWNED_KEYS);
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => !skip.has(k)).sort();
  const changedFields: string[] = [];
  const outBefore: Record<string, unknown> = {};
  const outAfter: Record<string, unknown> = {};
  for (const k of keys) {
    if (stableStringify(b[k]) === stableStringify(a[k])) continue;
    changedFields.push(k);
    if (b[k] !== undefined) outBefore[k] = b[k];
    if (a[k] !== undefined) outAfter[k] = a[k];
  }
  return { changedFields, before: outBefore as Partial<MerchantRecord>, after: outAfter as Partial<MerchantRecord> };
}

/** Firestore caps documents at 1 MiB; a history entry diffing a huge record could exceed it. */
const MAX_HISTORY_JSON_BYTES = 900 * 1024;

export function buildHistoryEntry(args: {
  id: string;
  merchantId: string;
  at: string;
  by: string;
  requestId?: string;
  before: Partial<MerchantRecord>;
  after: Partial<MerchantRecord>;
}): MerchantHistoryEntry {
  const diff = diffRecords(args.before, args.after);
  const entry: MerchantHistoryEntry = {
    id: args.id,
    merchantId: args.merchantId,
    at: args.at,
    by: args.by,
    changedFields: diff.changedFields,
    before: diff.before,
    after: diff.after,
  };
  if (args.requestId) entry.requestId = args.requestId;
  if (new TextEncoder().encode(JSON.stringify(entry)).length > MAX_HISTORY_JSON_BYTES) {
    console.warn(`[merchantData] history ${args.id} for ${args.merchantId} too large; storing changedFields only`);
    entry.before = {};
    entry.after = {};
  }
  return entry;
}

export function normalizeAccount(merchantId: string, account: Omit<MerchantAccount, "merchantId">): MerchantAccount {
  const out: MerchantAccount = {
    merchantId,
    dashboardEmails: [...new Set(account.dashboardEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))],
  };
  if (account.rdhMerchantId) out.rdhMerchantId = account.rdhMerchantId;
  return out;
}

/** Throws the right MerchantDataError if the update can't apply to `current`. */
export function assertUpdatable(current: MerchantRecord | null, update: AdminMerchantUpdate): void {
  if (!current) {
    // Creating a brand-new merchant is an update from "version 0".
    if (update.expectedVersion !== 0) throw new MerchantDataError(404, "merchant_not_found", "This merchant does not exist.");
    return;
  }
  if (current.version !== update.expectedVersion) {
    throw new MerchantDataError(409, "version_conflict", "Someone else saved this profile since you opened it. Reload to see their changes.");
  }
}

export function assertRequestLinkable(req: StoredChangeRequest | null, merchantId: string): void {
  if (!req) throw new MerchantDataError(404, "request_not_found", "That change request no longer exists.");
  if (req.merchantId !== null && req.merchantId !== merchantId) {
    throw new MerchantDataError(400, "request_merchant_mismatch", "That change request belongs to a different merchant.");
  }
}

// ── Item labels ──────────────────────────────────────────────────────────

type LabelSource = "deals" | "menu" | "whatsNew";

function labelMaps(record: MerchantRecord | null): Record<LabelSource, Map<string, string>> {
  const maps: Record<LabelSource, Map<string, string>> = {
    deals: new Map(),
    menu: new Map(),
    whatsNew: new Map(),
  };
  if (!record) return maps;
  for (const d of record.deals ?? []) if (d?.id) maps.deals.set(d.id, d.title);
  for (const cat of record.menu ?? []) for (const it of cat?.items ?? []) if (it?.id) maps.menu.set(it.id, it.name);
  for (const u of record.whatsNew ?? []) if (u?.id) maps.whatsNew.set(u.id, u.title);
  return maps;
}

/**
 * Titles for `itemIds`, same order. The request's own section is searched
 * first (ids are only unique within one list), then every list; an unknown
 * id labels as itself.
 */
export function resolveItemLabels(record: MerchantRecord | null, section: ChangeRequestSection, itemIds: string[]): string[] {
  const maps = labelMaps(record);
  const order: LabelSource[] = ["deals", "menu", "whatsNew"];
  const first = (order as string[]).includes(section) ? (section as LabelSource) : null;
  const searchOrder = first ? [first, ...order.filter((s) => s !== first)] : order;
  return itemIds.map((id) => {
    for (const s of searchOrder) {
      const label = maps[s].get(id);
      if (label) return label;
    }
    return id;
  });
}

export function toSummary(record: MerchantRecord, openRequests: number): MerchantSummary {
  const s: MerchantSummary = { id: record.id, name: record.name, updatedAt: record.updatedAt, openRequests };
  if (record.logoUrl) s.logoUrl = record.logoUrl;
  if (record.brandColor) s.brandColor = record.brandColor;
  return s;
}

export function isOpenStatus(status: string): boolean {
  return status === "received" || status === "in_progress";
}

export function newestFirst<T extends { createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export function attachmentPath(merchantId: string | null, requestId: string, attachmentId: string, safeName: string): string {
  return `merchant-requests/${merchantId ?? "unlinked"}/${requestId}/${attachmentId}-${safeName}`;
}
