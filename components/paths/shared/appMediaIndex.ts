/**
 * The one place that knows which real app captures exist.
 *
 * public/app/media/index.json is written by `npm run media:import`
 * (scripts/import-app-media.mjs). It is committed as `{}` so this static
 * import always resolves — an absent file would be a build error, not a
 * graceful fallback.
 *
 * Deliberately NOT a client module: server components (FeatureScreens) need to
 * read it too, and a "use client" file's exports become client references.
 */
import rawIndex from "@/public/app/media/index.json";

export type AppMediaEntry =
  | {
      type: "video";
      mp4: string;
      webm: string;
      poster: string;
      /** From the manifest's `loop` key; videos loop unless told otherwise. */
      loop?: boolean;
      width: number;
      height: number;
      updatedAt: string;
    }
  | {
      type: "image";
      png: string;
      width: number;
      height: number;
      updatedAt: string;
    };

const index = rawIndex as Record<string, AppMediaEntry>;

export function getAppMedia(slot: string): AppMediaEntry | undefined {
  return index[slot];
}

export function hasAppMedia(slot: string): boolean {
  return Boolean(index[slot]);
}

/**
 * Alt text per slot. Short on purpose: each of these sits inside a decorative
 * phone frame that the surrounding copy already explains.
 */
export const APP_MEDIA_ALT: Record<string, string> = {
  "hero-tap": "The PapeX app receiving a receipt from a tap",
  "receipts-search": "Searching receipts in the PapeX app",
  "share-sheet": "Sharing a PapeX receipt from iOS",
  walk: "The PapeX app receiving and filing a receipt",
  "walk-ready": "The PapeX app ready for a tap",
  "walk-receipt": "A receipt open in the PapeX app",
  "walk-list": "The receipt list in the PapeX app",
};
