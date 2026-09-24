'use client'

// components/blog/GetAppButton.tsx
//
// "Get the app". Server-rendered with the App Store link (the page is ISR, so
// it can't read the User-Agent), then swapped to Google Play after hydration
// on Android — a hint, never a gate, same rule as lib/storeLinks.ts.

import { useEffect, useState } from 'react'
import { APP_STORE_URL, PLAY_STORE_URL, platformFromUserAgent } from '@/lib/storeLinks'

export function GetAppButton({ className }: { className?: string }) {
  const [href, setHref] = useState(APP_STORE_URL)
  useEffect(() => {
    if (platformFromUserAgent(navigator.userAgent) === 'android') setHref(PLAY_STORE_URL)
  }, [])
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      Get the app
    </a>
  )
}
