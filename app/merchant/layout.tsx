"use client";

// app/merchant/layout.tsx
//
// Root layout for merchant.papex.app (reached at /merchant/* server-side,
// after middleware.ts's host rewrite — see lib/merchantHost.ts). Owns:
//   - the Firebase auth provider for the whole route tree
//   - the auth *gate*: signed-out visitors get bounced to /merchant/login
//   - the nav chrome (Transactions / Insights / Devices, merchant identity, sign out)
//
// /merchant/login is a child route of this same layout (Next.js App Router
// has no way to opt a route out of an ancestor layout without a route
// group), so this component special-cases that one pathname: render it
// bare, with no gate and no nav — a signed-out visitor has to be able to
// reach the login page in the first place.

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Receipt, BarChart3, Sparkles, Radio } from "lucide-react";
import { MerchantAuthProvider, useMerchantAuth } from "./AuthContext";
import { LoadingBlock } from "./ui/primitives";
import { T } from "./ui/tokens";

const LOGIN_PATH = "/merchant/login";

const NAV_ITEMS = [
  { href: "/merchant", label: "Transactions", icon: Receipt, exact: true },
  { href: "/merchant/insights", label: "Insights", icon: BarChart3, exact: false },
  { href: "/merchant/intelligence", label: "Intelligence", icon: Sparkles, exact: false },
  { href: "/merchant/devices", label: "Devices", icon: Radio, exact: false },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
            style={{
              color: active ? T.text : T.textSecondary,
              background: active ? T.orangeDim : "transparent",
            }}
          >
            <Icon className="h-4 w-4" strokeWidth={2} style={{ color: active ? T.orange : T.textMuted }} />
            {label}
          </Link>
        );
      })}
    </>
  );
}

function AuthedShell({ children, pathname }: { children: ReactNode; pathname: string }) {
  const { user, signOut } = useMerchantAuth();
  // Registry-backed merchant display name is a real-backend concern (M2) —
  // for now, whatever Firebase Auth has on the admin-provisioned account.
  const merchantLabel = user?.displayName || user?.email || "Merchant";
  const initial = merchantLabel.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r px-4 py-6 md:flex"
        style={{ borderColor: T.glassBorder, background: "rgba(12,15,20,0.6)" }}
      >
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="font-barlow text-lg font-medium tracking-tight" style={{ color: T.text }}>
            papex
          </span>
          <span className="h-[7px] w-[7px] rounded-sm" style={{ background: T.orange }} aria-hidden />
          <span className="ml-1 text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            Merchant
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t pt-4" style={{ borderColor: T.glassBorder }}>
          <div className="flex items-center gap-2.5 px-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
              style={{ background: T.orangeDim, color: T.orange }}
            >
              {initial}
            </div>
            <span className="min-w-0 truncate text-sm" style={{ color: T.textSecondary }}>
              {merchantLabel}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/5"
            style={{ color: T.textSecondary }}
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b px-4 py-3 md:hidden"
        style={{ borderColor: T.glassBorder, background: "rgba(12,15,20,0.85)" }}
      >
        <div className="flex items-center gap-2">
          <span className="font-barlow text-lg font-medium" style={{ color: T.text }}>
            papex
          </span>
          <span className="h-[6px] w-[6px] rounded-sm" style={{ background: T.orange }} aria-hidden />
        </div>
        <button onClick={() => signOut()} style={{ color: T.textSecondary }} aria-label="Sign out">
          <LogOut className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      <main className="flex-1 px-4 pb-24 pt-20 md:ml-60 md:px-8 md:pb-10 md:pt-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t px-2 py-2 md:hidden"
        style={{ borderColor: T.glassBorder, background: "rgba(12,15,20,0.9)" }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium"
              style={{ color: active ? T.orange : T.textMuted }}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Gate({ children, pathname }: { children: ReactNode; pathname: string }) {
  const { user, loading } = useMerchantAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [loading, user, router]);

  if (loading) return <LoadingBlock label="Signing you in…" />;
  if (!user) return <LoadingBlock label="Redirecting to sign in…" />;

  return <AuthedShell pathname={pathname}>{children}</AuthedShell>;
}

export default function MerchantLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === LOGIN_PATH;

  return (
    <div className="min-h-screen w-full" style={{ background: T.pageBg, color: T.text }}>
      <MerchantAuthProvider>
        {isLoginRoute ? children : <Gate pathname={pathname}>{children}</Gate>}
      </MerchantAuthProvider>
    </div>
  );
}
