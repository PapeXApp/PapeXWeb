"use client";

// app/merchant/AuthContext.tsx
//
// Thin React context around lib/firebaseMerchantAuth.ts so every page under
// app/merchant/* can read the signed-in user and grab a fresh ID token
// without each one wiring up its own onAuthStateChanged listener. The auth
// *gate* (redirect to /merchant/login when signed out) lives in layout.tsx,
// not here — this context only tracks state, deliberately with no
// navigation side effects, so it stays reusable from the login page itself
// (which must render normally while signed out).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  getIdToken as fetchIdToken,
  signOut as firebaseSignOut,
  type User,
} from "@/lib/firebaseMerchantAuth";
import { MERCHANT_MOCK } from "@/lib/merchantApi";

interface MerchantAuthState {
  user: User | null;
  /** false only until the first onAuthStateChanged callback fires. */
  loading: boolean;
  /** Fresh Firebase ID token for the signed-in user, or null if signed out. */
  getIdToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Mock-mode auth bypass (LOCAL DESIGN WORK ONLY)
// ---------------------------------------------------------------------------
//
// NEXT_PUBLIC_MERCHANT_MOCK=1 makes every lib/merchantApi.ts call return
// seeded fixtures, but it does NOT make you signed in — so the whole
// dashboard still bounced to /merchant/login and none of it could be looked
// at without real Firebase credentials. That made mock mode useless for the
// thing it exists for: iterating on the design with no backend.
//
// This stands in a fake signed-in merchant so the gate in layout.tsx opens.
// It is deliberately double-gated:
//   - MERCHANT_MOCK          — the fixtures flag, only ever set in .env.local
//   - NODE_ENV !== production — dead on any `next build`, so a Vercel
//                               deployment cannot enable it even if the mock
//                               env var were set on it by mistake.
// Both must hold. Real Firebase auth is completely untouched otherwise.
const MOCK_AUTH =
  MERCHANT_MOCK && process.env.NODE_ENV !== "production";

/**
 * Minimum shape the dashboard actually reads off `user` (layout.tsx uses
 * `displayName` / `email` for the nav identity label; nothing else touches
 * it). Cast rather than constructed in full because Firebase's `User` is a
 * ~20-member interface of methods no mock-mode code path ever calls.
 */
const MOCK_USER = {
  uid: "mock-merchant-uid",
  email: "design@papex.app",
  displayName: "Mock Merchant",
  emailVerified: true,
} as unknown as User;

/**
 * Non-empty on purpose: every page guards its fetch with `if (!token) return`,
 * so a null token would leave mock mode showing empty screens. The value is
 * never sent anywhere — lib/merchantApi.ts short-circuits to fixtures before
 * any fetch when MERCHANT_MOCK is on.
 */
const MOCK_ID_TOKEN = "mock-id-token";

const MerchantAuthContext = createContext<MerchantAuthState | null>(null);

export function MerchantAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_AUTH ? MOCK_USER : null);
  const [loading, setLoading] = useState(!MOCK_AUTH);

  useEffect(() => {
    // Never attach the real listener under the mock bypass — Firebase would
    // report "signed out" and immediately undo the stand-in user.
    if (MOCK_AUTH) return;
    const unsubscribe = onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // These identities are load-bearing, not a micro-optimisation. Every page
  // under app/merchant/* fetches inside a `useEffect` that lists `getIdToken`
  // in its dependency array (transactions, insights, devices, receipt detail,
  // forensics, and both panel sections — seven at last count). Rebuilding the
  // context value — and with it a fresh `getIdToken` closure — on every render
  // made each of those effects re-run on every render: fetch → setState →
  // render → new closure → fetch again, a runaway request loop against the
  // live API that only stopped when the page was closed.
  //
  // It presented as a UI bug rather than a performance one: toggling the
  // traffic index to 30d fired one 30d request that the ongoing 7d loop then
  // overwrote, so the card appeared frozen on 7d.
  //
  // Neither function closes over anything, so both are stable for the life of
  // the provider and the value only changes when `user` or `loading` actually
  // does.
  const getIdToken = useCallback(
    () => (MOCK_AUTH ? Promise.resolve<string | null>(MOCK_ID_TOKEN) : fetchIdToken()),
    []
  );
  const signOut = useCallback(async () => {
    if (MOCK_AUTH) {
      // Let "Sign out" still do something visible locally (drops you at the
      // login page) without touching Firebase.
      setUser(null);
      return;
    }
    await firebaseSignOut();
  }, []);

  const value: MerchantAuthState = useMemo(
    () => ({ user, loading, getIdToken, signOut }),
    [user, loading, getIdToken, signOut]
  );

  return <MerchantAuthContext.Provider value={value}>{children}</MerchantAuthContext.Provider>;
}

export function useMerchantAuth(): MerchantAuthState {
  const ctx = useContext(MerchantAuthContext);
  if (!ctx) throw new Error("useMerchantAuth must be used within MerchantAuthProvider");
  return ctx;
}
