"use client";

// app/r/SaveToPapex.tsx
//
// "Save to PapeX" CTA + user-linking flow for the RDH receipt web viewer.
//
// - Sample receipts (no real sid, or a 404'd one): the button is disabled.
//   There's nothing to claim. We show a persistent caption rather than a
//   hover-only title tooltip, since this page's audience is "primarily
//   Android phones" (per the task brief) and phones have no hover state.
// - iOS Safari (App Clip not installed, or user landed here anyway): the
//   button is a plain link to the universal link, which hands off to the
//   full app if installed or the App Store otherwise. No auth needed here
//   — the app handles claiming once it opens with the sid.
// - Everything else (Android, desktop): clicking opens an in-page sign-in
//   sheet. Auth is against the *app's* Firebase project ('papexv2'), via a
//   second Firebase app instance (lib/firebaseClientApp.ts) — deliberately
//   not the papexweb-aed97 project firebase/firebaseConfig.ts sets up for
//   this marketing site's own features. After sign-in we grab an ID token
//   and POST it to /api/rdh/claim, which proxies to the adapter backend's
//   pinned contract: POST /api/v1/rdh/claim, body {"sid": "..."}.

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getPapexV2Auth } from "@/lib/firebaseClientApp";

const ORANGE = "#FB8500";
const TEXT_MUTED = "#9AA1A8";
const TEXT_SECONDARY = "#C4C7CC";
const APP_STORE_FALLBACK = "https://apps.apple.com/us/app/papex/id6754945242";

type ClaimOutcome =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; reauth?: boolean };

async function claimReceipt(sid: string, idToken: string): Promise<ClaimOutcome> {
  try {
    const res = await fetch("/api/rdh/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ sid }),
    });
    const json = await res.json().catch(() => ({}) as Record<string, unknown>);

    if (res.status === 200) {
      const status = (json as { status?: string }).status;
      return {
        kind: "success",
        message:
          status === "already_claimed"
            ? "This receipt is already saved to your account."
            : "Saved to your PapeX account.",
      };
    }
    if (res.status === 401) {
      return { kind: "error", message: "Your session expired. Please sign in again.", reauth: true };
    }
    if (res.status === 404) {
      return { kind: "error", message: "This receipt isn't available anymore." };
    }
    if (res.status === 409) {
      return { kind: "error", message: "This receipt was already saved by another account." };
    }
    return { kind: "error", message: "Something went wrong. Please try again." };
  } catch {
    return { kind: "error", message: "Couldn't reach PapeX. Check your connection and try again." };
  }
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full px-6 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: ORANGE }}
    >
      {children}
    </button>
  );
}

function SignInSheet({
  onAuthed,
  onClose,
}: {
  onAuthed: (user: User) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = getPapexV2Auth();
      const cred =
        mode === "signin"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      onAuthed(cred.user);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Incorrect email or password.");
      } else if (code.includes("user-not-found")) {
        setError("No PapeX account with that email yet — try Sign up instead.");
      } else if (code.includes("email-already-in-use")) {
        setError("An account already exists with that email — try Sign in instead.");
      } else if (code.includes("weak-password")) {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Couldn't sign in. Check your details and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="w-full rounded-[24px] border p-5"
      style={{ background: "rgba(20, 26, 36, 0.85)", borderColor: "rgba(255, 255, 255, 0.12)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-[#F4F4F4]">
          {mode === "signin" ? "Sign in to PapeX" : "Create a PapeX account"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm"
          style={{ color: TEXT_MUTED }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border bg-transparent px-3 py-2.5 text-sm text-[#F4F4F4] outline-none placeholder:text-[#9AA1A8]"
          style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
        />
        <input
          type="password"
          required
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border bg-transparent px-3 py-2.5 text-sm text-[#F4F4F4] outline-none placeholder:text-[#9AA1A8]"
          style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
        />
        {error && <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="text-xs underline underline-offset-2"
          style={{ color: TEXT_SECONDARY }}
        >
          {mode === "signin" ? "Need a PapeX account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function SaveToPapex({
  sid,
  isSample,
  isIOS,
}: {
  sid?: string;
  isSample: boolean;
  isIOS: boolean;
}) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [outcome, setOutcome] = useState<ClaimOutcome | null>(null);

  // Track sign-in state lazily — only Android/other visitors ever open the
  // sheet, but this is cheap and lets an already-signed-in visitor skip
  // straight to a one-tap "Save as <email>" confirmation.
  useEffect(() => {
    if (isSample || isIOS) return;
    const auth = getPapexV2Auth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
    return unsub;
  }, [isSample, isIOS]);

  if (isSample) {
    return (
      <div className="flex w-full flex-col items-center gap-1.5">
        <div className="w-full opacity-50">
          <PrimaryButton disabled>Save to PapeX</PrimaryButton>
        </div>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>
          Nothing to save — this is a sample receipt.
        </p>
      </div>
    );
  }

  if (isIOS) {
    const href = sid ? `https://links.papex.app/rdh?sid=${sid}` : APP_STORE_FALLBACK;
    return (
      <a
        href={href}
        className="w-full rounded-full px-6 py-3 text-center text-sm font-medium text-white transition active:scale-[0.98]"
        style={{ background: ORANGE }}
      >
        Save to PapeX
      </a>
    );
  }

  if (!sid) return null;

  async function handleClaim(user: User) {
    setClaiming(true);
    setOutcome(null);
    try {
      const idToken = await user.getIdToken();
      const result = await claimReceipt(sid!, idToken);
      setOutcome(result);
      if (result.kind === "error" && result.reauth) {
        await signOut(getPapexV2Auth());
        setAuthUser(null);
      }
    } finally {
      setClaiming(false);
    }
  }

  if (outcome) {
    return (
      <div
        className="w-full rounded-2xl border px-4 py-3 text-center text-sm"
        style={{
          borderColor: outcome.kind === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
          background: outcome.kind === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          color: outcome.kind === "success" ? "#6EE7B7" : "#FCA5A5",
        }}
      >
        {outcome.message}
      </div>
    );
  }

  if (sheetOpen && !authReady) {
    // Avoid a flash of the sign-in form for a visitor who's already signed
    // in from a previous visit — onAuthStateChanged resolves quickly, but
    // asynchronously.
    return (
      <div className="w-full opacity-50">
        <PrimaryButton disabled>Loading…</PrimaryButton>
      </div>
    );
  }

  if (sheetOpen && !authUser) {
    return (
      <SignInSheet
        onAuthed={(user) => {
          setAuthUser(user);
          void handleClaim(user);
        }}
        onClose={() => setSheetOpen(false)}
      />
    );
  }

  if (sheetOpen && authUser) {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <PrimaryButton onClick={() => void handleClaim(authUser)} disabled={claiming}>
          {claiming ? "Saving…" : `Save as ${authUser.email ?? "your account"}`}
        </PrimaryButton>
        <button
          type="button"
          onClick={async () => {
            await signOut(getPapexV2Auth());
            setAuthUser(null);
          }}
          className="text-xs underline underline-offset-2"
          style={{ color: TEXT_MUTED }}
        >
          Not you? Sign in with a different account
        </button>
      </div>
    );
  }

  return (
    <PrimaryButton onClick={() => setSheetOpen(true)}>
      Save to PapeX
    </PrimaryButton>
  );
}
