// lib/merchantProfiles/record.ts
//
// What a stored `merchants/{id}` document means, as opposed to what it holds.
// Pure, so the server backends and the dashboard's live listener read a
// document the same way.

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
