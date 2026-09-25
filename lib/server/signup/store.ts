// lib/server/signup/store.ts
//
// SERVER ONLY. Where sign-ups are written, in the site's own Firebase
// project (papexweb-aed97, lib/server/firebaseAdminWeb.ts):
//
//   waitlist/{auto-id}           demo requests. The document shape is FROZEN:
//                                it is byte-for-byte what DemoForm.tsx wrote
//                                with the client SDK before this route
//                                existed, so whatever reads the waitlist keeps
//                                working. See buildWaitlistDoc.
//   blog_subscribers/{sha256}    blog sign-ups, one doc per lower-cased email.
//                                The id is sha256(email), so a repeat sign-up
//                                can't create a duplicate; the FIRST sign-up
//                                wins (its source/path/createdAt are kept).
//
// The Firestore handle and the server-timestamp sentinel are injected, so
// tests run against a fake and never touch a real project.

import { createHash } from "node:crypto";
import type { BlogSignup, BlogSource, DemoRequest } from "../../signup/schema";

export const WAITLIST_COLLECTION = "waitlist";
export const BLOG_SUBSCRIBERS_COLLECTION = "blog_subscribers";
/** The marker the DemoForm always stamped on its waitlist docs. */
export const DEMO_REQUEST_TYPE = "business-demo-request";

export interface WaitlistDoc<TS> {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  posSystem: string;
  type: typeof DEMO_REQUEST_TYPE;
  createdAt: TS;
}

export interface BlogSubscriberDoc<TS> {
  email: string;
  source: BlogSource;
  path?: string;
  createdAt: TS;
}

/** Exactly the fields (and key order) the old client-side addDoc wrote. */
export function buildWaitlistDoc<TS>(demo: DemoRequest, createdAt: TS): WaitlistDoc<TS> {
  return {
    fullName: demo.fullName,
    businessName: demo.businessName,
    email: demo.email,
    phone: demo.phone,
    posSystem: demo.posSystem,
    type: DEMO_REQUEST_TYPE,
    createdAt,
  };
}

export function buildBlogSubscriberDoc<TS>(blog: BlogSignup, createdAt: TS): BlogSubscriberDoc<TS> {
  const doc: BlogSubscriberDoc<TS> = { email: blog.email, source: blog.source, createdAt };
  if (blog.path) doc.path = blog.path;
  return doc;
}

/** Deterministic doc id: hex sha256 of the lower-cased, trimmed email. */
export function blogSubscriberId(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase(), "utf8").digest("hex");
}

export interface SignupStore {
  saveDemoRequest(demo: DemoRequest): Promise<void>;
  /** created=false when this email was already subscribed (nothing written). */
  saveBlogSubscriber(blog: BlogSignup): Promise<{ created: boolean }>;
}

/** The slice of firebase-admin's Firestore this store uses (lets tests pass a fake). */
export interface MinimalFirestore {
  collection(name: string): {
    add(data: object): Promise<unknown>;
    doc(id: string): { create(data: object): Promise<unknown> };
  };
}

function isAlreadyExists(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  // gRPC status 6 = ALREADY_EXISTS; some SDK paths surface the string form.
  return code === 6 || code === "already-exists" || code === "ALREADY_EXISTS";
}

export function createFirestoreSignupStore(db: MinimalFirestore, serverTimestamp: () => unknown): SignupStore {
  return {
    async saveDemoRequest(demo) {
      await db.collection(WAITLIST_COLLECTION).add(buildWaitlistDoc(demo, serverTimestamp()));
    },
    async saveBlogSubscriber(blog) {
      try {
        await db
          .collection(BLOG_SUBSCRIBERS_COLLECTION)
          .doc(blogSubscriberId(blog.email))
          .create(buildBlogSubscriberDoc(blog, serverTimestamp()));
        return { created: true };
      } catch (err) {
        if (isAlreadyExists(err)) return { created: false };
        throw err;
      }
    },
  };
}
