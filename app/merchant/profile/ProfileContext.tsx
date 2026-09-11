"use client";

// app/merchant/profile/ProfileContext.tsx
//
// One GET /api/merchant/profile per signed-in session, shared by the layout
// (it needs `isAdmin` to decide whether the "Admin" nav item exists) and the
// Profile / Admin pages (they need the record and the admin flag). Mounted
// by app/merchant/layout.tsx inside the auth gate, so it only ever runs for
// a signed-in user and remounts on a new sign-in.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMerchantAuth } from "../AuthContext";
import { useProfile, type ApiError } from "@/lib/merchantProfilesClient";
import type { ProfileResponse } from "@/lib/merchantProfiles/types";

interface MerchantProfileState {
  data: ProfileResponse | null;
  error: ApiError | null;
  loading: boolean;
  reload: (opts?: { quiet?: boolean }) => Promise<void>;
  isAdmin: boolean;
}

const MerchantProfileContext = createContext<MerchantProfileState | null>(null);

export function MerchantProfileProvider({ children }: { children: ReactNode }) {
  const { getIdToken } = useMerchantAuth();
  const { data, error, loading, reload } = useProfile(getIdToken);
  const value = useMemo<MerchantProfileState>(
    () => ({ data, error, loading, reload, isAdmin: data?.isAdmin === true }),
    [data, error, loading, reload]
  );
  return <MerchantProfileContext.Provider value={value}>{children}</MerchantProfileContext.Provider>;
}

export function useMerchantProfile(): MerchantProfileState {
  const ctx = useContext(MerchantProfileContext);
  if (!ctx) throw new Error("useMerchantProfile must be used within MerchantProfileProvider");
  return ctx;
}
