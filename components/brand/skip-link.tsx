'use client'

// components/brand/skip-link.tsx
//
// "Skip to content" (Phase 4, s-07): the first tab stop on every page that
// uses the site chrome, invisible until a keyboard user tabs onto it
// (.rd-skip in styles/papex-brand.css). Both shells render it before the nav.
//
// Target: the page's one <main>. Every <main> the site renders carries
// id="main" (SiteShell's fork, FramerPageShell, and FlowGround for /customers,
// /business, /about, /blog), so the plain #main link works with JS off. The
// click handler still falls back to the first <main> and makes it focusable.

import type { MouseEvent } from 'react'
import { MAIN_ID } from './links'

export function SkipLink() {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const main =
      document.getElementById(MAIN_ID) ?? document.querySelector<HTMLElement>('main')
    if (!main) return
    event.preventDefault()
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
    main.focus({ preventScroll: true })
    main.scrollIntoView({ block: 'start' })
  }
  return (
    <a href={`#${MAIN_ID}`} className="rd-skip" onClick={onClick}>
      Skip to content
    </a>
  )
}
