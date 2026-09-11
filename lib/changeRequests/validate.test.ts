// lib/changeRequests/validate.test.ts
//
// Standalone tsx test script (no framework, same pattern as
// lib/merchantHost.test.ts). Run with: npm run test:merchantProfile

import assert from "node:assert/strict";
import { CHANGE_REQUEST_LIMITS } from "./types";
import {
  sanitizeFileName,
  sniffImageType,
  validateChangeRequestInput,
  validateMerchantRecordUpdate,
  validateStatusUpdate,
  validateUploadFiles,
  type ValidationResult,
} from "./validate";
import { DOOBIE_NIGHTS } from "../merchantProfiles/seed/doobieNights";
import type { MerchantRecord } from "../merchantProfiles/types";

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
function errorOf<T>(r: ValidationResult<T>): string | undefined {
  return r.ok ? undefined : r.error;
}

// ── fixtures ───────────────────────────────────────────────────────────────

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const WEBP = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBPVP8 ")]);
const HEIC = new Uint8Array([0, 0, 0, 24, ...Buffer.from("ftypheic"), 0, 0, 0, 0, ...Buffer.from("mif1heic")]);
const AVIF = new Uint8Array([0, 0, 0, 24, ...Buffer.from("ftypavif"), 0, 0, 0, 0, ...Buffer.from("mif1avif")]);
const SVG = new Uint8Array(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
const GIF = new Uint8Array(Buffer.from("GIF89a......"));

const base = { section: "deals", action: "remove", itemIds: ["188910"], message: "  Please drop this one.  " };

// ── validateChangeRequestInput ─────────────────────────────────────────────

test("valid input is normalized (trimmed message, deduped ids, upper-case colors)", () => {
  const r = validateChangeRequestInput(
    { ...base, itemIds: ["188910", "188910", "99592"], proposedColors: { primary: "#f12af8", secondary: "" } },
    0
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.message, "Please drop this one.");
  assert.deepEqual(r.value.itemIds, ["188910", "99592"]);
  assert.deepEqual(r.value.proposedColors, { primary: "#F12AF8" });
});

test("rejects unknown section and action", () => {
  assert.equal(errorOf(validateChangeRequestInput({ ...base, section: "admin" }, 0)), "invalid_section");
  assert.equal(errorOf(validateChangeRequestInput({ ...base, action: "delete" }, 0)), "invalid_action");
});

test("rejects non-object payloads", () => {
  assert.equal(errorOf(validateChangeRequestInput(null, 0)), "invalid_payload");
  assert.equal(errorOf(validateChangeRequestInput([base], 0)), "invalid_payload");
});

test("itemIds: must be strings of at most 100 chars, at most maxItems", () => {
  assert.equal(errorOf(validateChangeRequestInput({ ...base, itemIds: [42] }, 0)), "invalid_item_ids");
  assert.equal(errorOf(validateChangeRequestInput({ ...base, itemIds: ["x".repeat(101)] }, 0)), "invalid_item_ids");
  assert.equal(errorOf(validateChangeRequestInput({ ...base, itemIds: "188910" }, 0)), "invalid_item_ids");
  const many = Array.from({ length: CHANGE_REQUEST_LIMITS.maxItems + 1 }, (_, i) => `id${i}`);
  assert.equal(errorOf(validateChangeRequestInput({ ...base, itemIds: many }, 0)), "too_many_items");
  assert.ok(validateChangeRequestInput({ ...base, itemIds: many.slice(1) }, 0).ok);
});

test("message: limit applies after trimming", () => {
  const long = "a".repeat(CHANGE_REQUEST_LIMITS.maxMessageChars + 1);
  assert.equal(errorOf(validateChangeRequestInput({ ...base, message: long }, 0)), "message_too_long");
  assert.ok(validateChangeRequestInput({ ...base, message: `   ${"a".repeat(CHANGE_REQUEST_LIMITS.maxMessageChars)}   ` }, 0).ok);
});

test("colors must be #RRGGBB", () => {
  for (const bad of ["F12AF8", "#F12", "#GGGGGG", "red", 123]) {
    assert.equal(errorOf(validateChangeRequestInput({ ...base, proposedColors: { primary: bad } }, 0)), "invalid_color", String(bad));
  }
});

test("at-least-one-of: empty request rejected; message, item, color or file alone is enough", () => {
  const empty = { section: "brand", action: "update", itemIds: [], message: "   " };
  assert.equal(errorOf(validateChangeRequestInput(empty, 0)), "empty_request");
  assert.ok(validateChangeRequestInput(empty, 1).ok, "file only");
  assert.ok(validateChangeRequestInput({ ...empty, proposedColors: { secondary: "#3697AF" } }, 0).ok, "color only");
  assert.ok(validateChangeRequestInput({ ...empty, itemIds: ["x"] }, 0).ok, "item only");
  assert.ok(validateChangeRequestInput({ ...empty, message: "hi" }, 0).ok, "message only");
});

// ── files ──────────────────────────────────────────────────────────────────

test("sniffImageType identifies png/jpeg/webp/heic by magic bytes", () => {
  assert.equal(sniffImageType(PNG), "image/png");
  assert.equal(sniffImageType(JPEG), "image/jpeg");
  assert.equal(sniffImageType(WEBP), "image/webp");
  assert.equal(sniffImageType(HEIC), "image/heic");
});

test("sniffImageType rejects svg, gif, avif and garbage", () => {
  assert.equal(sniffImageType(SVG), null);
  assert.equal(sniffImageType(GIF), null);
  assert.equal(sniffImageType(AVIF), null);
  assert.equal(sniffImageType(new Uint8Array([1, 2, 3])), null);
});

test("declared type is ignored: an SVG labelled image/png is rejected, a PNG labelled text/plain is stored as png", () => {
  assert.equal(errorOf(validateUploadFiles([{ name: "logo.png", declaredType: "image/png", bytes: SVG }])), "unsupported_file_type");
  const r = validateUploadFiles([{ name: "logo.txt", declaredType: "text/plain", bytes: PNG }]);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value[0].contentType, "image/png");
    assert.equal(r.value[0].name, "logo.png");
  }
});

test("file count and size limits", () => {
  const six = Array.from({ length: 6 }, () => ({ name: "a.png", bytes: PNG }));
  assert.equal(errorOf(validateUploadFiles(six)), "too_many_files");
  const big = new Uint8Array(CHANGE_REQUEST_LIMITS.maxFileBytes + 1);
  big.set(PNG);
  assert.equal(errorOf(validateUploadFiles([{ name: "big.png", bytes: big }])), "file_too_large");
  assert.equal(errorOf(validateUploadFiles([{ name: "empty.png", bytes: new Uint8Array() }])), "empty_file");
  assert.equal(errorOf(validateUploadFiles([{ name: "a.heic", bytes: HEIC }], { allowedTypes: ["image/png"] })), "unsupported_file_type");
});

test("sanitizeFileName strips paths and odd characters and forces the sniffed extension", () => {
  assert.equal(sanitizeFileName("../../etc/pass wd.svg", "image/png"), "pass-wd.png");
  assert.equal(sanitizeFileName("C:\\Users\\me\\Café Menu.JPG", "image/jpeg"), "Cafe-Menu.jpg");
  assert.equal(sanitizeFileName("", "image/webp"), "image.webp");
  assert.equal(sanitizeFileName("...", "image/png"), "image.png");
  assert.ok(sanitizeFileName("x".repeat(300) + ".png", "image/png").length <= 80);
});

// ── validateStatusUpdate ───────────────────────────────────────────────────

test("validateStatusUpdate: enum, trimmed note, length limit", () => {
  const r = validateStatusUpdate({ status: "in_progress", adminNote: "  on it  " });
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.value, { status: "in_progress", adminNote: "on it" });
  assert.equal(errorOf(validateStatusUpdate({ status: "closed" })), "invalid_status");
  assert.equal(
    errorOf(validateStatusUpdate({ status: "done", adminNote: "n".repeat(CHANGE_REQUEST_LIMITS.maxAdminNoteChars + 1) })),
    "admin_note_too_long"
  );
  const clear = validateStatusUpdate({ status: "declined", adminNote: "" });
  assert.ok(clear.ok && clear.value.adminNote === "");
});

// ── validateMerchantRecordUpdate ───────────────────────────────────────────

function editable(): Omit<MerchantRecord, "version" | "updatedAt" | "updatedBy"> {
  const r: Partial<MerchantRecord> = structuredClone(DOOBIE_NIGHTS);
  delete r.version;
  delete r.updatedAt;
  delete r.updatedBy;
  return r as Omit<MerchantRecord, "version" | "updatedAt" | "updatedBy">;
}

test("the seed record itself passes", () => {
  const r = validateMerchantRecordUpdate({ record: editable(), expectedVersion: 1 }, "store-doobie-nights");
  assert.ok(r.ok, JSON.stringify(r));
});

test("server-owned keys in `record` are stripped, not trusted", () => {
  const r = validateMerchantRecordUpdate({ record: { ...editable(), version: 99, updatedBy: "evil" }, expectedVersion: 1 }, "store-doobie-nights");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal("version" in r.value.record, false);
    assert.equal("updatedBy" in r.value.record, false);
  }
});

test("record.id must match the path id", () => {
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: editable(), expectedVersion: 1 }, "store-template")), "id_mismatch");
});

test("name, colors, expectedVersion", () => {
  const id = "store-doobie-nights";
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), name: "  " }, expectedVersion: 1 }, id)), "invalid_name");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), name: "n".repeat(121) }, expectedVersion: 1 }, id)), "invalid_name");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), brandColor: "pink" }, expectedVersion: 1 }, id)), "invalid_color");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: editable(), expectedVersion: -1 }, id)), "invalid_expected_version");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: editable() }, id)), "invalid_expected_version");
});

test("URLs: http(s) only, including nested image urls; data: only when allowed", () => {
  const id = "store-doobie-nights";
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), website: "javascript:alert(1)" }, expectedVersion: 1 }, id)), "invalid_url");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), logoUrl: "not a url" }, expectedVersion: 1 }, id)), "invalid_url");
  const rec = editable();
  rec.menu![0].items[0].imageUrl = "file:///etc/passwd";
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: rec, expectedVersion: 1 }, id)), "invalid_url");
  const rec2 = editable();
  rec2.deals![0].imageUrl = "ftp://x/y.png";
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: rec2, expectedVersion: 1 }, id)), "invalid_url");
  const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), logoUrl: dataUrl }, expectedVersion: 1 }, id)), "invalid_url");
  assert.ok(validateMerchantRecordUpdate({ record: { ...editable(), logoUrl: dataUrl }, expectedVersion: 1 }, id, { allowDataImageUrls: true }).ok);
});

test("arrays must be arrays; entries need ids and titles; hours are sane", () => {
  const id = "store-doobie-nights";
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), deals: {} }, expectedVersion: 1 }, id)), "invalid_record");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), menu: [{ category: "x", items: "no" }] }, expectedVersion: 1 }, id)), "invalid_record");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: { ...editable(), whatsNew: [{ title: "no id" }] }, expectedVersion: 1 }, id)), "invalid_record");
  assert.equal(
    errorOf(validateMerchantRecordUpdate({ record: { ...editable(), hours: { intervals: [{ day: 7, opensAt: "09:00", closesAt: "10:00" }] } }, expectedVersion: 1 }, id)),
    "invalid_hours"
  );
  assert.equal(
    errorOf(validateMerchantRecordUpdate({ record: { ...editable(), hours: { intervals: [{ day: 1, opensAt: "9am", closesAt: "10:00" }] } }, expectedVersion: 1 }, id)),
    "invalid_hours"
  );
});

test("total JSON size limit", () => {
  const r = validateMerchantRecordUpdate({ record: { ...editable(), description: "x".repeat(950 * 1024) }, expectedVersion: 1 }, "store-doobie-nights");
  assert.equal(errorOf(r), "record_too_large");
  assert.equal(r.ok ? 0 : r.status, 413);
});

test("account emails are normalized; markRequestDone needs a requestId", () => {
  const id = "store-doobie-nights";
  const r = validateMerchantRecordUpdate(
    { record: editable(), expectedVersion: 1, account: { dashboardEmails: [" Owner@DoobieNights.com ", "owner@doobienights.com"] } },
    id
  );
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.value.account, { dashboardEmails: ["owner@doobienights.com"] });
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: editable(), expectedVersion: 1, account: { dashboardEmails: ["nope"] } }, id)), "invalid_account");
  assert.equal(errorOf(validateMerchantRecordUpdate({ record: editable(), expectedVersion: 1, markRequestDone: true }, id)), "invalid_payload");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
