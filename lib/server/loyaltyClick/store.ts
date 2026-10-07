// lib/server/loyaltyClick/store.ts
//
// Firestore (papexweb-aed97) implementation of LoyaltyClickStore. See
// ./handler.ts for the document shapes and the dedupe rule.

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  LOYALTY_CLICKS_COLLECTION,
  LOYALTY_CLICKS_DAILY_COLLECTION,
  eventId,
  type LoyaltyClickEvent,
  type LoyaltyClickStore,
} from "./handler";

/** gRPC ALREADY_EXISTS: the create() lost to an earlier click in the same minute. */
function isAlreadyExists(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  return code === 6 || code === "already-exists" || code === "ALREADY_EXISTS";
}

export function createFirestoreLoyaltyClickStore(db: Firestore): LoyaltyClickStore {
  return {
    async record(e: LoyaltyClickEvent) {
      const batch = db.batch();
      batch.create(db.collection(LOYALTY_CLICKS_COLLECTION).doc(eventId(e)), {
        merchantId: e.merchantId,
        sid: e.sid,
        page: e.page,
        ctaVersion: e.ctaVersion,
        platform: e.platform,
        day: e.day,
        ts: FieldValue.serverTimestamp(),
      });
      batch.set(
        db.collection(LOYALTY_CLICKS_DAILY_COLLECTION).doc(`${e.merchantId}_${e.day}`),
        { merchantId: e.merchantId, day: e.day, count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      try {
        await batch.commit();
        return "recorded";
      } catch (err) {
        if (isAlreadyExists(err)) return "duplicate";
        throw err;
      }
    },
  };
}
