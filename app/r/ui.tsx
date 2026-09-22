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
// Every component in this file is a server component, and nothing here may
// import a client island — same rule as chrome.tsx, for the same reason.
// `CtaRow`, the one piece that renders SaveToPapex (a "use client" island
// pulling in the Firebase auth SDK), lives in ./CtaRow.tsx; Next includes
// every client entry point reachable from a page's module graph whether it
// renders or not, so keeping it out of here is what lets the demo routes,
// app/rdh and app/merchant/tx/[sid] import these cards without shipping
// sign-in JS they never run. The island-free CTA (`DemoCtaRow`, below) is
// therefore safe to keep here.

import type { ReactNode } from "react";
import { AlertTriangle, Clock, FlaskConical, SearchX } from "lucide-react";
import type { DecodedLogo, DecodedRasterPage, ReceiptLine } from "@/lib/escpos";
import {
  type ReceiptSummary,
  detectPaymentMethod,
  extractLastFour,
  PAYMENT_METHOD_STYLES,
} from "@/lib/receiptSummary";
import styles from "./glass.module.css";
import { GlassCard, S, Shell, T } from "./chrome";
import { DecodedText } from "@/components/DecodedText";
import { APP_STORE_URL, PLAY_STORE_URL, type Platform } from "@/lib/storeLinks";

// Re-exported so `from "./ui"` keeps working for callers that want the
// receipt UI too; chrome-only routes should import from "./chrome".
export { GlassCard, Shell };

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

// Renders `headerDataUri` (ink-bounds-trimmed), not `dataUri` (the raw,
// untrimmed decode) — real captures showed the mark's ink is often
// asymmetrically off-center within its own declared canvas on both axes,
// which read as "the logo is off-center" even though this card's own flex
// container centers the box around it perfectly. See lib/escpos.ts's
// DecodedLogo.headerDataUri doc comment for the numbers.
function LogoBlock({ logo }: { logo: DecodedLogo }) {
  return (
    <div className="flex justify-center">
      <GlassCard emphasis="none" className="flex max-w-[240px] items-center justify-center px-6 py-5" radius={20}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.headerDataUri}
          alt="Merchant logo"
          width={logo.headerWidthPx}
          height={logo.headerHeightPx}
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

function RasterImage({ page }: { page: DecodedRasterPage }) {
  return (
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
  );
}

function RasterReceiptCard({ page }: { page: DecodedRasterPage }) {
  return (
    <GlassCard emphasis="standard" className="px-3 py-4" radius={20}>
      <RasterImage page={page} />
    </GlassCard>
  );
}

// ---- "Extracting" hint (shown under the image while OCR is still running) ----
//
// The honest version of a loading state. OCR takes ~46 s and the customer gets
// here ~15 s after the sale, so for the first half-minute this page shows a
// picture of a receipt with no items and no total, and says nothing about why.
// Without this line, the structured cards appearing later reads as a glitch;
// with it, it reads as the thing that was announced.
//
// Deliberately quiet — one muted line and a slow pulse, no spinner, no
// progress bar. The image below it is already a complete, usable receipt; this
// is a "there's more coming", not a "please wait".
//
// It never turns into an error. If the poll gives up, this simply disappears
// and the customer is left with exactly what shipped: their receipt, as a
// picture. Announcing a failure would be worse than saying nothing.

export function ExtractingHint() {
  return (
    <div className="flex items-center justify-center gap-2 px-1 pt-1" aria-live="polite">
      <span
        className={styles.extractingDot}
        aria-hidden
        style={{ background: T.orange }}
      />
      <span className="text-xs" style={{ color: S.textMuted }}>
        Reading your receipt&hellip;
      </span>
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
  logo,
}: {
  summary: ReceiptSummary;
  isSample?: boolean;
  /**
   * Decoded merchant logo, if any — see lib/escpos.ts. When present, its
   * `avatarDataUri` (trimmed to the mark's own ink bounds, recolored dark
   * for this circle's white fill) replaces the letter monogram. Falls back
   * to the monogram whenever there's no inline logo: no raster in the
   * stream, an NV/stored-logo reference (bitmap bytes not in this capture),
   * or a decode failure — all collapse to `logo` being undefined upstream
   * (app/r/page.tsx), so this component only needs one check. Never set on
   * the sample/demo path, so the sample keeps today's monogram unconditionally.
   */
  logo?: DecodedLogo;
}) {
  const { merchantName, addressLines, dateline } = summary;
  return (
    <GlassCard emphasis="standard" className="p-6">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
          style={{ border: `2px solid ${T.orange}` }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo.avatarDataUri}
              alt=""
              className="h-full w-full object-contain p-1.5"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <span className="text-xl font-medium" style={{ color: T.navy }}>
              {monogram(merchantName)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-barlow truncate text-2xl font-medium" style={{ color: T.text }}>
            {merchantName ? <DecodedText text={merchantName} /> : "Your receipt"}
          </h1>
          {addressLines.length > 0 && (
            <p className="mt-0.5 truncate text-sm" style={{ color: T.textMuted }}>
              <DecodedText text={addressLines.join(", ")} />
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
                <DecodedText text={item.name} />
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

function CollapsibleShell({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="list-none">
        <GlassCard emphasis="none" className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium" radius={16}>
          <span style={{ color: T.textSecondary }}>{label}</span>
          <span className="text-xs transition-transform group-open:rotate-180" style={{ color: T.textMuted }}>
            ▾
          </span>
        </GlassCard>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

export function OriginalReceiptCollapsible({
  lines,
  defaultOpen,
}: {
  lines: ReceiptLine[];
  defaultOpen: boolean;
}) {
  return (
    <CollapsibleShell label="Original receipt" defaultOpen={defaultOpen}>
      <GlassCard emphasis="none" className="overflow-x-auto p-4" radius={16}>
        <div className="font-mono leading-relaxed" style={{ color: T.textSecondary }}>
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre ${alignClass(line.align)} ${styleClasses(line.style)}`}>
              {line.text.length === 0 ? " " : line.text}
            </div>
          ))}
        </div>
      </GlassCard>
    </CollapsibleShell>
  );
}

// ---- Original receipt, when the "original" is a picture -----------------------
//
// Once OCR has read a Blaze bitmap, the structured cards are the receipt and
// the bitmap is the source document — so it moves into the SAME "Original
// receipt" collapsible a text receipt's verbatim body gets, one row of the
// hierarchy down from where it sits before OCR lands.
//
// Collapsed by default, unlike the text version's `defaultOpen={!hasStructure}`
// rule: reaching this component at all means structure exists, and leaving a
// full-page bitmap expanded under the cards would push the CTA off the bottom
// of a phone for no one's benefit. It is one tap away, always, which is the
// promise "view original image" has to keep — an extraction is an
// interpretation of the paper, and the paper stays available.

export function OriginalImageCollapsible({ page }: { page: DecodedRasterPage }) {
  return (
    <CollapsibleShell label="Original receipt" defaultOpen={false}>
      <GlassCard emphasis="none" className="px-3 py-4" radius={16}>
        <RasterImage page={page} />
      </GlassCard>
    </CollapsibleShell>
  );
}

// ---- Full receipt view (structured cards + raw fallback) -----------------------

export function ReceiptView({
  summary,
  hasStructure,
  isSample = false,
  logo,
  rasterPage,
  extracting = false,
}: {
  summary: ReceiptSummary;
  hasStructure: boolean;
  isSample?: boolean;
  /** Decoded merchant logo, if any — see lib/escpos.ts. Never set on the sample/demo path. */
  logo?: DecodedLogo;
  /**
   * Full-page receipt bitmap, when the POS printed the receipt as an image
   * rather than as text (see lib/starRaster.ts). Never set on the
   * sample/demo path.
   *
   * Its PLACEMENT depends on `hasStructure`, and that is the whole point of
   * this component now:
   *   - no structure (OCR hasn't landed, or failed) -> the bitmap IS the
   *     receipt and takes the primary "standard" card, as it shipped.
   *   - structure -> the designed cards are the receipt and the bitmap drops
   *     into the "Original receipt" collapsible at the bottom.
   */
  rasterPage?: DecodedRasterPage;
  /** Show the quiet "Reading your receipt…" hint under the image while OCR runs. */
  extracting?: boolean;
}) {
  // A bitmap receipt used to be, by construction, a receipt with no structure.
  // OCR breaks that: the same receipt can now have both, and when it does the
  // extracted fields lead and the picture becomes the source document.
  const imageIsPrimary = rasterPage != null && !hasStructure;

  return (
    <div className="flex flex-col gap-4">
      {imageIsPrimary && rasterPage && (
        <div>
          <RasterReceiptCard page={rasterPage} />
          {extracting && <ExtractingHint />}
        </div>
      )}
      {logo && <LogoBlock logo={logo} />}
      {hasStructure && <MerchantHeaderCard summary={summary} isSample={isSample} logo={logo} />}
      {hasStructure && <ItemsCard summary={summary} />}
      {hasStructure && <TotalsCard summary={summary} isSample={isSample} />}
      {/* Skipped when there is no text at all — an empty, permanently-open
          "Original receipt" box reads as a broken page, which is the same
          defect lib/receiptState.ts documents. */}
      {summary.bodyLines.length > 0 && (
        <OriginalReceiptCollapsible lines={summary.bodyLines} defaultOpen={!hasStructure} />
      )}
      {/* Demoted, not discarded. */}
      {!imageIsPrimary && rasterPage && <OriginalImageCollapsible page={rasterPage} />}
    </div>
  );
}

// ---- CTA row: Save to PapeX + install links ------------------------------------

export function AppCta({ platform }: { platform: Platform }) {
  // BOTH stores, always — the UA sniff only decides which one leads. PapeX
  // is live on Play as of 2026-08-20 (com.app.papex); this used to tell
  // every Android visitor the app "isn't available yet" and send them to a
  // waitlist, which was the only install path the page offered them. A UA
  // is also a guess: a desktop visitor, a requested-desktop-site phone, or
  // an in-app browser with a rewritten UA all land on "other" and still
  // need a way to the right store.
  const stores: { href: string; label: string }[] =
    platform === "android"
      ? [{ href: PLAY_STORE_URL, label: "Get PapeX on Google Play" }]
      : platform === "ios"
        ? [{ href: APP_STORE_URL, label: "Get PapeX on the App Store" }]
        : [
            { href: APP_STORE_URL, label: "App Store" },
            { href: PLAY_STORE_URL, label: "Google Play" },
          ];

  return (
    <p className="text-center text-xs" style={{ color: S.textMuted }}>
      {platform === "other" ? "Get PapeX — " : null}
      {stores.map((store, i) => (
        <span key={store.href}>
          {i > 0 ? " · " : null}
          <a
            href={store.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
            style={{ color: T.orange }}
          >
            {store.label}
          </a>
        </span>
      ))}{" "}
      to save every receipt automatically.
    </p>
  );
}

/**
 * The CTA row for a receipt that must not offer a claim: "Get PapeX" and
 * nothing else.
 *
 * Used by the demo routes (app/r/demo, app/demo/r) and by CtaRow's `isDemo`
 * branch, so both URLs that can surface a demo receipt render the identical
 * footer.
 *
 * Deliberately NOT a disabled "Save to PapeX" button. The disabled variant
 * SaveToPapex renders for `isSample` is captioned "Nothing to save — this is
 * a sample receipt", which is the SampleFrame/DemoBanner voice — full-strength
 * marking built for lib/receiptState.ts's `/r?demo=1` fallback, where a
 * customer might mistake fabricated content for their own purchase. A demo
 * tag is a different risk (see DemoDisclosure below), and regardless of
 * whether a given demo's data is invented or real-seeded, claiming is
 * single-owner per sid — so the Save button here is an action that can fail
 * in front of an audience either way, and at a booth the action we actually
 * want is "install PapeX", not "sign into an account you don't have to save
 * a receipt you didn't buy."
 *
 * Lives here, in the island-free half of this segment, so a demo route can
 * render a CTA without pulling SaveToPapex (and the Firebase auth SDK behind
 * it) into its module graph at all — see the note at the top of CtaRow.tsx.
 */
export function DemoCtaRow({ platform }: { platform: Platform }) {
  return (
    <div className="mt-2 flex flex-col items-center gap-4">
      <AppCta platform={platform} />
    </div>
  );
}

// ---- Demo-data disclosure ------------------------------------------------------
//
// One quiet caption for a receipt whose store, prices, and promotions were
// INVENTED for this demo — Hartwell's Market and Ellsworth Market, driven by
// `DemoReceiptEnrichment.fabricated` (lib/demoReceipts.ts) via
// `formatDemoDisclosure`. The Sunset Leaf bench tag sets neither and renders
// nothing here, because it really is real seeded data from a real
// provisioned merchant.
//
// DELIBERATELY NOT SampleFrame / DemoBanner (above in this file). Those exist
// to protect a customer from mistaking fabricated content for THEIR OWN real
// purchase (lib/receiptState.ts's `/r?demo=1` sample) — a repeating
// watermark, a dashed border and a pinned banner are proportionate to that
// risk. Nobody tapping a demo tag at a booth thinks Hartwell's Market printed
// for their own purchase; the risk here is an investor, reporter, or grocer
// assuming Hartwell's is a real chain, and one calm sentence answers that
// completely. The full-strength treatment's visual weight would read as the
// company hedging on its own demo, which is the opposite of the point.
//
// PLACEMENT (app/r/demo/page.tsx): directly under the receipt, above the
// value layer — after the structured card a screenshot at a loud booth is
// most likely to already include, before the pitch resumes below. That is
// what keeps this reading as a footnote rather than a disclaimer up front.
// Sits on the page background with no card, same treatment as AppCta below.
//
// Since cards P0 the demo routes draw this line as the first receipt card (a
// `disclosure` card, app/r/cards/DisclosureCard.tsx, identical markup), and
// this component is the reference app/r/cards/cards.test.tsx checks it against.

export function DemoDisclosure({ text }: { text: string }) {
  return (
    <p className="px-1 text-center text-xs" style={{ color: S.textMuted }}>
      {text}
    </p>
  );
}
