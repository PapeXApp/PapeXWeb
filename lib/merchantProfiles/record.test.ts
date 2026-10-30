// lib/merchantProfiles/record.test.ts
//
// Standalone tsx test script for what a stored merchants/{id} document means.
// Run with: npm run test:merchantProfile

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RECORD_KEYS } from "../changeRequests/validate";
import {
  CLEARABLE_RECORD_KEYS,
  presentRecord,
  withExplicitClears,
  withoutClearedFields,
  type StoredMerchantRecord,
} from "./record";

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const BASE = { id: "s", name: "Store", version: 3, updatedAt: "2026-10-30T00:00:00.000Z" };
const doc = (fields: object) => ({ ...BASE, ...fields }) as unknown as StoredMerchantRecord;
const LISTS = ["menuCategories", "menu", "deals", "whatsNew"];

test("every editable field but id and name can be cleared", () => {
  assert.deepEqual(
    [...CLEARABLE_RECORD_KEYS].sort(),
    [...RECORD_KEYS].filter((k) => k !== "id" && k !== "name").sort()
  );
});

test("presentRecord: null, blank and empty list are absent on every clearable field", () => {
  for (const k of CLEARABLE_RECORD_KEYS) {
    for (const empty of [null, "", "   ", []]) {
      const record = presentRecord(doc({ [k]: empty }));
      assert.equal(k in record, false, `${k}: ${JSON.stringify(empty)}`);
    }
  }
});

test("presentRecord: empty hours and an empty program are absent", () => {
  for (const hours of [{}, { intervals: [] }, { timezone: "America/Los_Angeles" }, { timezone: "America/Los_Angeles", intervals: [] }]) {
    assert.equal("hours" in presentRecord(doc({ hours })), false, JSON.stringify(hours));
  }
  for (const loyaltyProgram of [{}, { programName: null }, { programName: "", nextRewardAt: null, nextRewardLabel: "  " }]) {
    assert.equal("loyaltyProgram" in presentRecord(doc({ loyaltyProgram })), false, JSON.stringify(loyaltyProgram));
  }
});

test("presentRecord: a program keeps its set parts, including a zero", () => {
  assert.deepEqual(
    presentRecord(doc({ loyaltyProgram: { programName: "P", nextRewardAt: 0, nextRewardLabel: null } })).loyaltyProgram,
    { programName: "P", nextRewardAt: 0 }
  );
});

test("presentRecord: real values, server fields and wrong types are left alone", () => {
  const fields = {
    phone: "555",
    hours: { intervals: [{ day: 1, opensAt: "09:00", closesAt: "17:00" }] },
    deals: {},
    logoUrl: 5,
  };
  assert.deepEqual(presentRecord(doc(fields)), { ...BASE, ...fields });
});

test("presentRecord: the retired updatedBy is gone, and the input is not changed", () => {
  const input = doc({ updatedBy: "staff@example.com", phone: null, loyaltyProgram: { programName: "P", nextRewardAt: null } });
  const snapshot = structuredClone(input);
  const record = presentRecord(input);
  assert.equal("updatedBy" in record, false);
  assert.deepEqual(input, snapshot);
});

test("withExplicitClears: a field the document has and the update lacks gets the right clear", () => {
  for (const k of CLEARABLE_RECORD_KEYS) {
    const out = withExplicitClears({}, doc({ [k]: "anything" }));
    assert.deepEqual(out[k], LISTS.includes(k) ? [] : null, k);
  }
});

test("withExplicitClears: a field the document never had stays unwritten", () => {
  assert.deepEqual(withExplicitClears({ blurb: "b" }, doc({})), { blurb: "b" });
});

test("withExplicitClears: no document, no clears", () => {
  assert.deepEqual(withExplicitClears({ blurb: "b" }, null), { blurb: "b" });
});

test("withExplicitClears: a stored clear is carried; a list held as null becomes []", () => {
  assert.deepEqual(withExplicitClears({}, doc({ phone: null, deals: [], menu: null })), { phone: null, deals: [], menu: [] });
});

test("withExplicitClears: a value in the update wins over what is stored", () => {
  assert.deepEqual(withExplicitClears({ phone: "1" }, doc({ phone: null })), { phone: "1" });
});

test("withExplicitClears: id, name and unknown keys never get a clear", () => {
  assert.deepEqual(withExplicitClears({}, doc({ somethingElse: 1 })), {});
});

test("withExplicitClears: loyalty parts", () => {
  const program = { programName: "P" };
  const stored = (loyaltyProgram: unknown) => doc({ loyaltyProgram });
  const after = (was: unknown) => withExplicitClears({ loyaltyProgram: program }, stored(was)).loyaltyProgram;
  assert.deepEqual(after({ programName: "Old", nextRewardAt: 5 }), { programName: "P", nextRewardAt: null });
  assert.deepEqual(after({ programName: "Old", nextRewardLabel: null }), { programName: "P", nextRewardLabel: null });
  assert.deepEqual(after(null), { programName: "P", nextRewardAt: null, nextRewardLabel: null });
  assert.deepEqual(after({}), { programName: "P", nextRewardAt: null, nextRewardLabel: null });
  assert.deepEqual(withExplicitClears({ loyaltyProgram: program }, doc({})).loyaltyProgram, program);
});

test("what a save stores reads back as what it was given", () => {
  const fields = { blurb: "b", loyaltyProgram: { programName: "P" } };
  const stored = doc({ phone: "1", deals: [{ id: "d", title: "t" }], loyaltyProgram: { programName: "Old", nextRewardAt: 5 } });
  assert.deepEqual(presentRecord(doc(withExplicitClears(fields, stored))), { ...BASE, ...fields });
  assert.deepEqual(withoutClearedFields(withoutClearedFields(fields)), fields);
});

// The profile page gets its record from the API (getRecord, covered in
// mock.test.ts) or from this listener, which needs a browser to run.
test("the dashboard's live listener reads through presentRecord", () => {
  const src = readFileSync(new URL("../merchantProfilesClient.ts", import.meta.url), "utf8");
  assert.match(src, /setSnap\(normalizeRecord\(/);
  assert.match(src, /return presentRecord\(out as unknown as StoredMerchantRecord\);/);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
