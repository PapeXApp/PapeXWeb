// lib/firebaseClientApp.ts
//
// Second Firebase app instance, used only by the RDH "Save to PapeX"
// sign-in sheet (app/r/SaveToPapex.tsx). This talks to the PapeX *mobile
// app's* Firebase project ('papexv2') so a user can sign in with the same
// account they use in the app and claim an RDH receipt into it — an
// entirely different concern from firebase/firebaseConfig.ts's
// 'papexweb-aed97' project, which backs this marketing site's own features
// (blog image uploads, waitlist, etc). Do NOT merge these two apps: they
// are different Firebase projects with different users, and
// firebase/firebaseConfig.ts's default `getApp()`/`initializeApp()` calls
// must keep resolving to papexweb-aed97 unmodified.
//
// Config mirrors PapeXV2/config/firebase.ts's `firebaseConfig` object
// exactly. Firebase web config values are not secrets (access is enforced
// by Firebase Auth + security rules, not by hiding the apiKey), so this is
// safe to ship client-side same as the app does.
//
// Everything here is lazy (no module-level `initializeApp` call) so
// importing this module has no side effects during SSR/prerendering — the
// app only actually initializes when a browser click handler calls
// `getPapexV2Auth()`.

import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// Type-only: erased at build, so it adds nothing to any bundle (see getPapexV2Firestore).
import type { Firestore } from "firebase/firestore";

const PAPEXV2_CLIENT_APP_NAME = "papexv2-client";

const papexv2FirebaseConfig = {
  apiKey: "AIzaSyBAFmZS1Itv2zzfGNZRbOcnM6LqYsi6YLM",
  authDomain: "papexv2.firebaseapp.com",
  projectId: "papexv2",
  storageBucket: "papexv2.firebasestorage.app",
  messagingSenderId: "96336096323",
  appId: "1:96336096323:web:e545593a842f6484b7b8f6",
  measurementId: "G-4L5B5MLFG5",
};

function getPapexV2App(): FirebaseApp {
  const existing = getApps().find((a) => a.name === PAPEXV2_CLIENT_APP_NAME);
  if (existing) return existing;
  try {
    return initializeApp(papexv2FirebaseConfig, PAPEXV2_CLIENT_APP_NAME);
  } catch {
    // Hot-reload / concurrent-call race: another caller initialized it
    // between our getApps() check and initializeApp() above.
    return getApp(PAPEXV2_CLIENT_APP_NAME);
  }
}

let cachedAuth: Auth | null = null;

export function getPapexV2Auth(): Auth {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getPapexV2App());
  return cachedAuth;
}

// Firestore on the same papexv2 app, for the merchant dashboard's live
// profile view (lib/merchantProfilesClient.ts subscribes to the PUBLIC-READ
// `merchants/{merchantId}` doc; no sign-in on this app is needed for that).
//
// Async + dynamic import on purpose: a static `import "firebase/firestore"`
// here would register the Firestore component (the package is marked
// side-effectful, so it can't be tree-shaken) and ship ~100KB of Firestore
// into every bundle that imports this module, including the /r receipt
// fallback's Save-to-PapeX sheet, which never touches Firestore. Same
// "nothing happens until a browser caller asks" rule as the rest of the file.
let cachedDb: Firestore | null = null;

export async function getPapexV2Firestore(): Promise<Firestore> {
  if (cachedDb) return cachedDb;
  const { getFirestore } = await import("firebase/firestore");
  cachedDb = getFirestore(getPapexV2App());
  return cachedDb;
}
