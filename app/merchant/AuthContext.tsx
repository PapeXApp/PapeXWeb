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

interface MerchantAuthState {
  user: User | null;
  /** false only until the first onAuthStateChanged callback fires. */
  loading: boolean;
  /** Fresh Firebase ID token for the signed-in user, or null if signed out. */
  getIdToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const MerchantAuthContext = createContext<MerchantAuthState | null>(null);

export function MerchantAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  const getIdToken = useCallback(() => fetchIdToken(), []);
  const signOut = useCallback(() => firebaseSignOut(), []);

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
