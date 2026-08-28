"use client";

// app/merchant/login/page.tsx
//
// Email/password sign-in for admin-provisioned merchant accounts (PRD §5.1
// — no self-signup in pilot). Renders bare (no dashboard chrome) — see
// layout.tsx's isLoginRoute special-case.

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { signIn, describeAuthError, sendPasswordResetEmail } from "@/lib/firebaseMerchantAuth";
import { useMerchantAuth } from "../AuthContext";
import { Button, Input, ErrorBanner } from "../ui/primitives";
import { T, glassCardStyle } from "../ui/tokens";

type ViewState = "sign-in" | "reset-sent";

export default function MerchantLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useMerchantAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("sign-in");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Already signed in (e.g. back-navigated here) -> straight to the dashboard.
  useEffect(() => {
    if (!authLoading && user) router.replace("/merchant");
  }, [authLoading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/merchant");
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setError("Enter your email above first, then request a reset link.");
      return;
    }
    setError(null);
    setResetSubmitting(true);
    try {
      await sendPasswordResetEmail(email.trim());
      setView("reset-sent");
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setResetSubmitting(false);
    }
  }

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-4"
      style={{
        backgroundColor: T.pageBg,
        backgroundImage: [
          "radial-gradient(ellipse 120% 60% at 50% -10%, rgba(251,133,0,0.14) 0%, rgba(251,133,0,0) 60%)",
          "linear-gradient(180deg, rgba(24,26,32,0.55) 0%, rgba(11,43,59,0.75) 100%)",
        ].join(", "),
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="font-barlow text-2xl font-medium tracking-tight" style={{ color: T.text }}>
            papex
          </span>
          <span className="h-[8px] w-[8px] rounded-sm" style={{ background: T.orange }} aria-hidden />
        </div>

        <div className="rounded-[24px] border p-7 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl" style={glassCardStyle}>
          {view === "reset-sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <h1 className="font-barlow text-xl font-medium" style={{ color: T.text }}>
                Check your inbox
              </h1>
              <p className="text-sm" style={{ color: T.textSecondary }}>
                We sent a password reset link to <strong style={{ color: T.text }}>{email}</strong>.
              </p>
              <button
                onClick={() => setView("sign-in")}
                className="mt-2 text-sm font-medium underline underline-offset-2"
                style={{ color: T.orange }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-barlow mb-1 text-xl font-medium" style={{ color: T.text }}>
                Merchant dashboard
              </h1>
              <p className="mb-6 text-sm" style={{ color: T.textSecondary }}>
                Sign in with the account PapeX set up for your business.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
                    Email
                  </span>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: T.textMuted }}
                    />
                    <Input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9"
                      placeholder="you@yourbusiness.com"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
                    Password
                  </span>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: T.textMuted }}
                    />
                    <Input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9"
                      placeholder="••••••••"
                    />
                  </div>
                </label>

                {error && <ErrorBanner message={error} />}

                <Button type="submit" disabled={submitting} className="mt-1.5 w-full">
                  {submitting ? "Signing in…" : "Sign in"}
                  {!submitting && <ArrowRight className="h-4 w-4" strokeWidth={2.25} />}
                </Button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetSubmitting}
                  className="mt-1 text-center text-sm font-medium underline underline-offset-2 disabled:opacity-50"
                  style={{ color: T.textSecondary }}
                >
                  {resetSubmitting ? "Sending…" : "Forgot your password?"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: T.textMuted }}>
          Don&apos;t have an account? PapeX provisions merchant logins directly — contact your onboarding
          contact.
        </p>
      </div>
    </main>
  );
}
