// app/r/ui.tsx
//
// Presentational pieces for the RDH receipt web viewer, restyled to match
// the PapeX iOS app's receipt-detail screen (dark "liquid glass") per
// docs/goals/rdh-receipt-ux-clip-web/design-spec.md. Tokens are inlined as
// Tailwind arbitrary values / style props rather than added to
// tailwind.config.ts, deliberately — this repo's `orange`/`navy` Tailwind
// classes are CSS-var-backed and belong to the marketing site's palette
// (see tailwind.config.ts), which is a different (lighter, more saturated)
// orange than the app's #FB8500. Reusing those classes here would silently
// pull in the wrong color if the marketing palette ever changes. Source of
// truth for these values: PapeXV2/theme/tokens.ts.
//
// All server components except where noted — SaveToPapex.tsx and
// RetryButton.tsx are their own "use client" islands, imported here.

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import type { ReceiptLine } from "@/lib/escpos";
import {
  type ReceiptSummary,
  detectPaymentMethod,
  extractLastFour,
  PAYMENT_METHOD_STYLES,
} from "@/lib/receiptSummary";
import SaveToPapex from "./SaveToPapex";

const APP_STORE_URL = "https://apps.apple.com/us/app/papex/id6754945242";

// ---- Tokens (PapeXV2/theme/tokens.ts) --------------------------------------

const T = {
  orange: "#FB8500",
  blue: "#2B7FC6",
  text: "#F4F4F4",
  textSecondary: "#C4C7CC",
  textMuted: "#9AA1A8",
  success: "#10B981",
  error: "#EF4444",
  glassBg: "rgba(20, 26, 36, 0.6)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  divider: "rgba(255, 255, 255, 0.12)",
};

const glassCardStyle = {
  background: T.glassBg,
  borderColor: T.glassBorder,
};

// ---- Shell ------------------------------------------------------------------

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen w-full text-[#F4F4F4]"
      style={{
        // Layered: the photographic gradient asset first, then a tint so
        // text stays legible over any part of the image, matching the app's
        // dark navy/charcoal background with a faint orange glow.
        backgroundColor: "#181A20",
        backgroundImage: [
          "radial-gradient(ellipse 120% 60% at 50% -10%, rgba(251,133,0,0.16) 0%, rgba(251,133,0,0) 60%)",
          "linear-gradient(180deg, rgba(24,26,32,0.55) 0%, rgba(11,43,59,0.75) 100%)",
          "url('/rdh-background.jpg')",
        ].join(", "),
        backgroundSize: "cover, cover, cover",
        backgroundPosition: "center, center, center",
        backgroundAttachment: "fixed, fixed, fixed",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center gap-2 px-1">
          <span className="font-barlow text-lg font-medium tracking-tight text-[#F4F4F4]">
            papex
          </span>
          <span className="h-[7px] w-[7px] rounded-sm bg-[#FB8500]" aria-hidden />
          <span className="ml-auto text-xs font-medium uppercase tracking-wide text-[#9AA1A8]">
            Receipt
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </div>
    </main>
  );
}

// ---- Glass card primitive -----------------------------------------------------

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[24px] border p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`}
      style={glassCardStyle}
    >
      {children}
    </div>
  );
}

// ---- Sample / unavailable banner --------------------------------------------

export function SampleBanner({ variant }: { variant: "sample" | "unavailable" }) {
  const message =
    variant === "sample"
      ? "Sample receipt — here's what a real tap looks like."
      : "This receipt isn't available anymore. Showing a sample instead.";
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm"
      style={{
        background: "rgba(251, 133, 0, 0.12)",
        borderColor: "rgba(251, 133, 0, 0.35)",
        color: "#FFD9A8",
      }}
    >
      <Sparkles className="h-4 w-4 shrink-0" style={{ color: T.orange }} strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}

// ---- Error / empty states -----------------------------------------------------

export function StateCard({
  icon,
  title,
  message,
  children,
}: {
  icon: "warning" | "clock";
  title: string;
  message: string;
  children?: ReactNode;
}) {
  const Icon = icon === "clock" ? Clock : AlertTriangle;
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border"
        style={glassCardStyle}
      >
        <Icon className="h-6 w-6" style={{ color: T.textMuted }} strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-semibold" style={{ color: T.text }}>
        {title}
      </h1>
      <p className="mt-2 max-w-xs text-sm" style={{ color: T.textSecondary }}>
        {message}
      </p>
      {children}
    </div>
  );
}

// ---- Merchant header card ------------------------------------------------------

function monogram(name?: string): string {
  if (!name) return "P";
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "P";
}

export function MerchantHeaderCard({ summary }: { summary: ReceiptSummary }) {
  const { merchantName, addressLines, dateline } = summary;
  return (
    <GlassCard>
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white"
          style={{ border: `2px solid ${T.orange}` }}
        >
          <span className="text-xl font-medium" style={{ color: "#181A20" }}>
            {monogram(merchantName)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-medium" style={{ color: T.text }}>
            {merchantName ?? "Your receipt"}
          </h1>
          {addressLines.length > 0 && (
            <p className="mt-0.5 truncate text-sm" style={{ color: T.textMuted }}>
              {addressLines.join(", ")}
            </p>
          )}
          {dateline && (
            <p className="mt-1 text-sm font-medium" style={{ color: T.orange }}>
              {dateline}
            </p>
          )}
          <p className="mt-1 text-xs" style={{ color: T.textMuted }}>
            📟 RDH Receipt
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ---- Items card ------------------------------------------------------------------

export function ItemsCard({ summary }: { summary: ReceiptSummary }) {
  if (summary.items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 px-1 text-sm font-medium uppercase tracking-wide" style={{ color: T.blue }}>
        Items Purchased
      </p>
      <GlassCard>
        <div className="flex flex-col">
          {summary.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-2.5"
              style={
                i === summary.items.length - 1
                  ? undefined
                  : { borderBottom: `1px solid ${T.divider}` }
              }
            >
              <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: T.text }}>
                {item.name}
              </span>
              <div className="flex shrink-0 flex-col items-end">
                {item.qty > 1 && (
                  <span className="text-xs" style={{ color: T.textMuted }}>
                    ×{item.qty}
                  </span>
                )}
                <span className="text-[15px] font-medium" style={{ color: T.text }}>
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ---- Payment chip ------------------------------------------------------------------

function PaymentRow({ paymentLine }: { paymentLine: string }) {
  const network = detectPaymentMethod(paymentLine);
  const lastFour = extractLastFour(paymentLine);
  if (!network) {
    return (
      <span className="text-[15px] font-medium" style={{ color: T.text }}>
        {paymentLine}
      </span>
    );
  }
  const style = PAYMENT_METHOD_STYLES[network];
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded px-[7px] py-[3px] text-[11px] font-bold uppercase tracking-[0.5px]"
        style={{ background: style.bg, color: style.textColor }}
      >
        {style.label}
      </span>
      {lastFour && (
        <span className="text-[15px] font-medium" style={{ color: T.text }}>
          •••• {lastFour}
        </span>
      )}
    </div>
  );
}

// ---- Totals card ------------------------------------------------------------------

function TotalRow({
  label,
  value,
  valueColor = T.text,
  labelColor = T.textSecondary,
}: {
  label: ReactNode;
  value: ReactNode;
  valueColor?: string;
  labelColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm" style={{ color: labelColor }}>
        {label}
      </span>
      <span className="text-[15px] font-medium" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

export function TotalsCard({ summary }: { summary: ReceiptSummary }) {
  const computedSubtotal =
    summary.subtotal ?? (summary.items.length > 0 ? summary.items.reduce((s, i) => s + i.amount * i.qty, 0) : undefined);
  const taxRate =
    summary.tax != null && computedSubtotal != null && computedSubtotal > 0
      ? ((summary.tax / computedSubtotal) * 100).toFixed(1)
      : null;

  if (
    computedSubtotal == null &&
    summary.tax == null &&
    summary.tip == null &&
    summary.discount == null &&
    summary.total == null &&
    !summary.paymentLine
  ) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 px-1 text-sm font-medium uppercase tracking-wide" style={{ color: T.blue }}>
        Totals
      </p>
      <GlassCard>
        <div className="flex flex-col">
          {computedSubtotal != null && (
            <TotalRow label="Subtotal" value={`$${computedSubtotal.toFixed(2)}`} valueColor={T.blue} />
          )}
          {summary.tax != null && summary.tax > 0 && (
            <TotalRow label={taxRate ? `Tax (${taxRate}%)` : "Tax"} value={`$${summary.tax.toFixed(2)}`} />
          )}
          {summary.tip != null && summary.tip > 0 && (
            <TotalRow label="Tip" value={`$${summary.tip.toFixed(2)}`} labelColor={T.textMuted} valueColor={T.textMuted} />
          )}
          {summary.discount != null && summary.discount > 0 && (
            <TotalRow label="Discount" value={`-$${summary.discount.toFixed(2)}`} valueColor={T.success} />
          )}
          {summary.total != null && (
            <div
              className="mt-2 flex items-center justify-between pt-2"
              style={{ borderTop: `2px solid ${T.orange}` }}
            >
              <span className="text-base font-bold" style={{ color: T.orange }}>
                Total
              </span>
              <span className="text-2xl font-medium" style={{ color: T.text }}>
                ${summary.total.toFixed(2)}
              </span>
            </div>
          )}
          {summary.paymentLine && (
            <div className="mt-2 flex items-center justify-between pt-2">
              <span className="text-sm" style={{ color: T.textSecondary }}>
                Payment
              </span>
              <PaymentRow paymentLine={summary.paymentLine} />
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ---- Original receipt (verbatim monospace) ------------------------------------

function styleClasses(style: ReceiptLine["style"]): string {
  const classes: string[] = [];
  if (style.doubleHeight && style.doubleWidth) classes.push("text-lg");
  else if (style.doubleHeight || style.doubleWidth) classes.push("text-base");
  else if (style.fontB) classes.push("text-[11px]");
  else classes.push("text-[13px]");
  if (style.bold) classes.push("font-bold");
  if (style.underline) classes.push("underline underline-offset-2");
  return classes.join(" ");
}

function alignClass(align: ReceiptLine["align"]): string {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}

export function OriginalReceiptCollapsible({
  lines,
  defaultOpen,
}: {
  lines: ReceiptLine[];
  defaultOpen: boolean;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary
        className="flex cursor-pointer list-none items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium"
        style={{ ...glassCardStyle, color: T.textSecondary }}
      >
        <span>Original receipt</span>
        <span className="text-xs transition-transform group-open:rotate-180" style={{ color: T.textMuted }}>
          ▾
        </span>
      </summary>
      <div
        className="mt-2 overflow-x-auto rounded-2xl border p-4"
        style={glassCardStyle}
      >
        <div className="font-mono leading-relaxed" style={{ color: T.textSecondary }}>
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre ${alignClass(line.align)} ${styleClasses(line.style)}`}>
              {line.text.length === 0 ? " " : line.text}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

// ---- Full receipt view (structured cards + raw fallback) -----------------------

export function ReceiptView({ summary, hasStructure }: { summary: ReceiptSummary; hasStructure: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {hasStructure && <MerchantHeaderCard summary={summary} />}
      {hasStructure && <ItemsCard summary={summary} />}
      {hasStructure && <TotalsCard summary={summary} />}
      <OriginalReceiptCollapsible lines={summary.bodyLines} defaultOpen={!hasStructure} />
    </div>
  );
}

// ---- CTA row: Save to PapeX + install links ------------------------------------

export function AppCta({ isAndroid }: { isAndroid: boolean }) {
  if (isAndroid) {
    return (
      <p className="text-center text-xs" style={{ color: T.textMuted }}>
        PapeX for Android isn&apos;t available yet.{" "}
        <Link href="/waitlist" className="font-medium underline underline-offset-2" style={{ color: T.orange }}>
          Join the waitlist
        </Link>{" "}
        to hear when it lands.
      </p>
    );
  }
  return (
    <p className="text-center text-xs" style={{ color: T.textMuted }}>
      <Link href={APP_STORE_URL} className="font-medium underline underline-offset-2" style={{ color: T.orange }}>
        Get the PapeX app
      </Link>{" "}
      to save every receipt automatically.
    </p>
  );
}

export function CtaRow({
  sid,
  isSample,
  isIOS,
  isAndroid,
}: {
  sid?: string;
  isSample: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col items-center gap-4">
      <SaveToPapex sid={sid} isSample={isSample} isIOS={isIOS} />
      <AppCta isAndroid={isAndroid} />
    </div>
  );
}
