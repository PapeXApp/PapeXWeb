// lib/server/firebaseAdminWeb.ts
//
// SERVER ONLY. firebase-admin for THIS SITE's own Firebase project
// (`papexweb-aed97`), which owns the `waitlist` collection (demo requests
// from /business) and `blog_subscribers` (blog sign-ups). Used by the shared
// sign-up route, app/api/signup/route.ts.
//
// Same pattern as lib/server/firebaseAdminV2.ts, but a DIFFERENT project and
// therefore a different credential: that file is pinned to `papexv2` and
// refuses any other project id, and the waitlist has always lived in
// papexweb-aed97 (firebase/firebaseConfig.ts). Never import this file from a
// "use client" module: it reads a service-account private key.
//
// Credentials: env PAPEXWEB_SERVICE_ACCOUNT holds the service-account JSON,
// either raw or base64-encoded. The app is created lazily, under its own
// name, so it can never collide with the papexv2 admin app in the process.

import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const PAPEXWEB_PROJECT_ID = "papexweb-aed97";
const APP_NAME = "papexweb-admin";
export const PAPEXWEB_CREDENTIALS_ENV = "PAPEXWEB_SERVICE_ACCOUNT";

export function hasPapexWebCredentials(): boolean {
  return Boolean(process.env[PAPEXWEB_CREDENTIALS_ENV]?.trim());
}

interface RawServiceAccount {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

/** Parses the env value (raw JSON or base64 JSON). Throws with a message that never includes the key. */
export function parseWebServiceAccount(raw: string): ServiceAccount {
  const trimmed = raw.trim();
  let json: RawServiceAccount;
  try {
    const text = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
    json = JSON.parse(text) as RawServiceAccount;
  } catch {
    throw new Error(`${PAPEXWEB_CREDENTIALS_ENV} is not valid JSON (or base64 of JSON).`);
  }
  if (!json.client_email || !json.private_key) {
    throw new Error(`${PAPEXWEB_CREDENTIALS_ENV} is missing client_email or private_key.`);
  }
  // Refuse a key for any other project (notably papexv2): sign-ups written
  // there would never show up where the team reads the waitlist.
  if (json.project_id !== PAPEXWEB_PROJECT_ID) {
    throw new Error(
      `${PAPEXWEB_CREDENTIALS_ENV} is for project "${json.project_id ?? "?"}", expected "${PAPEXWEB_PROJECT_ID}".`
    );
  }
  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    // Env UIs often double-escape the PEM newlines.
    privateKey: json.private_key.replace(/\\n/g, "\n"),
  };
}

let firestoreConfigured = false;

export function getPapexWebApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  const raw = process.env[PAPEXWEB_CREDENTIALS_ENV];
  if (!raw?.trim()) throw new Error(`${PAPEXWEB_CREDENTIALS_ENV} is not set.`);
  try {
    return initializeApp({ credential: cert(parseWebServiceAccount(raw)), projectId: PAPEXWEB_PROJECT_ID }, APP_NAME);
  } catch (err) {
    // A concurrent first request may have won the race.
    if (getApps().some((a) => a.name === APP_NAME)) return getApp(APP_NAME);
    throw err;
  }
}

export function getPapexWebDb(): Firestore {
  const db = getFirestore(getPapexWebApp());
  if (!firestoreConfigured) {
    firestoreConfigured = true;
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() throws if the instance was already used; it was configured then.
    }
  }
  return db;
}
