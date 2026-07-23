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

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  const value: MerchantAuthState = {
    user,
    loading,
    getIdToken: () => fetchIdToken(),
    signOut: () => firebaseSignOut(),
  };

  return <MerchantAuthContext.Provider value={value}>{children}</MerchantAuthContext.Provider>;
}

export function useMerchantAuth(): MerchantAuthState {
  const ctx = useContext(MerchantAuthContext);
  if (!ctx) throw new Error("useMerchantAuth must be used within MerchantAuthProvider");
  return ctx;
}
