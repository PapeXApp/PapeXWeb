// app/merchant/ui/primitives.tsx
//
// Small shared UI primitives for the merchant dashboard, styled to match
// app/r/ui.tsx's dark glass aesthetic (see ./tokens.ts). Kept deliberately
// plain (divs + Tailwind arbitrary values, no Radix) — same approach app/r
// took, and this repo's shadcn/ui component set under components/ui/ is
// tuned for the light navy/orange marketing palette, not this one.

import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { T, glassCardStyle } from "./tokens";
import type { ParseConfidence, DeviceStatus, PaymentNetwork } from "@/lib/merchantApi";
import { PAYMENT_METHOD_STYLES } from "@/lib/receiptSummary";

// ---- Card --------------------------------------------------------------------

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] border p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`}
      style={glassCardStyle}
    >
      {children}
    </div>
  );
}

// ---- Button --------------------------------------------------------------------

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "outline";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "text-white",
    ghost: "text-[#C4C7CC] hover:text-white hover:bg-white/5",
    outline: "border text-[#F4F4F4] hover:bg-white/5",
  };
  const style =
    variant === "primary"
      ? { background: T.orange }
      : variant === "outline"
        ? { borderColor: T.glassBorder }
        : undefined;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

// ---- Input --------------------------------------------------------------------

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`rounded-xl border bg-transparent px-3.5 py-2.5 text-sm text-[#F4F4F4] placeholder:text-[#6B7280] outline-none transition focus:border-[#FB8500]/60 ${className}`}
      style={{ borderColor: T.glassBorder, background: "rgba(255,255,255,0.03)" }}
    />
  );
}

// ---- Confidence + status pills -------------------------------------------------

export function ConfidencePill({ confidence }: { confidence: ParseConfidence }) {
  if (confidence === "high") return null; // only surface the exception, not every row
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
      style={{ background: "rgba(245, 165, 36, 0.14)", color: T.warning }}
      title="Parsed with low confidence — figures are approximate"
    >
      <AlertTriangle className="h-3 w-3" strokeWidth={2.25} />
      Low confidence
    </span>
  );
}

export function ParseFailedPill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
      style={{ background: "rgba(239, 68, 68, 0.14)", color: T.error }}
    >
      <AlertTriangle className="h-3 w-3" strokeWidth={2.25} />
      Parse failed
    </span>
  );
}

const DEVICE_STATUS_STYLE: Record<DeviceStatus, { label: string; color: string; bg: string }> = {
  ok: { label: "Online", color: T.success, bg: "rgba(16, 185, 129, 0.14)" },
  stale: { label: "No uploads recently", color: T.warning, bg: "rgba(245, 165, 36, 0.14)" },
  never: { label: "Never uploaded", color: T.error, bg: "rgba(239, 68, 68, 0.14)" },
};

export function DeviceStatusPill({ status }: { status: DeviceStatus }) {
  const s = DEVICE_STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} aria-hidden />
      {s.label}
    </span>
  );
}

export function PaymentChip({ method, last4 }: { method: PaymentNetwork | null; last4: string | null }) {
  if (!method) {
    return <span style={{ color: T.textMuted }}>—</span>;
  }
  const style = PAYMENT_METHOD_STYLES[method];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="rounded px-[6px] py-[2px] text-[10px] font-bold uppercase tracking-[0.4px]"
        style={{ background: style.bg, color: style.textColor }}
      >
        {style.label}
      </span>
      {last4 && <span style={{ color: T.textSecondary }}>••{last4}</span>}
    </span>
  );
}

// ---- Stat tile -------------------------------------------------------------------

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
        {label}
      </span>
      <span className="font-barlow text-[28px] font-medium leading-none" style={{ color: T.text }}>
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: T.textSecondary }}>
          {sub}
        </span>
      )}
    </Card>
  );
}

// ---- Loading / empty states -------------------------------------------------------

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} style={{ color: T.orange }} />;
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
      <Spinner className="h-6 w-6" />
      <span className="text-sm" style={{ color: T.textMuted }}>
        {label}
      </span>
    </div>
  );
}

export function EmptyState({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border py-20 text-center" style={glassCardStyle}>
      <h3 className="font-barlow text-lg font-medium" style={{ color: T.text }}>
        {title}
      </h3>
      <p className="max-w-sm text-sm" style={{ color: T.textSecondary }}>
        {message}
      </p>
      {children}
    </div>
  );
}

export function ApproximateCaveat() {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm"
      style={{ background: "rgba(245, 165, 36, 0.1)", borderColor: "rgba(245, 165, 36, 0.3)", color: "#FDD9A0" }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: T.warning }} strokeWidth={2} />
      <span>Approximate — parsed from the receipt automatically. Figures below may be slightly off.</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm"
      style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#FCA5A5" }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}
