"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { APP_MEDIA_ALT, getAppMedia } from "./appMediaIndex";

/**
 * Plays a real PapeXV2 screen capture inside one of the site's phone frames,
 * and falls back to the hand-drawn screen whenever that capture doesn't exist.
 *
 * `slot` maps 1:1 to a key in app-media/manifest.json. Until someone drops a
 * file in app-media/inbox and runs `npm run media:import`, every slot is
 * absent and every phone on /customers renders exactly what it rendered
 * before — the fallback is the default state, not an error path.
 *
 * When media IS present it replaces the WHOLE screen area: a real capture
 * already carries its own status bar and Dynamic Island cutout, so it is
 * layered above the drawn ones (z-index 20; the drawn status bar sits at 10).
 * The frame around it still draws the bezel, so this element paints no border.
 *
 * Intentionally a plain <img>, not next/image: these live under public/ at a
 * fixed size inside a container-query-scaled phone, so the optimizer would only
 * add a second, blurrier source of truth.
 */
export function AppMedia({
  slot,
  fallback,
  className,
  fit = "cover",
}: {
  slot: string;
  fallback: ReactNode;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const media = getAppMedia(slot);
  const prefersReduced = useReducedMotion();

  // No capture for this slot — render the drawn screen untouched, with no
  // wrapper of our own so the phone's own flex layout is unaffected.
  if (!media) return <>{fallback}</>;

  const alt = APP_MEDIA_ALT[slot] ?? "";
  const style: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    width: "100%",
    height: "100%",
    objectFit: fit,
    display: "block",
    border: "none",
  };

  if (media.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.png} alt={alt} className={className} style={style} draggable={false} />;
  }

  // Reduced motion: the poster says the same thing without the movement.
  if (prefersReduced) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.poster} alt={alt} className={className} style={style} draggable={false} />;
  }

  return (
    <video
      className={className}
      style={style}
      autoPlay
      muted
      loop={media.loop !== false}
      playsInline
      poster={media.poster}
      preload="metadata"
      aria-label={alt}
    >
      <source src={media.webm} type="video/webm" />
      <source src={media.mp4} type="video/mp4" />
    </video>
  );
}
