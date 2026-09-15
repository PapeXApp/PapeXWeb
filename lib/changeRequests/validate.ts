// lib/changeRequests/validate.ts
//
// Pure validation for everything a client can send to the merchant profile
// routes: change requests (payload + image files), admin status updates, and
// admin edits of the shared merchant record. No I/O, no Node-only APIs
// (Uint8Array, not Buffer), so it runs the same in tests and in a route.
//
// Every failure carries a stable snake_case `error` code for the client to
// switch on, plus a plain-English `message` a UI may show as is. Keep the
// messages free of em dashes (PapeXWeb copy rule).

import {
  CHANGE_REQUEST_LIMITS,
  type ChangeRequestAction,
  type ChangeRequestInput,
  type ChangeRequestSection,
  type ChangeRequestStatus,
  type ChangeRequestStatusUpdate,
} from "./types";
import type { AdminMerchantUpdate, MerchantAccount, MerchantRecord } from "../merchantProfiles/types";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; message: string; status: number };

function fail<T>(error: string, message: string, status = 400): ValidationResult<T> {
  return { ok: false, error, message, status };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ── Enums ────────────────────────────────────────────────────────────────

export const CHANGE_REQUEST_SECTIONS: readonly ChangeRequestSection[] = [
  "brand",
  "about",
  "hours",
  "contact",
  "menu",
  "deals",
  "coupons",
  "whatsNew",
  "loyalty",
  "other",
];
export const CHANGE_REQUEST_ACTIONS: readonly ChangeRequestAction[] = ["update", "add", "remove"];
export const CHANGE_REQUEST_STATUSES: readonly ChangeRequestStatus[] = ["received", "in_progress", "done", "declined"];

export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const MAX_ITEM_ID_CHARS = 100;

/** Firestore doc ids: no "/", and we keep them boring on purpose. */
const MERCHANT_ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
export function isValidMerchantId(id: unknown): id is string {
  return typeof id === "string" && MERCHANT_ID_RE.test(id);
}

/** Change request ids / attachment ids we mint (uuid or hex), plus slack. */
const OPAQUE_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
export function isValidOpaqueId(id: unknown): id is string {
  return typeof id === "string" && OPAQUE_ID_RE.test(id);
}

// ── Change request payload ───────────────────────────────────────────────

/**
 * Validates the JSON `payload` field. `fileCount` is the number of files in
 * the same multipart body, because an image alone is a valid request.
 * Returns a normalized copy (message trimmed, empty colors dropped).
 */
export function validateChangeRequestInput(raw: unknown, fileCount: number): ValidationResult<ChangeRequestInput> {
  if (!isPlainObject(raw)) return fail("invalid_payload", "The request payload must be a JSON object.");

  const section = raw.section;
  if (typeof section !== "string" || !CHANGE_REQUEST_SECTIONS.includes(section as ChangeRequestSection)) {
    return fail("invalid_section", "Pick which part of your profile this is about.");
  }
  const action = raw.action;
  if (typeof action !== "string" || !CHANGE_REQUEST_ACTIONS.includes(action as ChangeRequestAction)) {
    return fail("invalid_action", "Pick whether to update, add or remove.");
  }

  const rawItems = raw.itemIds ?? [];
  if (!Array.isArray(rawItems)) return fail("invalid_item_ids", "The picked items must be a list.");
  if (rawItems.length > CHANGE_REQUEST_LIMITS.maxItems) {
    return fail("too_many_items", `Pick at most ${CHANGE_REQUEST_LIMITS.maxItems} items per request.`);
  }
  const itemIds: string[] = [];
  for (const it of rawItems) {
    if (typeof it !== "string" || it.length === 0 || it.length > MAX_ITEM_ID_CHARS) {
      return fail("invalid_item_ids", "One of the picked items is not valid.");
    }
    if (!itemIds.includes(it)) itemIds.push(it);
  }

  const rawMessage = raw.message ?? "";
  if (typeof rawMessage !== "string") return fail("invalid_message", "The message must be text.");
  const message = rawMessage.trim();
  if (message.length > CHANGE_REQUEST_LIMITS.maxMessageChars) {
    return fail("message_too_long", `Keep the message under ${CHANGE_REQUEST_LIMITS.maxMessageChars} characters.`);
  }

  let proposedColors: ChangeRequestInput["proposedColors"];
  if (raw.proposedColors !== undefined && raw.proposedColors !== null) {
    if (!isPlainObject(raw.proposedColors)) return fail("invalid_color", "Colors must be hex values like #F12AF8.");
    const out: { primary?: string; secondary?: string } = {};
    for (const key of ["primary", "secondary"] as const) {
      const v = raw.proposedColors[key];
      if (v === undefined || v === null || v === "") continue;
      if (typeof v !== "string" || !HEX_COLOR_RE.test(v)) {
        return fail("invalid_color", "Colors must be hex values like #F12AF8.");
      }
      out[key] = v.toUpperCase();
    }
    if (out.primary || out.secondary) proposedColors = out;
  }

  if (message.length === 0 && itemIds.length === 0 && !proposedColors && fileCount === 0) {
    return fail("empty_request", "Add a message, pick an item, propose a color or attach an image.");
  }

  const value: ChangeRequestInput = { section: section as ChangeRequestSection, action: action as ChangeRequestAction, itemIds, message };
  if (proposedColors) value.proposedColors = proposedColors;
  return { ok: true, value };
}

// ── Files ────────────────────────────────────────────────────────────────

export type AllowedImageType = (typeof CHANGE_REQUEST_LIMITS.allowedTypes)[number];

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis"]);
const HEIF_BRANDS = new Set(["mif1", "msf1"]);

function ascii(bytes: Uint8Array, start: number, len: number): string {
  let s = "";
  for (let i = start; i < start + len && i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/**
 * Identifies an image by its magic bytes. The declared Content-Type of an
 * upload is never trusted: a renamed SVG or HTML file must not get stored
 * (and later served) as "image/png".
 */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  // ISO-BMFF: [size:4]["ftyp"][major brand:4][minor:4][compatible brands:4*n]
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const boxSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    const end = Math.min(bytes.length, boxSize >= 16 ? boxSize : 12, 64);
    const brands = [ascii(bytes, 8, 4)];
    for (let off = 16; off + 4 <= end; off += 4) brands.push(ascii(bytes, off, 4));
    if (brands.includes("avif") || brands.includes("avis")) return null; // AVIF is not on the list
    if (brands.some((b) => HEIC_BRANDS.has(b))) return "image/heic";
    if (brands.some((b) => HEIF_BRANDS.has(b))) return "image/heif";
  }
  return null;
}

const EXT_FOR_TYPE: Record<AllowedImageType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};
export function extensionForImageType(type: AllowedImageType): string {
  return EXT_FOR_TYPE[type];
}

/**
 * A storage-safe, display-safe file name: basename only, ASCII
 * [A-Za-z0-9._-], at most 80 chars, extension forced to the SNIFFED type.
 */
export function sanitizeFileName(name: string, type: AllowedImageType): string {
  const base = (name.split(/[\\/]/).pop() ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const dot = base.lastIndexOf(".");
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 70);
  return `${stem || "image"}.${EXT_FOR_TYPE[type]}`;
}

export interface IncomingFile {
  name: string;
  /** What the client claimed. Ignored for the decision; sniffing decides. */
  declaredType?: string;
  bytes: Uint8Array;
}

export interface ValidatedFile {
  /** Sanitized. */
  name: string;
  /** Sniffed, never the declared type. */
  contentType: AllowedImageType;
  size: number;
  bytes: Uint8Array;
}

export function validateUploadFiles(
  files: IncomingFile[],
  opts: { maxFiles?: number; allowedTypes?: readonly AllowedImageType[] } = {}
): ValidationResult<ValidatedFile[]> {
  const maxFiles = opts.maxFiles ?? CHANGE_REQUEST_LIMITS.maxFiles;
  const allowed: readonly AllowedImageType[] = opts.allowedTypes ?? CHANGE_REQUEST_LIMITS.allowedTypes;
  if (files.length > maxFiles) return fail("too_many_files", `Attach at most ${maxFiles} images.`);
  const out: ValidatedFile[] = [];
  for (const f of files) {
    if (f.bytes.length === 0) return fail("empty_file", "One of the images is empty.");
    if (f.bytes.length > CHANGE_REQUEST_LIMITS.maxFileBytes) {
      return fail("file_too_large", `Each image must be under ${Math.round(CHANGE_REQUEST_LIMITS.maxFileBytes / (1024 * 1024))} MB.`, 413);
    }
    const sniffed = sniffImageType(f.bytes);
    if (!sniffed || !allowed.includes(sniffed)) {
      return fail("unsupported_file_type", "Images must be PNG, JPEG, WebP or HEIC.", 415);
    }
    out.push({ name: sanitizeFileName(f.name || "image", sniffed), contentType: sniffed, size: f.bytes.length, bytes: f.bytes });
  }
  return { ok: true, value: out };
}

// ── Admin: status update ─────────────────────────────────────────────────

/** `adminNote: ""` means "clear the note"; an absent adminNote keeps it. */
export function validateStatusUpdate(raw: unknown): ValidationResult<ChangeRequestStatusUpdate> {
  if (!isPlainObject(raw)) return fail("invalid_payload", "The update must be a JSON object.");
  const status = raw.status;
  if (typeof status !== "string" || !CHANGE_REQUEST_STATUSES.includes(status as ChangeRequestStatus)) {
    return fail("invalid_status", "Status must be received, in_progress, done or declined.");
  }
  const value: ChangeRequestStatusUpdate = { status: status as ChangeRequestStatus };
  if (raw.adminNote !== undefined && raw.adminNote !== null) {
    if (typeof raw.adminNote !== "string") return fail("invalid_admin_note", "The note must be text.");
    const note = raw.adminNote.trim();
    if (note.length > CHANGE_REQUEST_LIMITS.maxAdminNoteChars) {
      return fail("admin_note_too_long", `Keep the note under ${CHANGE_REQUEST_LIMITS.maxAdminNoteChars} characters.`);
    }
    value.adminNote = note;
  }
  return { ok: true, value };
}

// ── Admin: merchant record update ────────────────────────────────────────

/** Firestore caps a document at 1 MiB; leave headroom for the server-owned fields. */
export const MAX_RECORD_JSON_BYTES = 900 * 1024;
const MAX_NAME_CHARS = 120;
const MAX_DASHBOARD_EMAILS = 50;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const SERVER_OWNED_KEYS = ["version", "updatedAt", "updatedBy"] as const;
/** Every editable top-level field of MerchantRecord (lib/merchantProfiles/types.ts). */
const RECORD_KEYS = new Set([
  "id", "name", "logoUrl", "heroImageUrl", "brandColor", "brandColorSecondary", "category",
  "blurb", "website", "address", "phone", "hours", "description", "menuCategories", "menuUrl",
  "menu", "deals", "whatsNew", "coupons", "loyaltyProgram",
]);

export interface RecordUpdateOptions {
  /** Mock mode only: uploaded assets come back as data: URLs. */
  allowDataImageUrls?: boolean;
  maxJsonBytes?: number;
}

function checkUrl(v: unknown, field: string, opts: RecordUpdateOptions): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") return `${field} must be a URL.`;
  if (opts.allowDataImageUrls && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return `${field} must start with http:// or https://.`;
    return null;
  } catch {
    return `${field} must be a full URL starting with https://.`;
  }
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Light structural validation of an admin edit. Not a full schema: it
 * blocks the things that would break the app or open a hole (wrong id, bad
 * colors, javascript: URLs, non-arrays where the app maps over arrays,
 * oversize documents), and passes anything else through untouched.
 */
export function validateMerchantRecordUpdate(
  raw: unknown,
  pathId: string,
  opts: RecordUpdateOptions = {}
): ValidationResult<AdminMerchantUpdate> {
  if (!isPlainObject(raw)) return fail("invalid_payload", "The update must be a JSON object.");
  const maxBytes = opts.maxJsonBytes ?? MAX_RECORD_JSON_BYTES;

  const ev = raw.expectedVersion;
  if (typeof ev !== "number" || !Number.isInteger(ev) || ev < 0) {
    return fail("invalid_expected_version", "expectedVersion must be the version you loaded.");
  }
  if (!isPlainObject(raw.record)) return fail("invalid_record", "record must be an object.");
  const record: Record<string, unknown> = { ...raw.record };
  for (const k of SERVER_OWNED_KEYS) delete record[k];
  // merchants/{id} is PUBLIC READ: drop anything that isn't a known record
  // field, so a pasted private value (e.g. login emails) can't leak into it.
  for (const k of Object.keys(record)) {
    if (!RECORD_KEYS.has(k)) delete record[k];
  }

  if (record.id !== pathId) return fail("id_mismatch", "record.id must match the merchant in the URL.");
  if (typeof record.name !== "string" || record.name.trim().length === 0) {
    return fail("invalid_name", "The merchant needs a name.");
  }
  if (record.name.trim().length > MAX_NAME_CHARS) return fail("invalid_name", `Keep the name under ${MAX_NAME_CHARS} characters.`);
  record.name = record.name.trim();

  for (const key of ["brandColor", "brandColorSecondary"]) {
    const v = record[key];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string" || !HEX_COLOR_RE.test(v)) return fail("invalid_color", `${key} must be a hex color like #F12AF8.`);
  }

  for (const key of ["logoUrl", "heroImageUrl", "website", "menuUrl"]) {
    const err = checkUrl(record[key], key, opts);
    if (err) return fail("invalid_url", err);
  }

  for (const key of ["menuCategories", "menu", "deals", "whatsNew", "coupons"]) {
    if (record[key] !== undefined && !Array.isArray(record[key])) return fail("invalid_record", `${key} must be a list.`);
  }
  if (Array.isArray(record.menuCategories) && !record.menuCategories.every((c) => typeof c === "string")) {
    return fail("invalid_record", "menuCategories must be a list of names.");
  }
  if (Array.isArray(record.menu)) {
    for (const cat of record.menu) {
      if (!isPlainObject(cat) || typeof cat.category !== "string" || !Array.isArray(cat.items)) {
        return fail("invalid_record", "Each menu section needs a category name and a list of items.");
      }
      for (const item of cat.items) {
        if (!isPlainObject(item) || typeof item.name !== "string" || typeof item.price !== "number" || !Number.isFinite(item.price)) {
          return fail("invalid_record", "Each menu item needs a name and a numeric price.");
        }
        const err = checkUrl(item.imageUrl, "Menu item image", opts);
        if (err) return fail("invalid_url", err);
      }
    }
  }
  for (const key of ["deals", "whatsNew", "coupons"] as const) {
    const list = record[key];
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!isPlainObject(entry) || typeof entry.id !== "string" || entry.id.length === 0 || typeof entry.title !== "string") {
        return fail("invalid_record", `Each entry in ${key} needs an id and a title.`);
      }
      if (key === "deals") {
        const err = checkUrl(entry.imageUrl, "Deal image", opts);
        if (err) return fail("invalid_url", err);
      }
    }
  }
  if (record.hours !== undefined) {
    const h = record.hours;
    if (!isPlainObject(h) || !Array.isArray(h.intervals)) return fail("invalid_hours", "hours needs a list of intervals.");
    for (const iv of h.intervals) {
      if (
        !isPlainObject(iv) ||
        typeof iv.day !== "number" ||
        !Number.isInteger(iv.day) ||
        iv.day < 0 ||
        iv.day > 6 ||
        typeof iv.opensAt !== "string" ||
        typeof iv.closesAt !== "string" ||
        !HHMM_RE.test(iv.opensAt) ||
        !HHMM_RE.test(iv.closesAt)
      ) {
        return fail("invalid_hours", "Each opening interval needs a day (0 to 6) and HH:MM times.");
      }
    }
  }
  if (record.loyaltyProgram !== undefined && !isPlainObject(record.loyaltyProgram)) {
    return fail("invalid_record", "loyaltyProgram must be an object.");
  }

  const value: AdminMerchantUpdate = {
    record: record as AdminMerchantUpdate["record"],
    expectedVersion: ev,
  };

  if (raw.account !== undefined && raw.account !== null) {
    if (!isPlainObject(raw.account) || !Array.isArray(raw.account.dashboardEmails)) {
      return fail("invalid_account", "account needs a list of dashboard emails.");
    }
    if (raw.account.dashboardEmails.length > MAX_DASHBOARD_EMAILS) {
      return fail("invalid_account", `At most ${MAX_DASHBOARD_EMAILS} dashboard emails.`);
    }
    const emails: string[] = [];
    for (const e of raw.account.dashboardEmails) {
      if (typeof e !== "string") return fail("invalid_account", "Dashboard emails must be text.");
      const norm = e.trim().toLowerCase();
      if (norm.length > 254 || !EMAIL_RE.test(norm)) return fail("invalid_account", `"${norm}" is not a valid email.`);
      if (!emails.includes(norm)) emails.push(norm);
    }
    const account: Omit<MerchantAccount, "merchantId"> = { dashboardEmails: emails };
    const rdh = raw.account.rdhMerchantId;
    if (rdh !== undefined && rdh !== null && rdh !== "") {
      if (typeof rdh !== "string" || rdh.length > 128) return fail("invalid_account", "rdhMerchantId must be text.");
      account.rdhMerchantId = rdh;
    }
    value.account = account;
  }

  if (raw.requestId !== undefined && raw.requestId !== null) {
    if (!isValidOpaqueId(raw.requestId)) return fail("invalid_request_id", "requestId is not valid.");
    value.requestId = raw.requestId;
  }
  if (raw.markRequestDone !== undefined) {
    if (typeof raw.markRequestDone !== "boolean") return fail("invalid_payload", "markRequestDone must be true or false.");
    if (raw.markRequestDone && !value.requestId) return fail("invalid_payload", "markRequestDone needs a requestId.");
    value.markRequestDone = raw.markRequestDone;
  }

  if (byteLength(JSON.stringify(value.record)) > maxBytes) {
    return fail("record_too_large", "This profile is too large to save. Remove some content or use smaller images.", 413);
  }
  return { ok: true, value };
}

/** Narrow helper so callers can build the record type the backends store. */
export type EditableRecord = Omit<MerchantRecord, "version" | "updatedAt" | "updatedBy">;
