"use client";

// app/r/SharedReceiptPhoto.tsx
//
// The receipt PHOTO on a peer-to-peer share link (`/r?rid=`, 1.7.2 #30).
//
// A client island for exactly one reason: the page must stay a text receipt
// when the image does not arrive. The function answers 404 for a photo it will
// not serve (a receipt binned a moment ago, an object that is gone, a type a
// browser cannot show), a phone can lose signal halfway through 1.5 MB, and
// none of that may leave a broken-image icon on someone else's receipt. So the
// section starts as "loading", becomes "loaded" on the image's own load event,
// and on an error renders NOTHING (not even its title): the page is then
// byte-for-byte the text-only page it was before.
//
// The image can finish (or fail) BEFORE React hydrates and attaches
// onLoad/onError: the <img> is in the server HTML, and a fast photo beats a
// slow hydration. The effect below reads the element's own `complete` /
// `naturalWidth` once hydrated, so that race cannot strand a failed image on
// screen.
//
// `src` is built by lib/sharedReceipt.ts (`sharedReceiptPhotoUrl`): the
// function, `&photo=1`. It carries no Storage token; the bytes come with their
// metadata already stripped. `referrerPolicy="no-referrer"` keeps the page's
// own URL (which holds the receipt id) out of the request's Referer. A plain
// `<img>` and not next/image on purpose: the function is the optimizer and the
// authority, and next/image would route the bytes through Vercel (4.5 MB cap).

import { useEffect, useRef, useState, type Ref } from "react";
import { GlassCard, S } from "./chrome";

export type PhotoStatus = "loading" | "loaded" | "failed";

/** What an <img> element says about itself, or "loading" when it is not done. */
export function statusOfImage(img: { complete: boolean; naturalWidth: number } | null | undefined): PhotoStatus {
  if (!img || !img.complete) return "loading";
  return img.naturalWidth > 0 ? "loaded" : "failed";
}

/**
 * The section as a pure function of its status: "failed" renders nothing at
 * all, so a photo that did not arrive leaves the page as the text-only page.
 * Split out so that rule can be tested without a browser.
 */
export function PhotoSectionView({
  src,
  title,
  status,
  imgRef,
  onLoad,
  onError,
}: {
  src: string;
  title: string;
  status: PhotoStatus;
  imgRef?: Ref<HTMLImageElement>;
  onLoad?: () => void;
  onError?: () => void;
}) {
  if (status === "failed") return null;
  return (
    <section aria-label="Photo of the receipt">
      <p className="font-barlow mb-2 px-1 text-xl font-medium" style={{ color: S.text }}>
        {title}
      </p>
      <GlassCard emphasis="none" className="p-2" radius={16}>
        <a href={src} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Photo of the shared receipt"
            decoding="async"
            referrerPolicy="no-referrer"
            className="block h-auto w-full rounded-xl"
            style={status === "loaded" ? undefined : { minHeight: 140 }}
            onLoad={onLoad}
            onError={onError}
          />
        </a>
      </GlassCard>
    </section>
  );
}

export default function SharedReceiptPhoto({ src, title = "Receipt photo" }: { src: string; title?: string }) {
  const [status, setStatus] = useState<PhotoStatus>("loading");
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const settled = statusOfImage(ref.current);
    if (settled !== "loading") setStatus(settled);
  }, [src]);

  return (
    <PhotoSectionView
      src={src}
      title={title}
      status={status}
      imgRef={ref}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("failed")}
    />
  );
}
