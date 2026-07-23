// lib/firebaseMerchantAuth.ts
//
// Merchant-dashboard auth wrapper. Talks to the DEFAULT Firebase app
// (firebase/firebaseConfig.ts, project `papexweb-aed97` — this marketing
// site's own project) via email/password, per PRD §8-Q1 (DECIDED:
// admin-provisioned merchant users, `merchant_id` custom claim via Admin
// SDK, built-in Firebase invite/password-reset email flows).
//
// Deliberately NOT lib/firebaseClientApp.ts — that's a second Firebase app
// instance pointed at the *separate* `papexv2` project for the RDH consumer
// claim flow (app/r/SaveToPapex.tsx), and its own header comment forbids
// merging the two. Different project, different users, different concern.
//
// The RDH merchant API (Papex_RDH merchant-api Lambda) verifies the ID
// token itself via API Gateway's JWT authorizer (issuer
// `securetoken.google.com/papexweb-aed97`) and resolves merchant_id
// server-side from a uid -> merchant_id registry lookup — the token/custom
// claim is never trusted as the authorization source of truth, only as a
// hint. This module's only job is producing that ID token client-side.

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Unsubscribe,
  type AuthError,
} from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export type { User };

/** Friendly copy for the handful of Firebase Auth error codes merchants will actually hit. */
export function describeAuthError(err: unknown): string {
  const code = (err as AuthError | undefined)?.code;
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact PapeX support.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    default:
      return "Something went wrong signing in. Please try again.";
  }
}

/** Sign in an admin-provisioned merchant user. Throws the raw FirebaseError on failure. */
export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Thin wrapper so callers don't import `auth` directly (keeps the default-app boundary in one place). */
export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}

/** No self-signup in pilot (PRD §3) — this is the only account-recovery path merchants have. */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  await firebaseSendPasswordResetEmail(auth, email);
}

/** Fresh ID token for the currently signed-in user, or null if signed out. Used by lib/merchantApi.ts. */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
