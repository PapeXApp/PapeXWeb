// lib/server/merchantData/mock.test.ts
//
// Standalone tsx test script for the in-memory backend and the shared logic
// it runs (version bump, history diff, request linking, item labels).
// Run with: npm run test:merchantProfile

import assert from "node:assert/strict";
import { createMockMerchantData, resetMockStore } from "./mock";
import { MerchantDataError } from "./shared";
import type { AdminMerchantUpdate, MerchantRecord } from "../../merchantProfiles/types";
import type { ValidatedFile } from "../../changeRequests/validate";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.stack ?? err.message : err);
  }
}

async function rejectsWith(p: Promise<unknown>, status: number, code: string) {
  await assert.rejects(p, (err: unknown) => {
    assert.ok(err instanceof MerchantDataError, `expected MerchantDataError, got ${String(err)}`);
    assert.equal(err.status, status);
    assert.equal(err.code, code);
    return true;
  });
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const HEIC_BYTES = new Uint8Array([0, 0, 0, 24, ...Buffer.from("ftypheic"), 0, 0, 0, 0, ...Buffer.from("mif1heic")]);
const png: ValidatedFile = { name: "new-logo.png", contentType: "image/png", size: PNG_BYTES.length, bytes: PNG_BYTES };
const heic: ValidatedFile = { name: "photo.heic", contentType: "image/heic", size: HEIC_BYTES.length, bytes: HEIC_BYTES };
const merchant = { uid: "mock-merchant", email: "demo@doobienights.com" };
const DOOBIE = "store-doobie-nights";

function editable(r: MerchantRecord): AdminMerchantUpdate["record"] {
  const copy: Partial<MerchantRecord> = structuredClone(r);
  delete copy.version;
  delete copy.updatedAt;
  delete copy.updatedBy;
  return copy as AdminMerchantUpdate["record"];
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  resetMockStore();
  const data = createMockMerchantData();

  await test("seeded records and accounts are there at version 1", async () => {
    const r = await data.getRecord(DOOBIE);
    assert.equal(r?.name, "Doobie Nights");
    assert.equal(r?.version, 1);
    assert.equal(r?.deals?.length, 10);
    assert.equal((await data.getRecord("store-template"))?.name, "Your Store");
    assert.deepEqual((await data.getAccount(DOOBIE))?.dashboardEmails, ["demo@doobienights.com"]);
    assert.equal(await data.findMerchantIdForEmail("anyone@example.com"), DOOBIE);
  });

  await test("returned objects are copies (mutating them does not change the store)", async () => {
    const r = await data.getRecord(DOOBIE);
    r!.name = "Hacked";
    assert.equal((await data.getRecord(DOOBIE))?.name, "Doobie Nights");
  });

  let requestId = "";
  let attachmentId = "";

  await test("createRequest: labels resolve from the record, attachment comes back as a data URL", async () => {
    const req = await data.createRequest(
      merchant,
      DOOBIE,
      { section: "deals", action: "remove", itemIds: ["188910", "does-not-exist"], message: "Please remove Thursday deals." },
      [png]
    );
    requestId = req.id;
    attachmentId = req.attachments[0].id;
    assert.equal(req.status, "received");
    assert.equal(req.merchantId, DOOBIE);
    assert.equal(req.merchantName, "Doobie Nights");
    assert.deepEqual(req.itemLabels, ["Thursday Doobie Deals", "does-not-exist"]);
    assert.equal(req.requesterUid, "mock-merchant");
    assert.equal(req.attachments.length, 1);
    assert.equal(req.attachments[0].name, "new-logo.png");
    assert.ok(req.attachments[0].url.startsWith("data:image/png;base64,"));
    assert.equal("path" in req.attachments[0], false, "storage path must not leak");
  });

  await test("itemLabels: menu items, coupons and whatsNew resolve too; section searched first", async () => {
    const menu = await data.createRequest(merchant, DOOBIE, { section: "menu", action: "update", itemIds: ["5880918"], message: "price" }, []);
    assert.deepEqual(menu.itemLabels, ["Pineapple Sorbet Lolli (1.2g)"]);
    const other = await data.createRequest(
      merchant,
      DOOBIE,
      { section: "other", action: "update", itemIds: ["dn-news-1"], message: "x" },
      []
    );
    assert.deepEqual(other.itemLabels, ["Order ahead, skip the line"]);
    // Doobie Nights has no seeded coupons (theirs come from BLAZE), so the
    // coupon lookup is exercised on the template.
    const coupon = await data.createRequest(
      merchant,
      "store-template",
      { section: "other", action: "update", itemIds: ["coupon-template-bogo"], message: "x" },
      []
    );
    assert.deepEqual(coupon.itemLabels, ["Your coupon: Buy one, get one"]);
    const unlinked = await data.createRequest(merchant, null, { section: "deals", action: "remove", itemIds: ["188910"], message: "x" }, []);
    assert.equal(unlinked.merchantId, null);
    assert.equal(unlinked.merchantName, undefined);
    assert.deepEqual(unlinked.itemLabels, ["188910"]);
  });

  await test("listRequestsForUser: own requests only, newest first", async () => {
    await sleep(5);
    const latest = await data.createRequest(merchant, DOOBIE, { section: "about", action: "update", itemIds: [], message: "newest" }, []);
    const mine = await data.listRequestsForUser("mock-merchant");
    assert.equal(mine.length, 6);
    assert.equal(mine[0].id, latest.id);
    assert.deepEqual(await data.listRequestsForUser("someone-else"), []);
  });

  await test("listSummaries counts open requests per merchant", async () => {
    const list = await data.listSummaries();
    const doobie = list.find((m) => m.id === DOOBIE);
    assert.equal(doobie?.openRequests, 4); // the unlinked one counts for nobody
    assert.equal(list.find((m) => m.id === "store-template")?.openRequests, 1); // the coupon-label one
  });

  await test("admin updateRequestStatus: status + note, filterable, note clears with an empty string", async () => {
    const updated = await data.updateRequestStatus(requestId, { status: "in_progress", adminNote: "Working on it" });
    assert.equal(updated.status, "in_progress");
    assert.equal(updated.adminNote, "Working on it");
    const inProgress = await data.listAllRequests({ status: "in_progress" });
    assert.deepEqual(inProgress.map((r) => r.id), [requestId]);
    assert.equal((await data.listAllRequests({ merchantId: null })).length, 1);
    const kept = await data.updateRequestStatus(requestId, { status: "in_progress" });
    assert.equal(kept.adminNote, "Working on it", "absent note keeps it");
    const cleared = await data.updateRequestStatus(requestId, { status: "in_progress", adminNote: "" });
    assert.equal(cleared.adminNote, undefined);
    await rejectsWith(data.updateRequestStatus("nope", { status: "done" }), 404, "request_not_found");
  });

  let v2HistoryId = "";

  await test("updateRecord bumps version, stamps updatedBy, writes history with exact changedFields", async () => {
    const current = (await data.getRecord(DOOBIE))!;
    const record = editable(current);
    record.blurb = "New blurb";
    record.brandColor = "#000000";
    // Same hours, keys in a different order: must NOT count as a change.
    record.hours = { intervals: current.hours!.intervals.map((i) => ({ closesAt: i.closesAt, opensAt: i.opensAt, day: i.day })), timezone: current.hours!.timezone };
    const res = await data.updateRecord(DOOBIE, { record, expectedVersion: 1 }, "nico@papex.app");
    v2HistoryId = res.historyId;
    assert.equal(res.record.version, 2);
    assert.equal(res.record.updatedBy, "nico@papex.app");
    assert.equal(res.record.blurb, "New blurb");
    const [entry] = await data.listHistory(DOOBIE, 20);
    assert.equal(entry.id, res.historyId);
    assert.deepEqual(entry.changedFields, ["blurb", "brandColor"]);
    assert.deepEqual(entry.before, { blurb: current.blurb, brandColor: current.brandColor });
    assert.deepEqual(entry.after, { blurb: "New blurb", brandColor: "#000000" });
    assert.equal(entry.by, "nico@papex.app");
    assert.equal(entry.requestId, undefined);
  });

  await test("removing a field records it as changed with no `after` value", async () => {
    const record = editable((await data.getRecord(DOOBIE))!);
    delete record.phone;
    const res = await data.updateRecord(DOOBIE, { record, expectedVersion: 2 }, "nico@papex.app");
    assert.equal(res.record.version, 3);
    assert.equal("phone" in res.record, false);
    const [entry] = await data.listHistory(DOOBIE, 1);
    assert.deepEqual(entry.changedFields, ["phone"]);
    assert.deepEqual(entry.before, { phone: "(707) 555-0142" });
    assert.deepEqual(entry.after, {});
    assert.notEqual(entry.id, v2HistoryId);
  });

  await test("stale expectedVersion -> 409 and nothing written", async () => {
    const record = editable((await data.getRecord(DOOBIE))!);
    record.name = "Should not save";
    await rejectsWith(data.updateRecord(DOOBIE, { record, expectedVersion: 1 }, "nico@papex.app"), 409, "version_conflict");
    const after = (await data.getRecord(DOOBIE))!;
    assert.equal(after.version, 3);
    assert.equal(after.name, "Doobie Nights");
    assert.equal((await data.listHistory(DOOBIE, 20)).length, 2);
  });

  await test("markRequestDone links the request to the history entry; account is written", async () => {
    const record = editable((await data.getRecord(DOOBIE))!);
    record.deals = record.deals!.filter((d) => d.id !== "188910");
    const res = await data.updateRecord(
      DOOBIE,
      { record, expectedVersion: 3, requestId, markRequestDone: true, account: { dashboardEmails: ["Owner@DoobieNights.com"] } },
      "nico@papex.app"
    );
    const req = await data.getRequest(requestId);
    assert.equal(req?.status, "done");
    assert.equal(req?.appliedHistoryId, res.historyId);
    const [entry] = await data.listHistory(DOOBIE, 1);
    assert.equal(entry.requestId, requestId);
    assert.deepEqual(entry.changedFields, ["deals"]);
    assert.deepEqual(await data.getAccount(DOOBIE), { merchantId: DOOBIE, dashboardEmails: ["owner@doobienights.com"] });
  });

  await test("unknown or foreign requestId -> error and no write", async () => {
    const current = (await data.getRecord(DOOBIE))!;
    await rejectsWith(
      data.updateRecord(DOOBIE, { record: editable(current), expectedVersion: current.version, requestId: "missing", markRequestDone: true }, "n"),
      404,
      "request_not_found"
    );
    const foreign = await data.createRequest(merchant, "store-template", { section: "about", action: "update", itemIds: [], message: "x" }, []);
    await rejectsWith(
      data.updateRecord(DOOBIE, { record: editable(current), expectedVersion: current.version, requestId: foreign.id }, "n"),
      400,
      "request_merchant_mismatch"
    );
    assert.equal((await data.getRecord(DOOBIE))!.version, current.version);
  });

  await test("expectedVersion 0 creates a new merchant; any other version on a missing one is 404", async () => {
    await rejectsWith(data.updateRecord("store-new", { record: { id: "store-new", name: "New" }, expectedVersion: 3 }, "n"), 404, "merchant_not_found");
    const res = await data.updateRecord("store-new", { record: { id: "store-new", name: "New" }, expectedVersion: 0 }, "nico@papex.app");
    assert.equal(res.record.version, 1);
    const [entry] = await data.listHistory("store-new", 1);
    assert.deepEqual(entry.changedFields, ["id", "name"]);
    await rejectsWith(data.updateRecord("store-new", { record: { id: "store-new", name: "Again" }, expectedVersion: 0 }, "n"), 409, "version_conflict");
  });

  await test("uploadAsset: file or reused attachment -> data URL; HEIC refused", async () => {
    const fromFile = await data.uploadAsset(DOOBIE, { file: png });
    assert.ok(fromFile.startsWith("data:image/png;base64,"));
    const reused = await data.uploadAsset(DOOBIE, { fromAttachment: { requestId, attachmentId } });
    assert.equal(reused, fromFile);
    const heicReq = await data.createRequest(merchant, DOOBIE, { section: "brand", action: "update", itemIds: [], message: "" }, [heic]);
    await rejectsWith(
      data.uploadAsset(DOOBIE, { fromAttachment: { requestId: heicReq.id, attachmentId: heicReq.attachments[0].id } }),
      415,
      "unsupported_asset_type"
    );
    await rejectsWith(data.uploadAsset(DOOBIE, { fromAttachment: { requestId, attachmentId: "nope" } }), 404, "attachment_not_found");
  });

  await test("state survives a new backend instance (globalThis), resets on resetMockStore", async () => {
    assert.equal((await createMockMerchantData().getRecord(DOOBIE))!.version, 4);
    resetMockStore();
    assert.equal((await createMockMerchantData().getRecord(DOOBIE))!.version, 1);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
