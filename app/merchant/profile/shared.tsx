"use client";

// app/merchant/profile/shared.tsx
//
// Pieces the Profile page and the Admin editor both use: section metadata,
// the list items a request can point at, safe image rendering for merchant
// data, the app-icon tile, a lightbox, color math, and formatters.
//
// Image URLs in a MerchantRecord are merchant data from arbitrary hosts, so
// they render through plain <img> (never next/image), with
// referrerPolicy="no-referrer", an allowlisted scheme (safeImageSrc), and a
// quiet fallback when they fail to load.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Gift,
  ImageOff,
  Megaphone,
  MessageSquare,
  Palette,
  Phone,
  Tag,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import type { MerchantRecord, Weekday } from "@/lib/merchantProfiles/types";
import type { ChangeRequestAction, ChangeRequestSection } from "@/lib/changeRequests/types";
import { safeImageSrc } from "@/lib/merchantProfilesClient";
import { useFocusTrap } from "../ui/primitives";
import { T } from "../ui/tokens";

// ---- Sections -------------------------------------------------------------------

export const SECTION_META: Record<ChangeRequestSection, { label: string; icon: LucideIcon; noun: string }> = {
  brand: { label: "Brand", icon: Palette, noun: "brand" },
  about: { label: "About", icon: FileText, noun: "description" },
  hours: { label: "Hours", icon: Clock, noun: "hours" },
  contact: { label: "Contact", icon: Phone, noun: "contact details" },
  menu: { label: "Menu", icon: UtensilsCrossed, noun: "menu items" },
  deals: { label: "Deals", icon: Tag, noun: "deals" },
  whatsNew: { label: "What's new", icon: Megaphone, noun: "updates" },
  loyalty: { label: "Loyalty program", icon: Gift, noun: "loyalty program" },
  other: { label: "Something else", icon: MessageSquare, noun: "anything" },
};

export const ACTION_LABEL: Record<ChangeRequestAction, string> = {
  update: "Update",
  add: "Add",
  remove: "Remove",
};

export const LIST_SECTIONS: ReadonlySet<ChangeRequestSection> = new Set(["menu", "deals", "whatsNew"]);

export interface SectionItem {
  id: string;
  label: string;
  sub?: string;
  group?: string;
}

/** lib/changeRequests/validate.ts MAX_ITEM_ID_CHARS (not exported; keep in sync). */
const MAX_ITEM_ID_CHARS = 100;

/**
 * Menu items have an OPTIONAL id in the contract. Items without one are sent
 * as "Name (Category)": the server's resolveItemLabels returns an unknown id
 * as its own label, so the admin inbox still reads "Blue Dream (Pre-rolls)"
 * instead of an opaque key. Truncated to the server's id length limit.
 */
export function menuItemKey(category: string, item: { id?: string; name: string }): string {
  if (item.id) return item.id;
  const name = item.name?.trim() || "Untitled item";
  return (category?.trim() ? `${name} (${category.trim()})` : name).slice(0, MAX_ITEM_ID_CHARS);
}

export function sectionItems(record: MerchantRecord | null, section: ChangeRequestSection): SectionItem[] {
  if (!record) return [];
  switch (section) {
    case "menu":
      return (record.menu ?? []).flatMap((cat) =>
        (cat.items ?? []).map((item) => ({
          id: menuItemKey(cat.category, item),
          label: item.name || "Untitled item",
          sub: Number.isFinite(item.price) ? formatPrice(item.price) : undefined,
          group: cat.category || "Menu",
        }))
      );
    case "deals":
      return (record.deals ?? []).map((d) => ({ id: d.id, label: d.title || "Untitled deal", sub: d.schedule }));
    case "whatsNew":
      return (record.whatsNew ?? []).map((u) => ({
        id: u.id,
        label: u.title || "Untitled update",
        sub: u.postedOn ? formatDay(u.postedOn) : undefined,
      }));
    default:
      return [];
  }
}

// ---- Color math -------------------------------------------------------------------

const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function isHex(v: string | undefined | null): v is string {
  return !!v && HEX6.test(v);
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** White or near-black, whichever reads better on EVERY given stop. */
export function inkOn(...stops: string[]): string {
  const dark = "#0B0F14";
  const valid = stops.filter(isHex);
  if (valid.length === 0) return "#FFFFFF";
  const lums = valid.map(luminance);
  const whiteWorst = Math.min(...lums.map((l) => contrast(l, 1)));
  const darkWorst = Math.min(...lums.map((l) => contrast(l, luminance(dark))));
  return whiteWorst >= darkWorst ? "#FFFFFF" : dark;
}

export function initials(name: string | undefined): string {
  const words = (name ?? "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ---- Formatters ---------------------------------------------------------------------

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const DATETIME_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const PRICE_FMT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function validDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso: string | undefined): string {
  const d = validDate(iso);
  return d ? DATE_FMT.format(d) : "";
}

export function formatDateTime(iso: string | undefined): string {
  const d = validDate(iso);
  return d ? DATETIME_FMT.format(d) : "";
}

/** "YYYY-MM-DD" as a calendar day (not shifted by the browser's zone). */
export function formatDay(ymd: string | undefined): string {
  if (!ymd) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return DATE_FMT.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function formatPrice(n: number | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? PRICE_FMT.format(n) : "";
}

/** "13:30" -> "1:30 PM". */
export function formatClock(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  if (!m) return hhmm ?? "";
  const h = Number(m[1]) % 24;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

export function relativeTime(iso: string | undefined): string {
  const d = validDate(iso);
  if (!d) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

/** Monday-first display order; Weekday stays 0 = Sunday per the contract. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function zoneLabel(tz: string | undefined): string {
  if (!tz) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longGeneric" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}

/** Today's weekday in `tz` (browser zone if unset or unknown). */
export function todayIn(tz: string | undefined): Weekday {
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: tz || undefined, weekday: "short" }).format(new Date());
    const i = DAY_SHORT.indexOf(name);
    if (i >= 0) return i as Weekday;
  } catch {
    // unknown zone: fall through
  }
  return new Date().getDay() as Weekday;
}

// ---- Safe image ----------------------------------------------------------------------

export function SafeImg({
  src,
  alt,
  className = "",
  style,
  fallback,
  onLoad,
}: {
  src: string | undefined | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  onLoad?: (img: HTMLImageElement) => void;
}) {
  const safe = safeImageSrc(src);
  const [failed, setFailed] = useState<string | null>(null);
  if (!safe || failed === safe) {
    return (
      <>
        {fallback ?? (
          <div
            className={`flex items-center justify-center ${className}`}
            style={{ ...style, background: "rgba(255,255,255,0.04)", color: T.textMuted }}
            role="img"
            aria-label={alt ? `${alt} (image unavailable)` : "Image unavailable"}
          >
            <ImageOff className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
      </>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- merchant data from arbitrary hosts; next/image needs a host allowlist
    <img
      src={safe}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(safe)}
      onLoad={(e) => onLoad?.(e.currentTarget)}
    />
  );
}

// ---- App icon tile (mirrors PapeXV2 components/coupons/StoreAppIcon) ------------------

/** Apple's app-icon corner ratio, same constant the app uses. */
const ICON_RADIUS = 0.225;
const aspectBySrc = new Map<string, number>();

export function AppIconTile({
  name,
  logoUrl,
  brandColor,
  brandColorSecondary,
  size,
}: {
  name: string;
  logoUrl?: string;
  brandColor?: string;
  brandColorSecondary?: string;
  size: number;
}) {
  const primary = isHex(brandColor) ? brandColor : undefined;
  const secondary = primary && isHex(brandColorSecondary) ? brandColorSecondary : undefined;
  const stops = primary ? [primary, secondary ?? primary] : ["#2A3140", "#1B2130"];
  const ink = inkOn(...stops);
  const [aspect, setAspect] = useState<number | undefined>(logoUrl ? aspectBySrc.get(logoUrl) : undefined);
  useEffect(() => setAspect(logoUrl ? aspectBySrc.get(logoUrl) : undefined), [logoUrl]);
  // Square-ish logos go edge to edge; wordmarks are contained with a 12% inset.
  const wordmark = aspect !== undefined && (aspect < 0.8 || aspect > 1.25);
  const inset = wordmark ? Math.round(size * 0.12) : 0;
  const radius = Math.round(size * ICON_RADIUS);

  return (
    <div
      aria-hidden
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 100%)`,
      }}
    >
      {logoUrl && safeImageSrc(logoUrl) ? (
        <SafeImg
          src={logoUrl}
          alt=""
          className="absolute object-contain"
          style={{ inset, width: size - inset * 2, height: size - inset * 2 }}
          onLoad={(img) => {
            if (!img.naturalWidth || !img.naturalHeight) return;
            const a = img.naturalWidth / img.naturalHeight;
            aspectBySrc.set(logoUrl, a);
            setAspect(a);
          }}
          fallback={<Initials name={name} size={size} ink={ink} />}
        />
      ) : (
        <Initials name={name} size={size} ink={ink} />
      )}
      <span
        className="pointer-events-none absolute inset-0 border"
        style={{ borderRadius: radius, borderColor: "rgba(255,255,255,0.14)" }}
      />
    </div>
  );
}

function Initials({ name, size, ink }: { name: string; size: number; ink: string }) {
  return (
    <span className="font-barlow font-medium" style={{ fontSize: Math.round(size * 0.36), letterSpacing: -size * 0.008, color: ink }}>
      {initials(name)}
    </span>
  );
}

// ---- Swatch ----------------------------------------------------------------------------

export function Swatch({ label, hex }: { label: string; hex: string | undefined }) {
  const ok = isHex(hex);
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="h-9 w-9 shrink-0 rounded-xl border"
        style={{
          borderColor: T.glassBorder,
          background: ok
            ? hex
            : "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 8px)",
        }}
        aria-hidden
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-xs" style={{ color: T.textMuted }}>
          {label}
        </span>
        <span className="font-mono text-sm uppercase" style={{ color: ok ? T.text : T.textMuted }}>
          {ok ? hex : "Not set"}
        </span>
      </span>
    </div>
  );
}

// ---- Lightbox -----------------------------------------------------------------------------

export interface LightboxImage {
  src: string;
  name?: string;
}

export function Lightbox({
  images,
  index,
  onClose,
  onIndex,
  actions,
}: {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
  /** Extra buttons for the current image (admin: "Use as logo"). */
  actions?: (img: LightboxImage, i: number) => ReactNode;
}) {
  const open = index !== null && index >= 0 && index < images.length;
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (images.length < 2 || index === null) return;
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onIndex]);

  if (!open || index === null || typeof document === "undefined") return null;
  const img = images[index];
  const navBtn =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70";

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={img.name ? `Picture: ${img.name}` : "Picture"}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col bg-black/85 outline-none backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0 truncate text-sm" style={{ color: T.textSecondary }}>
          {img.name}
          {images.length > 1 && ` (${index + 1} of ${images.length})`}
        </span>
        <div className="flex items-center gap-2">
          {actions?.(img, index)}
          <button type="button" onClick={onClose} aria-label="Close" className={navBtn}>
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={onClose}>
        <SafeImg
          src={img.src}
          alt={img.name ?? ""}
          className="max-h-full max-w-full rounded-xl object-contain"
          fallback={
            <div className="flex flex-col items-center gap-2 text-sm" style={{ color: T.textMuted }}>
              <ImageOff className="h-6 w-6" />
              {"This picture can't be previewed here."}
            </div>
          }
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous picture"
              onClick={(e) => {
                e.stopPropagation();
                onIndex((index - 1 + images.length) % images.length);
              }}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${navBtn}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next picture"
              onClick={(e) => {
                e.stopPropagation();
                onIndex((index + 1) % images.length);
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${navBtn}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/** A deal image's width / height: the record's imageAspectRatio (default 3:2), kept to a sane range. */
export function dealImageRatio(r: number | undefined): number {
  return typeof r === "number" && Number.isFinite(r) && r > 0 ? Math.min(4, Math.max(0.5, r)) : 3 / 2;
}

/** Checkerboard behind attachment thumbs, so a transparent or tiny image still reads as a picture. */
const CHECKER = "repeating-conic-gradient(rgba(255,255,255,0.09) 0% 25%, rgba(255,255,255,0.03) 0% 50%) 50% / 12px 12px";

/** Small clickable thumbnail used in request cards: a framed square tile, file name on hover. */
export function Thumb({ src, name, onClick, size = 72 }: { src: string; name: string; onClick: () => void; size?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${name}`}
      title={name}
      className="relative shrink-0 overflow-hidden rounded-xl border border-white/[0.18] transition hover:border-white/40 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
      style={{ width: size, height: size, background: CHECKER }}
    >
      <SafeImg src={src} alt="" className="h-full w-full object-cover" style={{ width: size, height: size }} />
    </button>
  );
}
