// lib/server/firebaseAdminV2.ts
//
// SERVER ONLY. firebase-admin for the PapeX APP's Firebase project
// (`papexv2`), which owns the shared merchant record (`merchants/{id}`), the
// private `merchantAccounts`, `merchantChangeRequests`, and the Storage
// bucket for request attachments and merchant assets.
//
// ("server-only" is not installed in this repo, so there is no build-time
// guard. Never import this file from a "use client" module or anything under
// app/merchant/**: it reads a service-account private key.)
//
// Not to be confused with:
//   - firebase/firebaseConfig.ts: the CLIENT SDK for papexweb-aed97 (this
//     site's own project; merchant dashboard logins live there).
//   - lib/firebaseClientApp.ts: a CLIENT SDK app for papexv2 used by /r.
//
// Credentials: env PAPEXV2_SERVICE_ACCOUNT holds the service-account JSON,
// either raw or base64-encoded. The app is created lazily, under its own
// name, so it can never collide with any other admin app in the process.

import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const PAPEXV2_PROJECT_ID = "papexv2";
export const PAPEXV2_BUCKET = "papexv2.firebasestorage.app";
const APP_NAME = "papexv2-admin";
const ENV_KEY = "PAPEXV2_SERVICE_ACCOUNT";

export function hasPapexV2Credentials(): boolean {
  return Boolean(process.env[ENV_KEY]?.trim());
}

interface RawServiceAccount {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

/** Parses the env value (raw JSON or base64 JSON). Throws with a message that never includes the key. */
export function parseServiceAccount(raw: string): ServiceAccount {
  const trimmed = raw.trim();
  let json: RawServiceAccount;
  try {
    const text = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
    json = JSON.parse(text) as RawServiceAccount;
  } catch {
    throw new Error(`${ENV_KEY} is not valid JSON (or base64 of JSON).`);
  }
  if (!json.client_email || !json.private_key) {
    throw new Error(`${ENV_KEY} is missing client_email or private_key.`);
  }
  // Refuse a key for any other project: writing merchant data into the
  // wrong Firebase project would fail silently from the app's point of view.
  if (json.project_id !== PAPEXV2_PROJECT_ID) {
    throw new Error(`${ENV_KEY} is for project "${json.project_id ?? "?"}", expected "${PAPEXV2_PROJECT_ID}".`);
  }
  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    // Env UIs often double-escape the PEM newlines.
    privateKey: json.private_key.replace(/\\n/g, "\n"),
  };
}

let firestoreConfigured = false;

export function getPapexV2App(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  const raw = process.env[ENV_KEY];
  if (!raw?.trim()) throw new Error(`${ENV_KEY} is not set.`);
  try {
    return initializeApp(
      { credential: cert(parseServiceAccount(raw)), projectId: PAPEXV2_PROJECT_ID, storageBucket: PAPEXV2_BUCKET },
      APP_NAME
    );
  } catch (err) {
    // A concurrent first request may have won the race.
    if (getApps().some((a) => a.name === APP_NAME)) return getApp(APP_NAME);
    throw err;
  }
}

export function getPapexV2Db(): Firestore {
  const db = getFirestore(getPapexV2App());
  if (!firestoreConfigured) {
    firestoreConfigured = true;
    try {
      // Optional fields on the contract types are often `undefined`.
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() throws if the instance was already used; it was configured then.
    }
  }
  return db;
}

export function getPapexV2Bucket() {
  return getStorage(getPapexV2App()).bucket(PAPEXV2_BUCKET);
}
