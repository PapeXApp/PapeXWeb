// lib/server/merchantData/mock.ts
//
// In-memory backend for NEXT_PUBLIC_MERCHANT_MOCK=1 (never production; see
// index.ts). Seeded from lib/merchantProfiles/seed. State lives on
// globalThis so `next dev` hot reloads keep submitted requests and edits;
// restarting the server resets it. Attachments are kept as bytes and handed
// out as data: URLs.
//
// Every read and write deep-clones, so a caller mutating a returned object
// can't change the store behind the API's back (Firestore can't either).

import { SEED_ACCOUNTS, SEED_MERCHANTS } from "../../merchantProfiles/seed";
import type { MerchantAccount, MerchantHistoryEntry, MerchantRecord } from "../../merchantProfiles/types";
import type { ChangeRequest } from "../../changeRequests/types";
import { extensionForImageType } from "../../changeRequests/validate";
import type { MerchantData } from "./index";
import {
  assertRequestLinkable,
  assertUpdatable,
  attachmentPath,
  buildHistoryEntry,
  buildNextRecord,
  isOpenStatus,
  MerchantDataError,
  newestFirst,
  newId,
  normalizeAccount,
  resolveItemLabels,
  toSummary,
  type StoredAttachment,
  type StoredChangeRequest,
} from "./shared";

/** Kept here (not index.ts) so this module has no runtime import of index.ts. */
const ASSET_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface MockBlob {
  contentType: string;
  base64: string;
}

interface MockState {
  records: Map<string, MerchantRecord>;
  accounts: Map<string, MerchantAccount>;
  /** Oldest first. */
  history: Map<string, MerchantHistoryEntry[]>;
  requests: Map<string, StoredChangeRequest>;
  blobs: Map<string, MockBlob>;
}

const GLOBAL_KEY = "__papexMerchantProfileMockStore_v1__";

function freshState(): MockState {
  return {
    records: new Map(SEED_MERCHANTS.map((r) => [r.id, structuredClone(r)])),
    accounts: new Map(SEED_ACCOUNTS.map((a) => [a.merchantId, structuredClone(a)])),
    history: new Map(),
    requests: new Map(),
    blobs: new Map(),
  };
}

function state(): MockState {
  const g = globalThis as unknown as Record<string, MockState | undefined>;
  return (g[GLOBAL_KEY] ??= freshState());
}

/** Tests: back to the seed. */
export function resetMockStore(): void {
  (globalThis as unknown as Record<string, MockState | undefined>)[GLOBAL_KEY] = freshState();
}

const clone = <T>(v: T): T => structuredClone(v);

function toDataUrl(blob: MockBlob): string {
  return `data:${blob.contentType};base64,${blob.base64}`;
}

function resolve(stored: StoredChangeRequest): ChangeRequest {
  const blobs = state().blobs;
  const { attachments, ...rest } = clone(stored);
  return {
    ...rest,
    attachments: attachments.map(({ path, ...a }) => {
      const blob = blobs.get(path);
      return { ...a, url: blob ? toDataUrl(blob) : "" };
    }),
  };
}

export function createMockMerchantData(): MerchantData {
  return {
    kind: "mock",

    async getRecord(merchantId) {
      const r = state().records.get(merchantId);
      return r ? clone(r) : null;
    },

    async listSummaries() {
      const s = state();
      const open = new Map<string, number>();
      for (const r of s.requests.values()) {
        if (r.merchantId && isOpenStatus(r.status)) open.set(r.merchantId, (open.get(r.merchantId) ?? 0) + 1);
      }
      return [...s.records.values()]
        .map((r) => toSummary(r, open.get(r.id) ?? 0))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async getAccount(merchantId) {
      const a = state().accounts.get(merchantId);
      return a ? clone(a) : null;
    },

    async listHistory(merchantId, limit) {
      const list = state().history.get(merchantId) ?? [];
      return clone(list.slice(-limit).reverse());
    },

    // Mock mode has one demo login; it always manages Doobie Nights.
    async findMerchantIdForEmail() {
      return "store-doobie-nights";
    },

    async updateRecord(merchantId, update, byEmail) {
      const s = state();
      const current = s.records.get(merchantId) ?? null;
      assertUpdatable(current, update);
      const linked = update.requestId ? s.requests.get(update.requestId) ?? null : null;
      if (update.requestId) assertRequestLinkable(linked, merchantId);

      const now = new Date().toISOString();
      const next = buildNextRecord(merchantId, current?.version ?? 0, update, byEmail, now);
      const historyId = newId();
      const entry = buildHistoryEntry({
        id: historyId,
        merchantId,
        at: now,
        by: byEmail,
        requestId: update.requestId,
        before: current ?? {},
        after: next,
      });

      // No await between the checks above and these writes: atomic in JS.
      s.records.set(merchantId, clone(next));
      s.history.set(merchantId, [...(s.history.get(merchantId) ?? []), entry]);
      if (update.account) s.accounts.set(merchantId, normalizeAccount(merchantId, update.account));
      if (linked && update.markRequestDone) {
        s.requests.set(linked.id, { ...linked, status: "done", appliedHistoryId: historyId, updatedAt: now });
      }
      return { record: clone(next), historyId };
    },

    async createRequest(requester, merchantId, input, files) {
      const s = state();
      const record = merchantId ? s.records.get(merchantId) ?? null : null;
      const id = newId();
      const now = new Date().toISOString();
      const attachments: StoredAttachment[] = files.map((f) => {
        const attId = newId().slice(0, 12);
        const path = `mock://${attachmentPath(merchantId, id, attId, f.name)}`;
        s.blobs.set(path, { contentType: f.contentType, base64: Buffer.from(f.bytes).toString("base64") });
        return { id: attId, name: f.name, contentType: f.contentType, size: f.size, path };
      });
      const stored: StoredChangeRequest = {
        ...clone(input),
        id,
        merchantId,
        itemLabels: resolveItemLabels(record, input.section, input.itemIds),
        requesterUid: requester.uid,
        requesterEmail: requester.email,
        attachments,
        status: "received",
        createdAt: now,
        updatedAt: now,
      };
      if (record) stored.merchantName = record.name;
      s.requests.set(id, stored);
      return resolve(stored);
    },

    async getRequest(requestId) {
      const r = state().requests.get(requestId);
      return r ? resolve(r) : null;
    },

    async listRequestsForUser(uid) {
      return newestFirst([...state().requests.values()].filter((r) => r.requesterUid === uid)).map(resolve);
    },

    async listAllRequests(filter) {
      return newestFirst(
        [...state().requests.values()].filter(
          (r) =>
            (filter.status === undefined || r.status === filter.status) &&
            (filter.merchantId === undefined || r.merchantId === filter.merchantId)
        )
      ).map(resolve);
    },

    async updateRequestStatus(requestId, update) {
      const s = state();
      const current = s.requests.get(requestId);
      if (!current) throw new MerchantDataError(404, "request_not_found", "That change request no longer exists.");
      const next: StoredChangeRequest = { ...current, status: update.status, updatedAt: new Date().toISOString() };
      if (update.adminNote !== undefined) {
        if (update.adminNote) next.adminNote = update.adminNote;
        else delete next.adminNote;
      }
      s.requests.set(requestId, next);
      return resolve(next);
    },

    async resolveAttachmentUrls(stored) {
      return resolve(stored);
    },

    async uploadAsset(merchantId, source) {
      const s = state();
      let blob: MockBlob;
      if ("file" in source) {
        blob = { contentType: source.file.contentType, base64: Buffer.from(source.file.bytes).toString("base64") };
      } else {
        const req = s.requests.get(source.fromAttachment.requestId);
        const att = req?.attachments.find((a) => a.id === source.fromAttachment.attachmentId);
        const found = att ? s.blobs.get(att.path) : undefined;
        if (!att || !found) throw new MerchantDataError(404, "attachment_not_found", "That attachment no longer exists.");
        blob = found;
      }
      if (!ASSET_TYPES.includes(blob.contentType)) {
        throw new MerchantDataError(415, "unsupported_asset_type", "Logos and banners must be PNG, JPEG or WebP.");
      }
      // Keep a copy under the asset path too, mirroring the Firestore layout.
      const ext = extensionForImageType(blob.contentType as "image/png");
      s.blobs.set(`mock://merchant-assets/${merchantId}/${newId()}.${ext}`, blob);
      return toDataUrl(blob);
    },
  };
}
