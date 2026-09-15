// lib/server/merchantData/firestore.ts
//
// SERVER ONLY. The live backend: papexv2 Firestore + Storage via
// firebase-admin (lib/server/firebaseAdminV2.ts).
//
//   merchants/{id}                   public-read shared record (admin writes only)
//   merchants/{id}/history/{hid}     private edit log
//   merchantAccounts/{id}            private: dashboard emails, RDH merchant id
//   merchantChangeRequests/{rid}     private: merchant requests
//   gs://papexv2.firebasestorage.app
//     merchant-requests/{merchantId|unlinked}/{rid}/{attId}-{name}   private, 15 min signed URLs
//     merchant-assets/{merchantId}/{uuid}.{ext}                      public via download token
//
// Queries deliberately use equality filters only and sort in memory, so no
// composite index has to be deployed (indexes are console/rules territory,
// outside this repo). Fine at pilot scale; see the report for the ceiling.

import type { DocumentSnapshot, Query } from "firebase-admin/firestore";
import type { MerchantAccount, MerchantHistoryEntry, MerchantRecord } from "../../merchantProfiles/types";
import type { ChangeRequest } from "../../changeRequests/types";
import { extensionForImageType, type AllowedImageType } from "../../changeRequests/validate";
import { getPapexV2Bucket, getPapexV2Db, PAPEXV2_BUCKET } from "../firebaseAdminV2";
import { ASSET_IMAGE_TYPES, type MerchantData } from "./index";
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

const MERCHANTS = "merchants";
const ACCOUNTS = "merchantAccounts";
const REQUESTS = "merchantChangeRequests";
const HISTORY = "history";
const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

function recordFrom(snap: DocumentSnapshot): MerchantRecord | null {
  if (!snap.exists) return null;
  return { ...(snap.data() as MerchantRecord), id: snap.id };
}

function requestFrom(snap: DocumentSnapshot): StoredChangeRequest | null {
  if (!snap.exists) return null;
  const data = snap.data() as StoredChangeRequest;
  return { ...data, id: snap.id, attachments: data.attachments ?? [], itemIds: data.itemIds ?? [], itemLabels: data.itemLabels ?? [] };
}

export function publicAssetUrl(path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${PAPEXV2_BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export function createFirestoreMerchantData(): MerchantData {
  const db = () => getPapexV2Db();
  const bucket = () => getPapexV2Bucket();

  async function signedUrl(path: string): Promise<string> {
    try {
      const [url] = await bucket()
        .file(path)
        .getSignedUrl({ version: "v4", action: "read", expires: Date.now() + SIGNED_URL_TTL_MS });
      return url;
    } catch (err) {
      console.error("[merchant-profile] signing attachment URL failed:", err instanceof Error ? err.message : err);
      return "";
    }
  }

  async function resolve(stored: StoredChangeRequest): Promise<ChangeRequest> {
    const { attachments, ...rest } = stored;
    return {
      ...rest,
      attachments: await Promise.all(attachments.map(async ({ path, ...a }) => ({ ...a, url: await signedUrl(path) }))),
    };
  }

  async function getRecord(merchantId: string): Promise<MerchantRecord | null> {
    return recordFrom(await db().collection(MERCHANTS).doc(merchantId).get());
  }

  return {
    kind: "firestore",

    getRecord,

    async listSummaries() {
      const [merchants, open] = await Promise.all([
        db().collection(MERCHANTS).select("name", "logoUrl", "brandColor", "updatedAt").get(),
        db().collection(REQUESTS).where("status", "in", ["received", "in_progress"]).select("merchantId", "status").get(),
      ]);
      const counts = new Map<string, number>();
      for (const d of open.docs) {
        const { merchantId, status } = d.data() as { merchantId?: string | null; status?: string };
        if (merchantId && status && isOpenStatus(status)) counts.set(merchantId, (counts.get(merchantId) ?? 0) + 1);
      }
      return merchants.docs
        .map((d) => toSummary({ ...(d.data() as MerchantRecord), id: d.id }, counts.get(d.id) ?? 0))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async getAccount(merchantId) {
      const snap = await db().collection(ACCOUNTS).doc(merchantId).get();
      if (!snap.exists) return null;
      const data = snap.data() as Partial<MerchantAccount>;
      return { ...data, merchantId, dashboardEmails: data.dashboardEmails ?? [] };
    },

    async listHistory(merchantId, limit) {
      const snap = await db().collection(MERCHANTS).doc(merchantId).collection(HISTORY).orderBy("at", "desc").limit(limit).get();
      return snap.docs.map((d) => ({ ...(d.data() as MerchantHistoryEntry), id: d.id }));
    },

    async findMerchantIdForEmail(email) {
      const norm = email.trim().toLowerCase();
      if (!norm) return null;
      const snap = await db().collection(ACCOUNTS).where("dashboardEmails", "array-contains", norm).limit(5).get();
      const ids = snap.docs.map((d) => d.id).sort();
      if (ids.length > 1) console.warn(`[merchant-profile] a dashboard email is linked to ${ids.length} merchants; using ${ids[0]}`);
      return ids[0] ?? null;
    },

    async updateRecord(merchantId, update, byEmail) {
      const recRef = db().collection(MERCHANTS).doc(merchantId);
      const reqRef = update.requestId ? db().collection(REQUESTS).doc(update.requestId) : null;
      return db().runTransaction(async (tx) => {
        const [recSnap, reqSnap] = await Promise.all([tx.get(recRef), reqRef ? tx.get(reqRef) : Promise.resolve(null)]);
        const current = recordFrom(recSnap);
        assertUpdatable(current, update);
        const linked = reqSnap ? requestFrom(reqSnap) : null;
        if (reqRef) assertRequestLinkable(linked, merchantId);

        const now = new Date().toISOString();
        const next = buildNextRecord(merchantId, current?.version ?? 0, update, byEmail, now);
        const histRef = recRef.collection(HISTORY).doc();
        const entry = buildHistoryEntry({
          id: histRef.id,
          merchantId,
          at: now,
          by: byEmail,
          requestId: update.requestId,
          before: current ?? {},
          after: next,
        });

        tx.set(recRef, next); // full replace: removed fields really go away
        tx.set(histRef, entry);
        if (update.account) tx.set(db().collection(ACCOUNTS).doc(merchantId), normalizeAccount(merchantId, update.account));
        if (reqRef && linked && update.markRequestDone) {
          tx.update(reqRef, { status: "done", appliedHistoryId: histRef.id, updatedAt: now });
        }
        return { record: next, historyId: histRef.id };
      });
    },

    async createRequest(requester, merchantId, input, files) {
      const record = merchantId ? await getRecord(merchantId) : null;
      const id = newId();
      const now = new Date().toISOString();
      const b = bucket();

      const attachments: StoredAttachment[] = files.map((f) => {
        const attId = newId().slice(0, 12);
        return { id: attId, name: f.name, contentType: f.contentType, size: f.size, path: attachmentPath(merchantId, id, attId, f.name) };
      });
      const uploads = await Promise.allSettled(
        attachments.map((a, i) =>
          b.file(a.path).save(Buffer.from(files[i].bytes), {
            resumable: false,
            contentType: a.contentType,
            metadata: { cacheControl: "private, max-age=0", contentDisposition: `inline; filename="${a.name}"` },
          })
        )
      );
      const cleanup = () => Promise.allSettled(attachments.map((a) => b.file(a.path).delete({ ignoreNotFound: true })));
      if (uploads.some((u) => u.status === "rejected")) {
        await cleanup();
        const reason = uploads.find((u): u is PromiseRejectedResult => u.status === "rejected")?.reason;
        throw reason instanceof Error ? reason : new Error("attachment upload failed");
      }

      const stored: StoredChangeRequest = {
        ...input,
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
      try {
        await db().collection(REQUESTS).doc(id).create(stored);
      } catch (err) {
        await cleanup();
        throw err;
      }
      return resolve(stored);
    },

    async getRequest(requestId) {
      const stored = requestFrom(await db().collection(REQUESTS).doc(requestId).get());
      return stored ? resolve(stored) : null;
    },

    async listRequestsForUser(uid) {
      const snap = await db().collection(REQUESTS).where("requesterUid", "==", uid).get();
      const list = snap.docs.map((d) => requestFrom(d)).filter((r): r is StoredChangeRequest => r !== null);
      return Promise.all(newestFirst(list).map(resolve));
    },

    async listAllRequests(filter) {
      let q: Query = db().collection(REQUESTS);
      if (filter.status !== undefined) q = q.where("status", "==", filter.status);
      if (filter.merchantId !== undefined) q = q.where("merchantId", "==", filter.merchantId);
      const snap = await q.get();
      const list = snap.docs.map((d) => requestFrom(d)).filter((r): r is StoredChangeRequest => r !== null);
      return Promise.all(newestFirst(list).map(resolve));
    },

    async updateRequestStatus(requestId, update) {
      const ref = db().collection(REQUESTS).doc(requestId);
      const next = await db().runTransaction(async (tx) => {
        const current = requestFrom(await tx.get(ref));
        if (!current) throw new MerchantDataError(404, "request_not_found", "That change request no longer exists.");
        const merged: StoredChangeRequest = { ...current, status: update.status, updatedAt: new Date().toISOString() };
        if (update.adminNote !== undefined) {
          if (update.adminNote) merged.adminNote = update.adminNote;
          else delete merged.adminNote;
        }
        tx.set(ref, merged);
        return merged;
      });
      return resolve(next);
    },

    resolveAttachmentUrls: resolve,

    async uploadAsset(merchantId, source) {
      let bytes: Buffer;
      let contentType: string;
      if ("file" in source) {
        bytes = Buffer.from(source.file.bytes);
        contentType = source.file.contentType;
      } else {
        const req = requestFrom(await db().collection(REQUESTS).doc(source.fromAttachment.requestId).get());
        const att = req?.attachments.find((a) => a.id === source.fromAttachment.attachmentId);
        if (!att) throw new MerchantDataError(404, "attachment_not_found", "That attachment no longer exists.");
        contentType = att.contentType;
        if (!ASSET_IMAGE_TYPES.includes(contentType as AllowedImageType)) {
          throw new MerchantDataError(415, "unsupported_asset_type", "Logos and banners must be PNG, JPEG or WebP.");
        }
        [bytes] = await bucket().file(att.path).download();
      }
      if (!ASSET_IMAGE_TYPES.includes(contentType as AllowedImageType)) {
        throw new MerchantDataError(415, "unsupported_asset_type", "Logos and banners must be PNG, JPEG or WebP.");
      }
      const path = `merchant-assets/${merchantId}/${crypto.randomUUID()}.${extensionForImageType(contentType as AllowedImageType)}`;
      const token = crypto.randomUUID();
      await bucket()
        .file(path)
        .save(bytes, {
          resumable: false,
          contentType,
          metadata: {
            cacheControl: "public, max-age=31536000, immutable",
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });
      return publicAssetUrl(path, token);
    },
  };
}
