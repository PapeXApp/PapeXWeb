// app/merchant/ui/primitives.tsx
//
// Small shared UI primitives for the merchant dashboard, styled to match
// app/r/ui.tsx's dark glass aesthetic (see ./tokens.ts). Kept deliberately
// plain (divs + Tailwind arbitrary values, no Radix) — same approach app/r
// took, and this repo's shadcn/ui component set under components/ui/ is
// tuned for the light navy/orange marketing palette, not this one.

import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ImageIcon, ImagePlus, Loader2, X } from "lucide-react";
import { T, glassCardStyle } from "./tokens";
import type { ParseConfidence, DeviceStatus, PaymentNetwork } from "@/lib/merchantApi";
import type { ChangeRequestStatus } from "@/lib/changeRequests/types";
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

// ---- Select --------------------------------------------------------------------

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return (
    <select
      {...rest}
      className={`rounded-xl border bg-transparent px-3 py-2.5 text-sm text-[#F4F4F4] outline-none transition focus:border-[#FB8500]/60 ${className}`}
      style={{ borderColor: T.glassBorder, background: "rgba(255,255,255,0.03)", colorScheme: "dark" }}
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

/**
 * Shown for parseStatus === "ok_raster": the receipt was captured fine, but it
 * arrived as a bitmap (Blaze POS renders receipts to an image instead of
 * sending text), so there is no extracted text to show yet.
 *
 * Deliberately NOT ParseFailedPill (nothing failed — red would tell a pilot
 * merchant their brand-new device is broken) and NOT ConfidencePill (there is
 * no parse to be confident about; "Low confidence" implies we read the
 * receipt badly rather than not at all). Neutral styling, because this is an
 * expected steady state until OCR lands, not a problem to act on.
 */
export function ImageOnlyPill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
      style={{ background: "rgba(148, 163, 184, 0.16)", color: T.textSecondary }}
      title="Captured as an image — text extraction is not available for this receipt yet"
    >
      <ImageIcon className="h-3 w-3" strokeWidth={2.25} />
      Image
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
  // `method` is typed as PaymentNetwork, but it arrives as free JSON from the
  // merchant API — whose own detectPaymentNetwork() is a hand-kept copy of
  // detectPaymentMethod(). If that copy learns a network before this build
  // does (it did for "debit"), the lookup misses and `style.bg` would throw,
  // taking the whole transactions table down over one unknown chip. Degrade
  // to a neutral chip showing the raw value instead.
  const style = PAYMENT_METHOD_STYLES[method] ?? {
    bg: "#334155",
    label: String(method).replace(/_/g, " "),
    textColor: "#FFFFFF",
  };
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

// ---- Filter pill -----------------------------------------------------------------
//
// One active server-side filter, with its own clear affordance (real
// <button>, not a click handler on the pill itself, so it's keyboard/screen
// reader reachable independent of whatever the pill is nested in).

export function FilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs font-medium"
      style={{ background: T.orangeDim, color: T.text }}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear filter: ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
        style={{ color: T.textSecondary, outlineColor: T.orange }}
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
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

// =============================================================================
// Additions for the Profile + Admin pages (2026-09-11). Everything below is
// new; nothing above changed behavior. Same plain-div approach as the rest of
// this file. Hover fills are Tailwind classes (not inline backgrounds) so
// they stay inside each element's own rounded shape.
// =============================================================================

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141A24]";

// ---- Textarea ------------------------------------------------------------------

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`min-h-[96px] resize-y rounded-xl border bg-transparent px-3.5 py-2.5 text-sm leading-relaxed text-[#F4F4F4] placeholder:text-[#6B7280] outline-none transition focus:border-[#FB8500]/60 ${className}`}
      style={{ borderColor: T.glassBorder, background: "rgba(255,255,255,0.03)" }}
    />
  );
}

// ---- Chip (toggle) ---------------------------------------------------------------

export function Chip({
  selected,
  onClick,
  children,
  disabled,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING} ${
        selected
          ? "border-[#FB8500]/60 bg-[#FB8500]/[0.16] text-[#F4F4F4] hover:bg-[#FB8500]/[0.24]"
          : "border-white/[0.12] bg-transparent text-[#C4C7CC] hover:bg-white/[0.06] hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ---- StatusPill (change requests) ------------------------------------------------

const REQUEST_STATUS_STYLE: Record<ChangeRequestStatus, { label: string; color: string; bg: string }> = {
  received: { label: "Received", color: "#5AB0F0", bg: "rgba(0, 136, 234, 0.16)" },
  in_progress: { label: "In progress", color: T.warning, bg: "rgba(245, 165, 36, 0.14)" },
  done: { label: "Done", color: T.success, bg: "rgba(16, 185, 129, 0.14)" },
  declined: { label: "Declined", color: T.textMuted, bg: "rgba(148, 163, 184, 0.16)" },
};

export const REQUEST_STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

export function StatusPill({ status }: { status: ChangeRequestStatus }) {
  const s = REQUEST_STATUS_STYLE[status] ?? REQUEST_STATUS_STYLE.received;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} aria-hidden />
      {s.label}
    </span>
  );
}

// ---- Tabs ------------------------------------------------------------------------

export function Tabs<Id extends string>({
  tabs,
  value,
  onChange,
  label,
  className = "",
}: {
  tabs: { id: Id; label: ReactNode; count?: number }[];
  value: Id;
  onChange: (id: Id) => void;
  /** Accessible name for the tab list. */
  label: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  // Which sides have more tabs off-screen (drives the fade mask).
  const measure = useCallback(() => {
    const s = scrollerRef.current;
    if (!s) return;
    const left = s.scrollLeft > 1;
    const right = s.scrollLeft + s.clientWidth < s.scrollWidth - 1;
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
  }, []);

  useEffect(() => {
    measure();
    const s = scrollerRef.current;
    if (!s || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    return () => ro.disconnect();
  }, [measure, tabs.length]);

  // Keep the active tab in view (horizontal only; never scrolls the page).
  const activeIndex = tabs.findIndex((t) => t.id === value);
  useEffect(() => {
    const s = scrollerRef.current;
    const el = refs.current[activeIndex];
    if (!s || !el) return;
    const pad = 32;
    const l = el.offsetLeft;
    const r = l + el.offsetWidth;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (l - pad < s.scrollLeft) s.scrollTo({ left: Math.max(0, l - pad), behavior });
    else if (r + pad > s.scrollLeft + s.clientWidth) s.scrollTo({ left: r + pad - s.clientWidth, behavior });
  }, [activeIndex]);

  const fade = 28;
  const mask = `linear-gradient(to right, ${edges.left ? "transparent" : "#000"} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${
    edges.right ? "transparent" : "#000"
  } 100%)`;

  function onKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next].id);
  }
  return (
    <div
      className={`max-w-full overflow-hidden rounded-full border ${className}`}
      style={{ borderColor: T.glassBorder, background: "rgba(255,255,255,0.03)" }}
    >
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label={label}
        onScroll={measure}
        className="relative flex gap-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
      {tabs.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${FOCUS_RING} ${
              selected ? "bg-[#FB8500]/[0.16] text-[#F4F4F4]" : "text-[#C4C7CC] hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span
                className="rounded-full px-1.5 text-[11px] font-semibold leading-[18px]"
                style={{ background: selected ? T.orange : "rgba(255,255,255,0.1)", color: selected ? "#fff" : T.textSecondary }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}

// ---- ColorField ------------------------------------------------------------------

const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** A swatch that opens the native picker, plus a typed hex field. Emits "#RRGGBB" uppercase. */
export function ColorField({
  label,
  value,
  onChange,
  onClear,
  fallback = "#FB8500",
}: {
  label: string;
  /** Current hex; empty/invalid shows `fallback` in the swatch and an empty field. */
  value: string | undefined;
  onChange: (hex: string) => void;
  onClear?: () => void;
  fallback?: string;
}) {
  const id = useId();
  const valid = value && HEX6.test(value) ? value.toUpperCase() : "";
  const [draft, setDraft] = useState(valid);
  useEffect(() => setDraft(valid), [valid]);

  function commitText(text: string) {
    const t = text.trim();
    const withHash = t.startsWith("#") ? t : `#${t}`;
    if (HEX6.test(withHash)) onChange(withHash.toUpperCase());
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-hex`} className="text-xs font-medium" style={{ color: T.textMuted }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border transition focus-within:ring-2 focus-within:ring-[#FB8500]/70 hover:brightness-110"
          style={{ borderColor: T.glassBorder, background: valid || fallback }}
        >
          <input
            type="color"
            aria-label={`${label}: pick a color`}
            value={(valid || fallback).toLowerCase()}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <Input
          id={`${id}-hex`}
          value={draft}
          placeholder="#RRGGBB"
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => {
            setDraft(e.target.value);
            commitText(e.target.value);
          }}
          onBlur={() => setDraft(valid)}
          className="w-[7.5rem] font-mono uppercase"
        />
        {onClear && valid && (
          <button
            type="button"
            onClick={onClear}
            className={`rounded-lg px-2 py-1 text-xs font-medium underline underline-offset-2 transition hover:bg-white/[0.06] ${FOCUS_RING}`}
            style={{ color: T.textSecondary }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ---- FileDrop --------------------------------------------------------------------

export function FileDrop({
  onFiles,
  accept,
  multiple = true,
  disabled,
  title = "Drop pictures here or browse",
  hint,
  compact,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  title?: string;
  hint?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        if (disabled) return;
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full items-center gap-3 rounded-2xl border border-dashed text-left transition disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING} ${
          compact ? "px-3.5 py-3" : "px-4 py-5"
        } ${over ? "border-[#FB8500] bg-[#FB8500]/[0.08]" : "border-white/[0.18] bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]"}`}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: T.orangeDim, color: T.orange }}
        >
          <ImagePlus className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium" style={{ color: T.text }}>
            {over ? "Drop to add" : title}
          </span>
          {hint && (
            <span className="text-xs" style={{ color: T.textMuted }}>
              {hint}
            </span>
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}

// ---- Focus trap (shared by Sheet and any other modal surface) ---------------------

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Only the most recently opened trap handles Tab / Escape. */
const trapStack: symbol[] = [];

/**
 * While `active`: focuses `[data-autofocus]` (else the first focusable, else
 * the container), keeps Tab inside `ref`, calls `onEscape` on Esc, locks page
 * scroll, and on release returns focus to whatever had it before.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape: () => void) {
  const escRef = useRef(onEscape);
  useEffect(() => {
    escRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const token = Symbol("trap");
    trapStack.push(token);
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const root = ref.current;
      if (!root) return;
      const auto = root.querySelector<HTMLElement>("[data-autofocus]");
      const first = auto ?? root.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? root).focus({ preventScroll: true });
    };
    const raf = window.requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (trapStack[trapStack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        escRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const root = ref.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !root.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !root.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey, true);
      const i = trapStack.indexOf(token);
      if (i >= 0) trapStack.splice(i, 1);
      if (trapStack.length === 0) document.body.style.overflow = prevOverflow;
      if (previous && typeof previous.focus === "function") previous.focus({ preventScroll: true });
    };
  }, [active, ref]);
}

/** Mount/unmount with a short exit so panels can slide out instead of vanishing. */
function usePresence(open: boolean, exitMs = 220) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = window.requestAnimationFrame(() => window.requestAnimationFrame(() => setShown(true)));
      return () => window.cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(t);
  }, [open, exitMs]);
  return { mounted, shown };
}

// ---- Sheet (side panel on desktop, bottom sheet on mobile) ------------------------

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { mounted, shown } = usePresence(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(panelRef, open && mounted, onClose);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[24px] border shadow-[0_-12px_48px_rgba(0,0,0,0.5)] outline-none transition-transform duration-200 ease-out motion-reduce:transition-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[500px] md:rounded-l-[24px] md:rounded-tr-none ${
          shown ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"
        }`}
        style={{ background: T.glassBgSolid, borderColor: T.glassBorder, color: T.text }}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full md:hidden" style={{ background: "rgba(255,255,255,0.18)" }} aria-hidden />
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 pb-3.5 pt-3 md:pt-5" style={{ borderColor: T.divider }}>
          <div className="min-w-0">
            <h2 id={titleId} className="font-barlow text-lg font-medium leading-tight" style={{ color: T.text }}>
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm" style={{ color: T.textSecondary }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/[0.08] active:scale-95 ${FOCUS_RING}`}
            style={{ color: T.textSecondary }}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && (
          <div
            className="shrink-0 border-t px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]"
            style={{ borderColor: T.divider }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
