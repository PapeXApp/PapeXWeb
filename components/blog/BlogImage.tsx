// components/blog/BlogImage.tsx
//
// A post image that can never crash the page on an unknown host: allow-listed
// hosts go through the optimiser, anything else renders `unoptimized` (see
// image.ts). Always `fill` — the caller's box sets the aspect ratio.

import Image from 'next/image'
import { resolvePostImage } from './image'

export function BlogImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string | null | undefined
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  const img = resolvePostImage(src)
  return (
    <Image
      src={img.src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!img.optimize}
      className={className}
    />
  )
}
