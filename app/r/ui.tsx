// app/r/ui.tsx
//
// Presentational pieces for the RDH receipt web viewer, restyled to match
// the PapeX iOS app's shipping "liquid glass" receipt-detail screen per
// docs/PAPEX_DESIGN_KIT_FOR_WEB.md (extracted from the release branch,
// release/testflight-2026-08-17, tokens verified against
// PapeXV2/theme/tokens.ts — treat that doc as the implementation spec for
// every value below; section references in comments point back into it).
//
// Tokens are inlined as style props rather than added to tailwind.config.ts,
// deliberately — this repo's `orange`/`navy` Tailwind classes are CSS-var-
// backed and belong to the marketing site's palette (see
// tailwind.config.ts), a different (lighter, more saturated) orange than
// the app's. Reusing those classes here would silently pull in the wrong
// color if the marketing palette ever changes. Source of truth: the design
// kit doc above, itself sourced from PapeXV2/theme/tokens.ts.
//
// The corner-lit glass ring (Layer 2 of the glass-card recipe) lives in
// glass.module.css — a masked radial-gradient ring per tier, and CSS custom
// properties can't cleanly express a mask-composite recipe as inline
// style, so that one piece is a real stylesheet rather than inline props.
//
// All server components except where noted — SaveToPapex.tsx and
// RetryButton.tsx are their own "use client" islands, imported here.

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, FlaskConical, SearchX } from "lucide-react";
import type { DecodedLogo, DecodedRasterPage, ReceiptLine } from "@/lib/escpos";
import {
  type ReceiptSummary,
  detectPaymentMethod,
  extractLastFour,
  PAYMENT_METHOD_STYLES,
} from "@/lib/receiptSummary";
import SaveToPapex from "./SaveToPapex";
import styles from "./glass.module.css";

const APP_STORE_URL = "https://apps.apple.com/us/app/papex/id6754945242";

// ---- Tokens (docs/PAPEX_DESIGN_KIT_FOR_WEB.md §1, §2) -----------------------
//
// `T` is what everything *inside* a glass card uses — cards are always a
// dark surface (§8), so these never change with the page shell's light/dark
// state. Shell-level chrome that sits directly on the page background
// (header kicker, empty-state copy) uses the theme-aware CSS custom
// properties defined in glass.module.css's `.shell` class instead — see the
// `S` token group below.

const T = {
  navy: "#00121D",
  orange: "#EB7100", // THE brand accent. Never the important-tier rim orange (#e88036) — see §2 note.
  orangeRim: "#e88036", // important-tier ring color only — never a fill, never a CTA.
  blue: "#0088EA", // semantic info blue (subtotal callout, links) — NOT the rim "standard" blue.
  text: "rgba(255, 255, 255, 0.90)",
  textSecondary: "rgba(255, 255, 255, 0.64)",
  textMuted: "rgba(255, 255, 255, 0.45)",
  divider: "rgba(255, 255, 255, 0.10)",
  success: "#34C759",
  error: "#FF3B30",
  warning: "#FFB800",
  orange20: "rgba(235, 113, 0, 0.20)",
  orange12: "rgba(235, 113, 0, 0.12)",
  orange08: "rgba(235, 113, 0, 0.08)",
};

// Shell-level text tokens — theme-aware via CSS custom properties set on
// `.shell` (glass.module.css), which swap under `prefers-color-scheme:
// light` to the spec's `colorsLight` values. Only for text painted directly
// on the page background, never for card interiors.
const S = {
  text: "var(--page-text)",
  textSecondary: "var(--page-text-secondary)",
  textMuted: "var(--page-text-muted)",
};

// ---- Shell ------------------------------------------------------------------

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className={`min-h-screen w-full ${styles.shell} ${styles.shellBg}`} style={{ color: T.text }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center gap-3 px-1">
          {/* PapeX brand logo — docs/PAPEX_DESIGN_KIT_FOR_WEB.md §4. The
              same artwork (main_logo.png, MD5-identical to
              PapeXV2/assets/logos/main_logo.png) the App Clip's own
              receipt view uses for its brand lockup. This is the PapeX
              brand mark; it is never the merchant's logo — see LogoBlock
              below for that, and the hierarchy note there. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/main_logo.png" alt="PapeX" className="h-6 w-auto shrink-0" style={{ objectFit: "contain" }} />
          <span
            className="ml-auto text-xs font-medium uppercase tracking-wide"
            style={{ color: S.textMuted }}
          >
            Receipt
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </div>
    </main>
  );
}

// ---- Glass card primitive (docs/PAPEX_DESIGN_KIT_FOR_WEB.md §2) -------------
//
// `emphasis` picks the tier: "none" (frost + inset shadow, no ring, no
// glow — used for quiet/supporting surfaces), "neutral" (white ring, no
// hue), "standard" (the #7FC4EC rim blue — "the substance of the
// purchase"), "important" (the #e88036 rim orange — "the amount actually
// paid", the one sanctioned second-orange in the whole system). Ranking
// orange > blue > white is doubly-validated per §7's closing note.
//
// No `backdrop-blur` anywhere here — see glass.module.css's file header for
// why that's a deliberate, spec-mandated omission rather than an oversight.

type Emphasis = "none" | "neutral" | "standard" | "important";

const GLOW_CLASS: Record<Exclude<Emphasis, "none">, string> = {
  neutral: styles.glowNeutral,
  standard: styles.glowStandard,
  important: styles.glowImportant,
};

const RING_CLASS: Record<Exclude<Emphasis, "none">, string> = {
  neutral: styles.ringNeutral,
  standard: styles.ringStandard,
  important: styles.ringImportant,
};

export function GlassCard({
  children,
  className = "",
  emphasis = "none",
  radius,
}: {
  children: ReactNode;
  className?: string;
  emphasis?: Emphasis;
  /** Corner radius in px. Defaults to 24 (the card recipe's built-in radius) — pass 9999 for a circular badge. */
  radius?: number;
}) {
  const radiusStyle = radius != null ? { borderRadius: radius } : undefined;
  const card = (
    <div
      className={`${styles.card} ${emphasis !== "none" ? RING_CLASS[emphasis] : ""} ${className}`}
      style={radiusStyle}
    >
      {children}
    </div>
  );
  if (emphasis === "none") return card;
  return (
    <div className={`${styles.wrap} ${GLOW_CLASS[emphasis]}`} style={radiusStyle}>
      {card}
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
        className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        style={{
          background: "rgba(107, 51, 0, 0.90)",
          borderColor: T.orange20,
          color: "#FFD9A8",
        }}
      >
        <FlaskConical className="h-4 w-4 shrink-0" style={{ color: T.orange }} strokeWidth={2} />
        {/* min-w-0 lets this shrink inside the flex row instead of forcing
            the row (and the page) wider than the viewport — a flex item's
            default min-width is its unwrapped content width, not 0. */}
        <span className="min-w-0">
          <strong className="font-medium" style={{ color: "#FFF0DC" }}>
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
  <g font-family='Barlow, Helvetica, Arial, sans-serif' font-size='26' font-weight='500' letter-spacing='7' fill='rgba(235,113,0,0.16)'>
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
        borderColor: T.orange20,
        background: T.orange08,
      }}
    >
      <span
        className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full border px-3 py-[3px] text-[10px] font-semibold uppercase tracking-[1.5px]"
        style={{
          background: "#1B1408",
          borderColor: T.orange20,
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
      <GlassCard emphasis="neutral" radius={9999} className="mb-4 flex h-14 w-14 items-center justify-center">
        <SearchX className="h-6 w-6" style={{ color: S.textMuted }} strokeWidth={1.75} />
      </GlassCard>
      <h1 className="font-barlow text-xl font-medium" style={{ color: S.text }}>
        Receipt not available
      </h1>
      <p className="mt-2 max-w-[19rem] text-sm" style={{ color: S.textSecondary }}>
        We couldn&apos;t find a receipt for this link. The link may have been
        mistyped or cut short when it was shared, or this receipt isn&apos;t in
        our system.
      </p>
      <p className="mt-3 max-w-[19rem] text-sm" style={{ color: S.textMuted }}>
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
      <GlassCard emphasis="neutral" radius={9999} className="mb-4 flex h-14 w-14 items-center justify-center">
        <Icon className="h-6 w-6" style={{ color: S.textMuted }} strokeWidth={1.75} />
      </GlassCard>
      <h1 className="font-barlow text-xl font-medium" style={{ color: S.text }}>
        {title}
      </h1>
      <p className="mt-2 max-w-xs text-sm" style={{ color: S.textSecondary }}>
        {message}
      </p>
      {children}
    </div>
  );
}

// ---- Logo (decoded ESC/POS raster, see lib/escpos.ts) --------------------------
//
// The MERCHANT's logo — decoded from the receipt bytes themselves, distinct
// from the PapeX brand logo in the header above. Rendered above the receipt
// cards, centered, in a quiet unemphasized glass frame (emphasis="none": no
// colored ring, no glow) so it reads as a display case for someone else's
// mark rather than a second competing brand moment — the PapeX wordmark in
// the header carries all of the "whose product is this" weight; this card
// only has to say "here's what was on the paper."
//
// The decoded bitmap is a 2-color PNG (transparent background, near-white
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
      <GlassCard emphasis="none" className="flex max-w-[240px] items-center justify-center px-6 py-5" radius={20}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.dataUri}
          alt="Merchant logo"
          width={logo.widthPx}
          height={logo.heightPx}
          className="h-auto w-full max-h-[120px]"
          style={{ imageRendering: "pixelated" }}
        />
      </GlassCard>
    </div>
  );
}

// ---- Full-page raster receipt (Star Line Mode, see lib/starRaster.ts) ----------
//
// Not a logo — the whole receipt, as a picture. Blaze POS renders the tape
// to a 1bpp bitmap and sends it as Star raster, so the merchant name, the
// items and the total only exist as pixels. This card is therefore the
// primary content of the page, which is why it takes the `standard` tier
// ("the substance of the purchase", §2/§7) rather than LogoBlock's quiet
// unemphasized frame.
//
// Colour: the source bitmap is black ink on white paper, but lib/png.ts
// emits a transparent background and paints only the set bits, in
// lib/escpos.ts's LOGO_FOREGROUND (#E6E7E8 — T.text flattened to an opaque
// hex). So this renders as light ink directly on the card's navy glass,
// exactly like the text receipt beside it, in both light and dark theme.
// The alternative — a real black-on-white scan — would be a hard white slab
// floating on a dark page in every theme, which is the failure mode §8's
// "the card itself stays a dark surface" rule exists to prevent.
//
// Sharpness: `.rasterInk` (glass.module.css) picks the scaler by device
// pixel ratio. A 552px bitmap in a 430px-max column is a downscale on a 1x
// display, where nearest-neighbour would eat entire 1px strokes out of the
// receipt's type — so 1x gets the browser's smooth scaler. On a 2x/3x phone
// (the entire real audience) the same layout is an UPSCALE in device pixels,
// where smooth scaling is what looks blurry, so those get `pixelated` and
// the 1-bit edges stay hard.
//
// Padding is deliberately tighter than the other cards (px-3) — every px of
// column width is a px of receipt legibility on a phone. A plain `<img>`,
// not next/image, for the same reason as LogoBlock: it's a `data:` URI.

function RasterReceiptCard({ page }: { page: DecodedRasterPage }) {
  return (
    <GlassCard emphasis="standard" className="px-3 py-4" radius={20}>
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.dataUri}
          alt="Your receipt, as printed"
          width={page.widthPx}
          height={page.heightPx}
          className={`h-auto w-full ${styles.rasterInk}`}
          style={{ maxWidth: page.widthPx }}
        />
      </div>
    </GlassCard>
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
    <GlassCard emphasis="standard" className="p-6">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white"
          style={{ border: `2px solid ${T.orange}` }}
        >
          <span className="text-xl font-medium" style={{ color: T.navy }}>
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
            {isSample ? "Sample data — not a real purchase" : "RDH Receipt"}
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
      {/* Section title sits directly on the page background, not inside a
          card — use the theme-aware shell token (S), not the card-fixed T,
          so it stays legible if the page shell is ever viewed in light
          mode (§8). */}
      <p className="font-barlow mb-2 px-1 text-xl font-medium" style={{ color: S.text }}>
        Items Purchased
      </p>
      <GlassCard emphasis="standard" className="p-6">
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
              <span className="font-barlow min-w-0 flex-1 truncate text-base font-medium" style={{ color: T.text }}>
                {item.name}
              </span>
              <div className="flex shrink-0 flex-col items-end">
                {item.qty > 1 && (
                  <span className="text-xs" style={{ color: T.textMuted }}>
                    ×{item.qty}
                  </span>
                )}
                <span className="font-barlow text-base font-medium" style={{ color: T.text }}>
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
        className="rounded px-[7px] py-[3px] text-[11px] font-medium uppercase tracking-[0.5px]"
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
      <span className="text-base" style={{ color: labelColor }}>
        {label}
      </span>
      <span className="font-barlow text-base font-medium" style={{ color: valueColor }}>
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
      {/* Section title sits directly on the page background, not inside a
          card — use the theme-aware shell token (S), not the card-fixed T,
          so it stays legible if the page shell is ever viewed in light
          mode (§8). */}
      <p className="font-barlow mb-2 px-1 text-xl font-medium" style={{ color: S.text }}>
        Totals
      </p>
      {/* important tier — the one sanctioned second-orange (#e88036, rim
          only), reserved for "the amount actually paid" (§2/§7). */}
      <GlassCard emphasis="important" className="p-6">
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
              <span className="font-barlow text-xl font-medium" style={{ color: T.orange }}>
                Total
              </span>
              <span className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
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
                  className="rounded-full border px-3 py-[3px] text-[11px] font-medium uppercase tracking-[0.5px]"
                  style={{
                    borderColor: T.orange20,
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
      <summary className="list-none">
        <GlassCard emphasis="none" className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium" radius={16}>
          <span style={{ color: T.textSecondary }}>Original receipt</span>
          <span className="text-xs transition-transform group-open:rotate-180" style={{ color: T.textMuted }}>
            ▾
          </span>
        </GlassCard>
      </summary>
      <div className="mt-2">
        <GlassCard emphasis="none" className="overflow-x-auto p-4" radius={16}>
          <div className="font-mono leading-relaxed" style={{ color: T.textSecondary }}>
            {lines.map((line, i) => (
              <div key={i} className={`whitespace-pre ${alignClass(line.align)} ${styleClasses(line.style)}`}>
                {line.text.length === 0 ? " " : line.text}
              </div>
            ))}
          </div>
        </GlassCard>
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
  rasterPage,
}: {
  summary: ReceiptSummary;
  hasStructure: boolean;
  isSample?: boolean;
  /** Decoded merchant logo, if any — see lib/escpos.ts. Never set on the sample/demo path. */
  logo?: DecodedLogo;
  /**
   * Full-page receipt bitmap, when the POS printed the receipt as an image
   * rather than as text (see lib/starRaster.ts). Mutually exclusive with
   * text content by construction — a raster payload yields no lines — so
   * this replaces the card stack rather than sitting alongside it. Never set
   * on the sample/demo path.
   */
  rasterPage?: DecodedRasterPage;
}) {
  return (
    <div className="flex flex-col gap-4">
      {rasterPage && <RasterReceiptCard page={rasterPage} />}
      {logo && <LogoBlock logo={logo} />}
      {hasStructure && <MerchantHeaderCard summary={summary} isSample={isSample} />}
      {hasStructure && <ItemsCard summary={summary} />}
      {hasStructure && <TotalsCard summary={summary} isSample={isSample} />}
      {/* Skipped when there is no text at all (the raster path) — an empty,
          permanently-open "Original receipt" box reads as a broken page,
          which is the same defect lib/receiptState.ts documents. */}
      {summary.bodyLines.length > 0 && (
        <OriginalReceiptCollapsible lines={summary.bodyLines} defaultOpen={!hasStructure} />
      )}
    </div>
  );
}

// ---- CTA row: Save to PapeX + install links ------------------------------------

export function AppCta({ isAndroid }: { isAndroid: boolean }) {
  if (isAndroid) {
    return (
      <p className="text-center text-xs" style={{ color: S.textMuted }}>
        PapeX for Android isn&apos;t available yet.{" "}
        <Link href="/waitlist" className="font-medium underline underline-offset-2" style={{ color: T.orange }}>
          Join the waitlist
        </Link>{" "}
        to hear when it lands.
      </p>
    );
  }
  return (
    <p className="text-center text-xs" style={{ color: S.textMuted }}>
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
