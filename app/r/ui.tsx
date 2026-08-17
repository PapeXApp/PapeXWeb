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
import { AlertTriangle, Clock, FlaskConical, SearchX } from "lucide-react";
import type { DecodedLogo, ReceiptLine } from "@/lib/escpos";
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

// ---- Demo (sample) banner -----------------------------------------------------
//
// Pinned, not inline. The previous banner sat at the top of the normal flow
// and scrolled away after ~one swipe, so a screenshot of the middle of the
// page showed fabricated line items with nothing marking them as fake. This
// one sticks to the top of the viewport for the life of the page.
//
// `sticky` (not `fixed`) so it still participates in the flex column's
// spacing; none of its ancestors in <Shell> set overflow/transform/filter,
// which is what would otherwise break stickiness.

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-30 -mx-1 pb-1 pt-1">
      <div
        className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{
          background: "rgba(120, 60, 0, 0.85)",
          borderColor: "rgba(251, 133, 0, 0.55)",
          color: "#FFD9A8",
        }}
      >
        <FlaskConical className="h-4 w-4 shrink-0" style={{ color: T.orange }} strokeWidth={2} />
        <span>
          <strong className="font-semibold" style={{ color: "#FFF0DC" }}>
            Sample receipt.
          </strong>{" "}
          Made-up data, not a real purchase.
        </span>
      </div>
    </div>
  );
}

// ---- Sample frame: watermark + dashed border + persistent chip ---------------
//
// The banner alone isn't enough — the receipt *body* has to carry the mark,
// so that a crop or screenshot of any part of it is still self-evidently
// fake. Three redundant signals: a repeating diagonal SAMPLE watermark laid
// over the cards, a dashed orange border around the whole block, and a chip
// riding the top edge.
//
// The watermark is an inline SVG data URI rather than a repeated DOM node so
// it tiles at any content height with one element and zero layout cost.
// Single quotes inside the SVG survive encodeURIComponent untouched, which
// keeps the CSS `url("…")` wrapper valid.

const SAMPLE_WATERMARK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='150' viewBox='0 0 240 150'>
  <g font-family='Barlow, Helvetica, Arial, sans-serif' font-size='26' font-weight='700' letter-spacing='7' fill='rgba(251,133,0,0.16)'>
    <text x='4' y='58' transform='rotate(-24 4 58)'>SAMPLE</text>
    <text x='124' y='133' transform='rotate(-24 124 133)'>SAMPLE</text>
  </g>
</svg>`;

const SAMPLE_WATERMARK_URL = `url("data:image/svg+xml,${encodeURIComponent(SAMPLE_WATERMARK_SVG)}")`;

export function SampleFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative rounded-[28px] border-2 border-dashed p-3 pt-6"
      style={{
        borderColor: "rgba(251, 133, 0, 0.55)",
        background: "rgba(251, 133, 0, 0.04)",
      }}
    >
      <span
        className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full border px-3 py-[3px] text-[10px] font-bold uppercase tracking-[1.5px]"
        style={{
          background: "#1B1408",
          borderColor: "rgba(251, 133, 0, 0.6)",
          color: "#FFB74D",
        }}
      >
        Sample
      </span>
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          backgroundImage: SAMPLE_WATERMARK_URL,
          backgroundRepeat: "repeat",
          backgroundSize: "240px 150px",
        }}
      />
    </div>
  );
}

// ---- Receipt not available ----------------------------------------------------
//
// The heart of the fix. Reached when a sid *was* supplied but there is no
// receipt behind it (backend 404, empty/unparseable payload, malformed sid).
// This screen must never contain sample content of any kind — the person
// looking at it tapped a real device and is trying to find a real purchase.

export function ReceiptNotAvailable({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border"
        style={glassCardStyle}
      >
        <SearchX className="h-6 w-6" style={{ color: T.textMuted }} strokeWidth={1.75} />
      </div>
      <h1 className="font-barlow text-xl font-semibold" style={{ color: T.text }}>
        Receipt not available
      </h1>
      <p className="mt-2 max-w-[19rem] text-sm" style={{ color: T.textSecondary }}>
        We couldn&apos;t find a receipt for this link. The link may have been
        mistyped or cut short when it was shared, or this receipt isn&apos;t in
        our system.
      </p>
      <p className="mt-3 max-w-[19rem] text-sm" style={{ color: T.textMuted }}>
        If you just tapped the device, give it a moment and try again.
      </p>
      {children}
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
      <h1 className="font-barlow text-xl font-semibold" style={{ color: T.text }}>
        {title}
      </h1>
      <p className="mt-2 max-w-xs text-sm" style={{ color: T.textSecondary }}>
        {message}
      </p>
      {children}
    </div>
  );
}

// ---- Logo (decoded ESC/POS raster, see lib/escpos.ts) --------------------------
//
// Rendered above everything else, centered, scaled to the card width. The
// decoded bitmap is a 2-color PNG (transparent background, near-white
// foreground — see lib/escpos.ts's LOGO_FOREGROUND, which mirrors T.text
// here) so it reads as a deliberate light logo mark on the dark glass card
// rather than an inverted/broken image. `image-rendering: pixelated` keeps
// the 1-bit source crisp instead of letting the browser smear it with
// bilinear scaling. A plain `<img>` (not next/image) — this is a `data:`
// URI, so there's no network fetch to optimize away either way, and
// next/image's remote-loader machinery doesn't apply to embedded data.

function LogoBlock({ logo }: { logo: DecodedLogo }) {
  return (
    <div className="flex justify-center">
      <div
        className="flex max-w-[240px] items-center justify-center rounded-[20px] border px-6 py-5"
        style={glassCardStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.dataUri}
          alt="Merchant logo"
          width={logo.widthPx}
          height={logo.heightPx}
          className="h-auto w-full max-h-[120px]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

// ---- Merchant header card ------------------------------------------------------

function monogram(name?: string): string {
  if (!name) return "P";
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "P";
}

export function MerchantHeaderCard({
  summary,
  isSample = false,
}: {
  summary: ReceiptSummary;
  isSample?: boolean;
}) {
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
          <h1 className="font-barlow truncate text-2xl font-medium" style={{ color: T.text }}>
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
          <p className="mt-1 text-xs" style={{ color: isSample ? "#FFB74D" : T.textMuted }}>
            {isSample ? "Sample data — not a real purchase" : "📟 RDH Receipt"}
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
      <p className="mb-2 px-1 text-sm font-medium uppercase tracking-wide" style={{ color: T.textSecondary }}>
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

export function TotalsCard({
  summary,
  isSample = false,
}: {
  summary: ReceiptSummary;
  isSample?: boolean;
}) {
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
      <p className="mb-2 px-1 text-sm font-medium uppercase tracking-wide" style={{ color: T.textSecondary }}>
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
              {isSample ? (
                // Never render a card-network chip + last-four for fabricated
                // data: "VISA •••• 4729" reads as a genuine transaction record
                // even in isolation. The sample's own payment line is still
                // visible verbatim inside the (marked) Original receipt body.
                <span
                  className="rounded-full border px-3 py-[3px] text-[11px] font-semibold uppercase tracking-[0.5px]"
                  style={{
                    borderColor: "rgba(251, 133, 0, 0.5)",
                    color: "#FFB74D",
                  }}
                >
                  Demo card
                </span>
              ) : (
                <PaymentRow paymentLine={summary.paymentLine} />
              )}
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

export function ReceiptView({
  summary,
  hasStructure,
  isSample = false,
  logo,
}: {
  summary: ReceiptSummary;
  hasStructure: boolean;
  isSample?: boolean;
  /** Decoded merchant logo, if any — see lib/escpos.ts. Never set on the sample/demo path. */
  logo?: DecodedLogo;
}) {
  return (
    <div className="flex flex-col gap-4">
      {logo && <LogoBlock logo={logo} />}
      {hasStructure && <MerchantHeaderCard summary={summary} isSample={isSample} />}
      {hasStructure && <ItemsCard summary={summary} />}
      {hasStructure && <TotalsCard summary={summary} isSample={isSample} />}
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
