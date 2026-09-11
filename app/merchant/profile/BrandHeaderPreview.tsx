"use client";

// app/merchant/profile/BrandHeaderPreview.tsx
//
// A faithful-enough miniature of the PapeX app's store profile hero
// (PapeXV2 app/store/[id].tsx): the merchant's brand-gradient wash on the
// app's dark ground, their app-icon tile (logo edge to edge, or initials on
// the brand field), name, "Category · Open now"-style line, and blurb.
//
// This is the ONE place on the dashboard where a merchant's brand colors are
// painted. Everything around it stays on the App Clip palette.
//
// Used by the Profile page header, the Brand request composer (live, as the
// merchant picks colors / a logo), and the Admin editor (live, as staff edit).

import { AppIconTile, isHex, withAlpha } from "./shared";
import { T } from "../ui/tokens";

/** The app's dark ground under the wash. */
const APP_GROUND = "#0B1219";

export interface BrandHeaderPreviewProps {
  name: string;
  logoUrl?: string;
  brandColor?: string;
  brandColorSecondary?: string;
  category?: string;
  blurb?: string;
  /** Smaller type and icon, for the composer and editor side column. */
  compact?: boolean;
  /** Eyebrow above the card. Pass null to hide. */
  caption?: string | null;
}

export function BrandHeaderPreview({
  name,
  logoUrl,
  brandColor,
  brandColorSecondary,
  category,
  blurb,
  compact,
  caption = "How it looks in the PapeX app",
}: BrandHeaderPreviewProps) {
  const primary = isHex(brandColor) ? brandColor : undefined;
  const secondary = primary && isHex(brandColorSecondary) ? brandColorSecondary : undefined;
  const wash = primary
    ? `linear-gradient(135deg, ${withAlpha(primary, 0.62)} 0%, ${withAlpha(secondary ?? primary, secondary ? 0.42 : 0.12)} 70%, ${withAlpha(
        secondary ?? primary,
        0
      )} 100%)`
    : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)";
  const icon = compact ? 48 : 64;
  const displayName = name.trim() || "Your store";

  return (
    <figure className="flex flex-col gap-2">
      {caption && (
        <figcaption className="text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
          {caption}
        </figcaption>
      )}
      <div
        className={`relative overflow-hidden rounded-[20px] border ${compact ? "p-3" : "p-4 md:p-5"}`}
        style={{ background: APP_GROUND, borderColor: T.glassBorder }}
      >
        <div aria-hidden className="absolute inset-0 transition-[background] duration-300" style={{ background: wash }} />
        <div
          className={`relative flex items-center gap-3.5 rounded-2xl border backdrop-blur-md ${compact ? "p-3" : "p-3.5 md:p-4"}`}
          style={{ background: "rgba(11, 18, 25, 0.42)", borderColor: "rgba(255,255,255,0.14)" }}
        >
          <AppIconTile
            name={displayName}
            logoUrl={logoUrl}
            brandColor={primary}
            brandColorSecondary={secondary}
            size={icon}
          />
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-barlow font-medium leading-tight ${compact ? "text-base" : "text-lg md:text-xl"}`}
              style={{ color: "#FFFFFF" }}
            >
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
              {category?.trim() || "Category"}
              <span aria-hidden> · </span>
              <span style={{ color: "#6EE7B7" }}>Open now</span>
            </p>
            {blurb?.trim() && (
              <p
                className={`mt-1.5 text-sm leading-snug ${compact ? "line-clamp-2" : "line-clamp-3"}`}
                style={{ color: "rgba(255,255,255,0.86)" }}
              >
                {blurb}
              </p>
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

export default BrandHeaderPreview;
