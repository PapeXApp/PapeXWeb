// lib/merchantProfiles/record.ts
//
// What a stored `merchants/{id}` document means, as opposed to what it holds.
// Pure, so the server backends and the dashboard's live listener read a
// document the same way.

import type { LoyaltyProgram, MerchantRecord } from "./types";

/**
 * Keys older saves wrote to this PUBLIC READ document that must not be written
 * again or shown. `updatedBy` held a staff email; who saved what now lives
 * only in the private `merchants/{id}/history` entries. The save is a full
 * replace, so a merchant's next save removes the old value.
 */
export const RETIRED_RECORD_KEYS = ["updatedBy"] as const;

export function withoutRetiredKeys<T extends object>(doc: T): T {
  const out = { ...doc } as Record<string, unknown>;
  for (const k of RETIRED_RECORD_KEYS) delete out[k];
  return out as T;
}

// ── Removed fields ──────────────────────────────────────────────────────
//
// The PapeX app overlays this record on the store it ships with, field by
// field, so a key that is merely missing means "no opinion" and the shipped
// value shows. Removing a field therefore has to be stated. A field the record
// once had and no longer has is stored as a clear (`[]` for a list, `null`
// otherwise), and a field it never had stays unwritten.
//
// Only the save (lib/server/merchantData/shared.ts) writes clears, and it keeps
// them across later saves. Everything that reads a record sees presentRecord,
// where a cleared field is simply absent.

const LIST_RECORD_KEYS = ["menuCategories", "menu", "deals", "whatsNew"] as const;
const VALUE_RECORD_KEYS = [
  "logoUrl", "heroImageUrl", "brandColor", "brandColorSecondary", "category", "blurb",
  "website", "address", "phone", "hours", "description", "menuUrl",
] as const;
const LOYALTY_PARTS = ["programName", "nextRewardAt", "nextRewardLabel"] as const;

/** Every field staff can empty. `id` and `name` can't be emptied. */
export const CLEARABLE_RECORD_KEYS = [...VALUE_RECORD_KEYS, ...LIST_RECORD_KEYS, "loyaltyProgram"] as const;

type ValueRecordKey = (typeof VALUE_RECORD_KEYS)[number];
type LoyaltyPart = (typeof LOYALTY_PARTS)[number];

/** A document as stored: a record, plus the clears readers never see. */
export type StoredMerchantRecord = Omit<MerchantRecord, ValueRecordKey | "loyaltyProgram"> & {
  [K in ValueRecordKey]?: MerchantRecord[K] | null;
} & {
  loyaltyProgram?: { [P in LoyaltyPart]?: LoyaltyProgram[P] | null } | null;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** The app's rule for "none" (PapeXV2 services/coupons/remoteStore.ts isEmptyValue), minus `{}`, which only object fields take. */
function isEmptyValue(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);
}

function isEmptyObject(v: unknown): boolean {
  return isPlainObject(v) && Object.keys(v).length === 0;
}

function isClearedField(key: string, v: unknown): boolean {
  if (isEmptyValue(v)) return true;
  if (key === "hours") {
    // No opening times is no hours, even with a timezone: the app would
    // otherwise be told the store is closed all week.
    return isPlainObject(v) && (v.intervals === undefined || (Array.isArray(v.intervals) && v.intervals.length === 0));
  }
  return key === "loyaltyProgram" && isEmptyObject(v);
}

/**
 * Removes every way of saying "none" from a record's fields, keeping anything
 * else as it is: a wrong-typed value stays, for the validator to refuse.
 */
export function withoutClearedFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out = { ...fields };
  for (const k of CLEARABLE_RECORD_KEYS) {
    if (k in out && isClearedField(k, out[k])) delete out[k];
  }
  if (isPlainObject(out.loyaltyProgram)) {
    const program = { ...out.loyaltyProgram };
    for (const part of LOYALTY_PARTS) {
      if (part in program && isEmptyValue(program[part])) delete program[part];
    }
    if (Object.keys(program).length === 0) delete out.loyaltyProgram;
    else out.loyaltyProgram = program;
  }
  return out;
}

/** The record a stored document means: no clears, no retired keys. */
export function presentRecord(doc: StoredMerchantRecord): MerchantRecord {
  return withoutClearedFields(withoutRetiredKeys(doc) as Record<string, unknown>) as unknown as MerchantRecord;
}

/**
 * `fields` (already withoutClearedFields) plus a clear for each field `stored`
 * has and `fields` doesn't. `stored` counts a field that is already cleared,
 * because the save is a full replace: dropping that clear on the next save
 * would bring the app's shipped value back.
 *
 * The app overlays loyaltyProgram part by part, so its parts get the same
 * treatment. A wholly cleared program counts as having had every part.
 */
export function withExplicitClears(fields: Record<string, unknown>, stored: StoredMerchantRecord | null): Record<string, unknown> {
  if (!stored) return fields;
  const out = { ...fields };
  for (const k of CLEARABLE_RECORD_KEYS) {
    if (out[k] === undefined && k in stored) out[k] = (LIST_RECORD_KEYS as readonly string[]).includes(k) ? [] : null;
  }
  if (isPlainObject(out.loyaltyProgram)) {
    const was: unknown = stored.loyaltyProgram;
    const wholeClear = "loyaltyProgram" in stored && (isEmptyValue(was) || isEmptyObject(was));
    const program = { ...out.loyaltyProgram };
    for (const part of LOYALTY_PARTS) {
      if (program[part] === undefined && (wholeClear || (isPlainObject(was) && part in was))) program[part] = null;
    }
    out.loyaltyProgram = program;
  }
  return out;
}
