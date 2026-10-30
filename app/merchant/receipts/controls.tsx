"use client";

// app/merchant/receipts/controls.tsx
//
// Small form pieces the Receipts tab shares: a labelled field that shows the
// lint's plain-language message under itself, and a switch.

import type { ReactNode } from "react";
import { T } from "../ui/tokens";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium" style={{ color: T.textSecondary }}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>
          {hint}
        </p>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-xs leading-relaxed" style={{ color: "#FCA5A5" }}>
      {children}
    </p>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: checked ? T.orange : "rgba(255,255,255,0.16)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: checked ? 22 : 2 }}
        aria-hidden
      />
    </button>
  );
}
