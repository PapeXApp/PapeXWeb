// components/brand/site-shell.tsx
//
// Shared chrome for the redesigned site: the `.rd` token scope + the nav on
// every screen, plus the dark footer on the two path pages. Stays a server
// component so page content passed as `children` keeps rendering on the server.
//
// `.rd` is the scope class that activates styles/papex-brand.css. Everything
// brand-new must live inside it; the legacy `.framer-site` pages must not.

import type { ReactNode } from 'react'
import { SiteNav, type SitePath } from './site-nav'
import { SiteFooter } from './site-footer'
import { RememberPath } from './remember-path'

export function SiteShell({
  path,
  children,
}: {
  path: SitePath
  children: ReactNode
}) {
  const isFork = path === 'fork'
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
      <main>{children}</main>
      {!isFork && <SiteFooter />}
    </div>
  )
}
