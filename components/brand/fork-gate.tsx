'use client'

// components/brand/fork-gate.tsx
//
// Decides whether a visitor to `/` sees the fork or is sent to the side they
// already chose, WITHOUT ever flashing the fork.
//
// How the no-flash works, in order:
//  1. app/page.tsx embeds FORK_SKIP_SCRIPT inline, above the fork markup. It
//     runs during HTML parse and stamps <html data-fork-skip> if a choice is
//     stored. papex-brand.css turns that into `visibility:hidden` on .rd-fork,
//     so the fork is never painted.
//  2. This component then does the actual navigation with router.replace, so
//     it stays a soft navigation.
//  3. The attribute is cleared on unmount (i.e. once the redirect lands), and
//     by clearPathChoice() when the logo / nav "Home" is used.
//
// The redirect is gated on the attribute — not just on storage — on purpose:
// the inline script only runs on a real document load, so a soft navigation
// back to `/` (browser Back, or a link) shows the fork instead of bouncing the
// visitor forward, which would make the Back button feel broken.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FORK_SKIP_ATTR, PATH_HREF, getPathChoice } from '@/lib/pathChoice'
import { Fork } from './fork'

export function ForkGate() {
  const router = useRouter()

  useEffect(() => {
    const root = document.documentElement
    const armed = root.hasAttribute(FORK_SKIP_ATTR)
    const choice = getPathChoice()

    if (armed && choice) {
      router.replace(PATH_HREF[choice])
    } else {
      // Stale attribute (storage cleared in another tab, say) — reveal the fork.
      root.removeAttribute(FORK_SKIP_ATTR)
    }

    return () => root.removeAttribute(FORK_SKIP_ATTR)
  }, [router])

  return <Fork />
}
