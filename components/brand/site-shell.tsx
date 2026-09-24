// components/brand/site-shell.tsx
//
// Shared chrome for the redesigned site: the `.rd` token scope + the nav on
// every screen. Stays a server component so page content passed as `children`
// keeps rendering on the server.
//
// The footer is NOT mounted here. CustomerPath and BusinessPath each render
// <SiteFooter inFlow /> INSIDE their FlowGround, so it joins the page's ground
// crossfade instead of being a flat slab below it. The fork has no footer at
// all, and the ten legacy routes get theirs from
// components/framer/framer-page-shell.tsx.
//
// `<main>` (2026-09-24, docs/design/footer-landmark.md): the shell renders the
// `<main>` landmark ONLY for the fork. Every other SiteShell page is built on
// FlowGround (components/paths/shared/FlowGround.tsx), and FlowGround renders
// its own `<main>` so the footer can sit inside the flow but outside `<main>`
// (an a11y contentinfo landmark must not be a descendant of `<main>`). If the
// shell also rendered one, the page would have nested `<main>`s. A future
// SiteShell page that does NOT use FlowGround must pass `main` explicitly, or
// it will have no main landmark.
//
// `.rd` is the scope class that activates styles/papex-brand.css. Everything
// brand-new must live inside it; the legacy `.framer-site` pages must not.

import type { ReactNode } from 'react'
import { SiteNav, type SitePath } from './site-nav'
import { RememberPath } from './remember-path'

export function SiteShell({
  path,
  main = path === 'fork',
  children,
}: {
  path: SitePath
  /** Whether the shell wraps `children` in `<main>`. Defaults to true only for
   *  the fork; FlowGround pages own their `<main>`. */
  main?: boolean
  children: ReactNode
}) {
  // SiteShell is only ever mounted with 'fork' | 'customer' | 'business'
  // (the 'page' variant is rendered standalone by framer-page-shell.tsx, not
  // through here), but SitePath now also includes 'page', so narrow
  // explicitly rather than `!isFork` to keep RememberPath's stricter
  // PathChoice prop type-safe.
  const pathChoice = path === 'customer' || path === 'business' ? path : null
  return (
    <div className="rd">
      {pathChoice && <RememberPath choice={pathChoice} />}
      <SiteNav path={path} />
      {main ? <main>{children}</main> : children}
    </div>
  )
}
